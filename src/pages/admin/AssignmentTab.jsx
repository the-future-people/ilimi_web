import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  getSetupStatus, getSchoolClassrooms, getAssignments,
  createAssignment, updateAssignment, deleteAssignment, getSubjects,
  updateClassroom, setClassTeacher,
} from '../../api/academics'
import { getAllStaff } from '../../api/staff'

const BAND_LABELS = {
  early: 'Nursery & KG',
  lower: 'Lower primary',
  upper: 'Upper primary',
  jhs: 'JHS',
}
const BAND_ORDER = ['early', 'lower', 'upper', 'jhs']

const LOWER_PRIMARY = ['primary_1', 'primary_2', 'primary_3']

const groupFor = (levelName = '') => {
  if (levelName.startsWith('nursery') || levelName.startsWith('kindergarten')) return 'early'
  if (LOWER_PRIMARY.includes(levelName)) return 'lower'
  if (levelName.startsWith('primary')) return 'upper'
  return 'jhs'
}

function useToast() {
  const [toasts, setToasts] = useState([])
  const push = (message) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2600)
  }
  const ToastStack = () => (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-center gap-3 bg-navy text-white text-sm font-semibold pl-3 pr-5 py-2.5 rounded-full shadow-2xl border-l-4 border-gold animate-toast-in">
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" className="stroke-gold" strokeWidth="1.5" opacity="0.3" />
            <path d="M7 12.5l3 3 7-7" stroke="#c9a227" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength="1" className="animate-toast-check" />
          </svg>
          {t.message}
        </div>
      ))}
      <style>{`
        @keyframes toast-in { 0% { opacity: 0; transform: translateY(-16px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-toast-in { animation: toast-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes toast-check { 0% { stroke-dashoffset: 1; } 100% { stroke-dashoffset: 0; } }
        .animate-toast-check { stroke-dasharray: 1; stroke-dashoffset: 1; animation: toast-check 0.4s ease-out 0.15s forwards; }
      `}</style>
    </div>
  )
  return { push, ToastStack }
}

function TeacherSelect({ value, onChange, staff, placeholder = 'Choose teacher', className = '' }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className={`px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-gold bg-white ${className}`}
    >
      <option value="">{placeholder}</option>
      {staff.map((s) => (
        <option key={s.id} value={s.school_member_id}>{s.full_name}</option>
      ))}
    </select>
  )
}

function LowerBandCard({ classroom, termId, subjects, staff, assignments, onChanged, toast }) {
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const current = classroom.form_teacher
  const currentName = classroom.form_teacher_name
  const assignedCount = assignments.filter((a) => a.teacher).length

  const apply = async (teacherId) => {
    setSaving(true)
    try {
      const res = await setClassTeacher(classroom.id, { teacher: teacherId, term: termId })
      await onChanged()
      toast.push(res.message || 'Class teacher set')
    } catch (err) {
      toast.push(err.response?.data?.message || 'Could not set class teacher')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (teacherId) => {
    if (!teacherId) return apply(null)
    const name = staff.find((s) => String(s.school_member_id) === String(teacherId))?.full_name
    if (current && String(current) !== String(teacherId)) {
      setConfirm({ teacherId, name })
    } else {
      apply(teacherId)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-navy">{classroom.full_name}</div>
          <div className="text-xs text-gray-500 mt-0.5">One teacher takes every subject at this level</div>
        </div>
        <span className="text-[10px] font-semibold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-full flex-shrink-0">
          Single teacher
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <label className="text-xs text-gray-500 block mb-1.5">Class teacher</label>
        <div className="flex items-center gap-2">
          <TeacherSelect
            value={current}
            onChange={handleChange}
            staff={staff}
            placeholder="Not assigned"
            className="flex-1 text-sm py-2"
          />
          {saving && <span className="text-[11px] text-gray-400 whitespace-nowrap">Saving...</span>}
          {!saving && currentName && (
            <span className="text-xs text-green-700 whitespace-nowrap flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              {assignedCount} subject{assignedCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-2.5 leading-relaxed">
          {currentName
            ? `${currentName} takes all subjects and is form master of this class.`
            : 'Pick a teacher to take every subject and act as form master.'}
        </div>
      </div>

      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setConfirm(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg font-bold text-navy mb-2">Change class teacher?</div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Every subject in <span className="font-semibold text-navy">{classroom.full_name}</span> will move
              from <span className="font-semibold text-navy">{currentName}</span> to{' '}
              <span className="font-semibold text-navy">{confirm.name}</span>, who will also become form master.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setConfirm(null); toast.push('Change cancelled') }}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2.5 rounded-lg hover:bg-gray-200 transition"
              >
                No
              </button>
              <button
                onClick={() => { const c = confirm; setConfirm(null); apply(c.teacherId) }}
                className="flex-1 bg-navy text-white text-sm font-bold py-2.5 rounded-lg hover:bg-navy-light transition"
              >
                Yes, change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function UpperBandCard({ classroom, termId, subjects, staff, assignments, onChanged, toast }) {
  const [savingForm, setSavingForm] = useState(false)
  const [conflict, setConflict] = useState(null)
  const [busySubject, setBusySubject] = useState(null)
  const [subjectConfirm, setSubjectConfirm] = useState(null)

  const bySubject = useMemo(() => {
    const map = {}
    for (const a of assignments) map[a.subject] = a
    return map
  }, [assignments])

  const rows = useMemo(() => {
    const list = subjects.map((s) => ({ subject: s, assignment: bySubject[s.id] || null }))
    return [
      ...list.filter((r) => !r.assignment || !r.assignment.teacher),
      ...list.filter((r) => r.assignment && r.assignment.teacher),
    ]
  }, [subjects, bySubject])

  const gaps = rows.filter((r) => !r.assignment || !r.assignment.teacher).length

  const setFormTeacher = async (teacherId, reassign = false) => {
    const name = staff.find((s) => String(s.school_member_id) === String(teacherId))?.full_name
    setSavingForm(true)
    try {
      await updateClassroom(classroom.id, {
        form_teacher: teacherId,
        ...(reassign ? { reassign: true } : {}),
      })
      await onChanged()
      toast.push(name ? `${name} set as form master` : 'Form master cleared')
    } catch (err) {
      const errors = err.response?.data?.errors
      const conflictClass = errors?.conflict_classroom?.[0]
      if (conflictClass && !reassign) {
        setConflict({ teacherId, name, currentClass: conflictClass })
      } else {
        toast.push(errors?.form_teacher?.[0] || 'Could not set form master')
      }
    } finally {
      setSavingForm(false)
    }
  }

    const requestSubjectChange = (subject, assignment, teacherId) => {
    const currentName = assignment?.teacher_name
    const nextName = staff.find((s) => String(s.school_member_id) === String(teacherId))?.full_name

    if (currentName && teacherId && String(assignment.teacher) !== String(teacherId)) {
      setSubjectConfirm({ subject, assignment, teacherId, currentName, nextName })
      return
    }
    setSubjectTeacher(subject, assignment, teacherId)
  }

  const setSubjectTeacher = async (subject, assignment, teacherId) => {
    setBusySubject(subject.id)
    try {
      if (assignment) {
        await updateAssignment(assignment.id, { teacher: teacherId })
      } else {
        await createAssignment({
          classroom: classroom.id,
          subject: subject.id,
          teacher: teacherId,
          term: termId,
          periods_per_week: 5,
        })
      }
      await onChanged()
      const name = staff.find((s) => String(s.school_member_id) === String(teacherId))?.full_name
      toast.push(name ? `${subject.name} assigned to ${name}` : `${subject.name} unassigned`)
    } catch (err) {
      toast.push(err.response?.data?.message || 'Could not assign subject')
    } finally {
      setBusySubject(null)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-navy">{classroom.full_name}</div>
          <div className="text-xs text-gray-500 mt-0.5">Subject specialists, plus a form master</div>
        </div>
        <span className="text-[10px] font-semibold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-full flex-shrink-0">
          Specialists
        </span>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-3.5">
        <label className="text-xs text-gray-500 block mb-1.5">Form master</label>
        <div className="flex items-center gap-2">
          <TeacherSelect
            value={classroom.form_teacher}
            onChange={(id) => setFormTeacher(id)}
            staff={staff}
            placeholder="Not assigned"
            className="flex-1 text-sm py-2"
          />
          {savingForm && <span className="text-[11px] text-gray-400 whitespace-nowrap">Saving...</span>}
        </div>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-gray-500">Subjects</span>
        {gaps > 0 ? (
          <span className="text-xs font-semibold text-amber-700">
            {gaps} need{gaps === 1 ? 's' : ''} a teacher
          </span>
        ) : (
          <span className="text-xs text-green-700">All assigned</span>
        )}
      </div>

      {rows.map(({ subject, assignment }) => {
        const unassigned = !assignment || !assignment.teacher
        const busy = busySubject === subject.id

        return (
          <div
            key={subject.id}
            className={`flex items-center justify-between gap-2 ${
              unassigned
                ? 'bg-amber-50 px-2.5 py-2 mb-0.5'
                : 'px-2.5 py-2 border-b border-gray-100'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {unassigned ? (
                <svg className="w-4 h-4 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span className={`text-[13px] truncate ${unassigned ? 'font-semibold text-amber-900' : 'text-navy'}`}>
                {subject.name}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {assignment && (
                <span className="text-[11px] text-gray-400">{assignment.periods_per_week}/wk</span>
              )}
              {busy ? (
                <span className="text-[11px] text-gray-400 w-[150px] text-center">Saving...</span>
              ) : (
                <TeacherSelect
                  value={assignment?.teacher}
                  onChange={(id) => requestSubjectChange(subject, assignment, id)}
                  staff={staff}
                  placeholder="Choose teacher"
                  className="w-[150px]"
                />
              )}
            </div>
          </div>
        )
      })}

            {subjectConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSubjectConfirm(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg font-bold text-navy mb-2">Change subject teacher?</div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              <span className="font-semibold text-navy">{subjectConfirm.subject.name}</span> in{' '}
              <span className="font-semibold text-navy">{classroom.full_name}</span> will move from{' '}
              <span className="font-semibold text-navy">{subjectConfirm.currentName}</span> to{' '}
              <span className="font-semibold text-navy">{subjectConfirm.nextName}</span>.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setSubjectConfirm(null); toast.push('Change cancelled') }}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2.5 rounded-lg hover:bg-gray-200 transition"
              >
                No
              </button>
              <button
                onClick={() => { const c = subjectConfirm; setSubjectConfirm(null); setSubjectTeacher(c.subject, c.assignment, c.teacherId) }}
                className="flex-1 bg-navy text-white text-sm font-bold py-2.5 rounded-lg hover:bg-navy-light transition"
              >
                Yes, change
              </button>
            </div>
          </div>
        </div>
      )}

      {conflict && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setConflict(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg font-bold text-navy mb-2">Move form master?</div>
            <p className="text-sm text-gray-600 leading-relaxed mb-1">
              You are assigning <span className="font-semibold text-navy">{classroom.full_name}</span> to{' '}
              <span className="font-semibold text-navy">{conflict.name}</span>.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              They are currently the form master of{' '}
              <span className="font-semibold text-navy">{conflict.currentClass}</span>, and will be released
              from that class. Is that correct?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setConflict(null); toast.push('Form assignment restrained') }}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2.5 rounded-lg hover:bg-gray-200 transition"
              >
                No
              </button>
              <button
                onClick={() => { const c = conflict; setConflict(null); setFormTeacher(c.teacherId, true) }}
                className="flex-1 bg-navy text-white text-sm font-bold py-2.5 rounded-lg hover:bg-navy-light transition"
              >
                Yes, move them
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AssignmentTab() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [activeGroup, setActiveGroup] = useState(null)

  const { data: setupData } = useQuery({ queryKey: ['year-setup-status'], queryFn: getSetupStatus })
  const termId = setupData?.data?.academic_year?.current_term?.id

  const { data: classroomsData, isLoading: loadingClassrooms } = useQuery({
    queryKey: ['school-classrooms'], queryFn: getSchoolClassrooms,
  })
  const classrooms = classroomsData?.data?.classrooms || []

  const { data: assignmentsData } = useQuery({
    queryKey: ['assignments', termId],
    queryFn: () => getAssignments({ term: termId }),
    enabled: !!termId,
  })
  const assignments = assignmentsData?.data?.assignments || []

  const { data: staffData } = useQuery({
    queryKey: ['all-staff-unfiltered'],
    queryFn: () => getAllStaff({ page_size: 200 }),
  })
  const staff = (staffData?.data?.staff || []).filter((s) => s.staff_category === 'teaching')

  const { data: subjectsData } = useQuery({ queryKey: ['subjects'], queryFn: getSubjects })
  const allSubjects = subjectsData?.data?.subjects || []
  const coreSubjects = allSubjects.filter((s) => s.subject_type === 'core')

  const assignmentsByClassroom = useMemo(() => {
    const map = {}
    for (const a of assignments) {
      if (!map[a.classroom]) map[a.classroom] = []
      map[a.classroom].push(a)
    }
    return map
  }, [assignments])

  const groups = useMemo(() => {
    const byGroup = {}
    for (const c of classrooms) {
      const key = groupFor(c.class_level_display?.toLowerCase().replace(/\s+/g, '_') || '')
      if (!byGroup[key]) byGroup[key] = []
      byGroup[key].push(c)
    }
    return BAND_ORDER
      .filter((g) => byGroup[g]?.length)
      .map((g) => ({ group: g, label: BAND_LABELS[g], classrooms: byGroup[g] }))
  }, [classrooms])

  const gapsByGroup = useMemo(() => {
    const counts = {}
    for (const g of groups) {
      counts[g.group] = g.classrooms.filter((c) => {
        if (c.band === 'lower') return !c.form_teacher
        const rows = assignmentsByClassroom[c.id] || []
        const assigned = new Set(rows.filter((a) => a.teacher).map((a) => a.subject))
        return !c.form_teacher || allSubjects.some((s) => !assigned.has(s.id))
      }).length
    }
    return counts
  }, [groups, assignmentsByClassroom, allSubjects])

  const currentGroup = activeGroup || groups[0]?.group
  const visibleClassrooms = groups.find((g) => g.group === currentGroup)?.classrooms || []

  const onChanged = async () => {
    await queryClient.invalidateQueries({ queryKey: ['assignments', termId] })
    await queryClient.invalidateQueries({ queryKey: ['school-classrooms'] })
  }

  if (loadingClassrooms) {
    return <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
  }

  if (classrooms.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm py-16 px-6 text-center">
        <div className="text-sm font-bold text-navy mb-1">No classes yet</div>
        <p className="text-xs text-gray-400 max-w-sm mx-auto">
          Create classes in the Classes tab first, then assign teachers and subjects here.
        </p>
      </div>
    )
  }

  return (
    <>
      <toast.ToastStack />
      <div className="flex flex-col gap-4">
        <div className="text-xs text-gray-400">
          Nursery to Primary 3 have one teacher for every subject. From Primary 4 up, assign each
          subject and a form master, for{' '}
          {setupData?.data?.academic_year?.current_term?.name_display || 'the current term'}.
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex bg-gray-200/70 rounded-full p-[3px] relative overflow-x-auto no-scrollbar">
            {groups.map((g) => (
              <button
                key={g.group}
                onClick={() => setActiveGroup(g.group)}
                className="relative px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors z-10 whitespace-nowrap"
              >
                {currentGroup === g.group && (
                  <motion.div
                    layoutId="assignment-group-thumb"
                    className="absolute inset-0 bg-navy rounded-full -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className={currentGroup === g.group ? 'text-white' : 'text-gray-500'}>
                  {g.label}
                </span>
                {gapsByGroup[g.group] > 0 && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-amber-500 align-middle" />
                )}
              </button>
            ))}
          </div>

          {gapsByGroup[currentGroup] > 0 ? (
            <span className="text-xs font-semibold text-amber-700 whitespace-nowrap">
              {gapsByGroup[currentGroup]} class{gapsByGroup[currentGroup] !== 1 ? 'es' : ''} need a teacher
            </span>
          ) : (
            <span className="text-xs text-green-700 whitespace-nowrap">All assigned</span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {visibleClassrooms.map((c) => {
            const props = {
              classroom: c,
              termId,
              staff,
              assignments: assignmentsByClassroom[c.id] || [],
              onChanged,
              toast,
            }
            return c.band === 'lower' ? (
              <LowerBandCard key={c.id} {...props} subjects={coreSubjects} />
            ) : (
              <UpperBandCard key={c.id} {...props} subjects={allSubjects} />
            )
          })}
        </div>
      </div>
    </>
  )
}

export default AssignmentTab