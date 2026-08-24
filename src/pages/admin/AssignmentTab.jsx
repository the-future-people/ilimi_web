import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getSetupStatus, getSchoolClassrooms, getAssignments,
  createAssignment, updateAssignment, deleteAssignment, getSubjects,
  updateClassroom,
} from '../../api/academics'
import { getAllStaff } from '../../api/staff'

const BAND_LABELS = { early: 'Early Years', primary: 'Primary', jhs: 'JHS' }
const BAND_ORDER = ['early', 'primary', 'jhs']

const BAND_WASH = {
  early: 'bg-amber-50/60',
  primary: 'bg-blue-50/60',
  jhs: 'bg-purple-50/60',
}

const bandFor = (levelName = '') => {
  if (levelName.startsWith('nursery') || levelName.startsWith('kindergarten')) return 'early'
  if (levelName.startsWith('primary')) return 'primary'
  return 'jhs'
}

const SUBJECT_TYPE_STYLES = {
  core: 'bg-teal-50 text-teal-700',
  elective: 'bg-rose-50 text-rose-700',
  optional: 'bg-gray-100 text-gray-500',
}

const AVATAR_PALETTE = [
  'bg-blue-50 text-blue-700', 'bg-purple-50 text-purple-700',
  'bg-teal-50 text-teal-700', 'bg-rose-50 text-rose-700',
  'bg-amber-50 text-amber-700', 'bg-indigo-50 text-indigo-700',
]
const avatarStyle = (id) => AVATAR_PALETTE[Number(id) % AVATAR_PALETTE.length]
const initials = (name) => name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '?'

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

function TeacherSelect({ value, onChange, staff, placeholder = 'Select teacher...' }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-gold bg-white"
    >
      <option value="">{placeholder}</option>
      {staff.map((s) => (
        <option key={s.id} value={s.school_member_id}>{s.full_name}</option>
      ))}
    </select>
  )
}

function UnassignedSubjectRow({ subject, classroomId, termId, staff, onDone }) {
  const [open, setOpen] = useState(false)
  const [teacherId, setTeacherId] = useState('')
  const [periods, setPeriods] = useState(5)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const typeStyle = SUBJECT_TYPE_STYLES[subject.subject_type] || SUBJECT_TYPE_STYLES.core

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await createAssignment({
        classroom: classroomId,
        subject: subject.id,
        teacher: teacherId || null,
        term: termId,
        periods_per_week: Number(periods) || 5,
      })
      onDone(res)
    } catch (err) {
      const data = err.response?.data
      const fieldError = data?.errors && Object.values(data.errors)[0]?.[0]
      setError(fieldError || data?.message || 'Could not assign.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-2.5 py-2 bg-white border border-gray-200 rounded-lg hover:border-gold/50 hover:bg-gold/5 transition text-left"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
        <span className="text-xs text-gray-600 truncate">{subject.name}</span>
        <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeStyle}`}>
          {subject.subject_type || 'core'}
        </span>
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 px-2.5 py-2 border border-gold/40 bg-gold/10 rounded-lg">
      <div className="text-xs font-semibold text-navy">{subject.name}</div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <TeacherSelect value={teacherId} onChange={setTeacherId} staff={staff} placeholder="Teacher" />
        <input
          type="number"
          min={1}
          value={periods}
          onChange={(e) => setPeriods(e.target.value)}
          className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-gold"
          title="Periods per week"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-bold bg-navy text-white px-3 py-1.5 rounded-lg hover:bg-navy-light transition disabled:opacity-50"
        >
          {saving ? '...' : 'Add'}
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 px-1">
          Cancel
        </button>
      </div>
      {error && <div className="text-[11px] text-red-600">{error}</div>}
    </div>
  )
}

function AssignedSubjectRow({ assignment, staff, onReassign, onRemove, flashed }) {
  return (
    <div className={`flex items-center gap-2.5 px-2.5 py-2 border rounded-lg transition-colors duration-700 ${flashed ? 'bg-gold/20 border-gold/40' : 'bg-white border-gray-100'}`}>
      <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-xs font-semibold text-navy truncate flex-1">{assignment.subject_name}</span>
      <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded flex-shrink-0">{assignment.periods_per_week}/wk</span>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${avatarStyle(assignment.teacher || 0)}`}>
        {assignment.teacher_name ? initials(assignment.teacher_name) : '?'}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <select
          value={assignment.teacher || ''}
          onChange={(e) => onReassign(assignment.id, e.target.value || null)}
          className="text-[10px] border-none bg-transparent text-gray-400 outline-none cursor-pointer max-w-[70px]"
          title="Reassign"
        >
          <option value="">Change...</option>
                    {staff.map((s) => (
            <option key={s.id} value={s.school_member_id}>{s.full_name}</option>
          ))}
        </select>
        <button onClick={() => onRemove(assignment.id)} className="text-gray-300 hover:text-red-500 transition" title="Remove">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ClassroomAssignmentCard({ classroom, termId, subjects, staff, assignmentsByClassroom, refetch, toast }) {
  const [expanded, setExpanded] = useState(false)
  const [savingFormTeacher, setSavingFormTeacher] = useState(false)
  const [flashedId, setFlashedId] = useState(null)
  const [conflict, setConflict] = useState(null)

  const assignments = assignmentsByClassroom[classroom.id] || []
  const assignedSubjectIds = new Set(assignments.map((a) => a.subject))
  const unassignedSubjects = subjects.filter((s) => !assignedSubjectIds.has(s.id))
  const total = subjects.length
  const done = assignments.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const flash = (id) => {
    setFlashedId(id)
    setTimeout(() => setFlashedId(null), 900)
  }

    const handleFormTeacherChange = async (teacherId, reassign = false) => {
    const name = staff.find((s) => String(s.school_member_id) === String(teacherId))?.full_name

    setSavingFormTeacher(true)
    try {
      await updateClassroom(classroom.id, {
        form_teacher: teacherId,
        ...(reassign ? { reassign: true } : {}),
      })
      await refetch()
      toast.push(name ? `${name} set as form teacher` : 'Form teacher updated')
    } catch (err) {
      const errors = err.response?.data?.errors
      const conflictClass = errors?.conflict_classroom?.[0]

      if (conflictClass && !reassign) {
        setConflict({ teacherId, name, currentClass: conflictClass })
      } else {
        toast.push(errors?.form_teacher?.[0] || 'Could not set form teacher')
      }
    } finally {
      setSavingFormTeacher(false)
    }
  }

  const handleRemove = async (assignmentId) => {
    await deleteAssignment(assignmentId)
    await refetch()
    toast.push('Assignment removed')
  }

  const handleTeacherReassign = async (assignmentId, teacherId) => {
    await updateAssignment(assignmentId, { teacher: teacherId })
    await refetch()
    flash(assignmentId)
    const name = staff.find((s) => String(s.school_member_id) === String(teacherId))?.full_name
    toast.push(name ? `Reassigned to ${name}` : 'Teacher removed from subject')
  }

  const handleAssignDone = async (res) => {
    await refetch()
    toast.push(res?.message || 'Subject assigned')
  }

  return (
    <div className="bg-white border-2 border-dashed border-gold/40 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gold/5 transition text-left"
      >
        <div>
          <div className="text-sm font-semibold text-navy">{classroom.full_name}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {classroom.form_teacher_name ? `Form teacher: ${classroom.form_teacher_name}` : 'No form teacher assigned'}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {total > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-gray-400">{done} of {total} assigned</span>
              <div className="w-14 h-1 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
          <svg className={`w-4 h-4 text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-dashed border-gold/30 flex flex-col gap-4">
          <div className="flex items-center gap-3 pt-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Form Teacher</span>
            <TeacherSelect value={classroom.form_teacher} onChange={handleFormTeacherChange} staff={staff} placeholder="Not assigned" />
            {savingFormTeacher && <span className="text-[11px] text-gray-400">Saving...</span>}
          </div>

          <div className="flex flex-col sm:flex-row gap-0 sm:items-stretch">
            <div className="flex-1 border border-dashed border-gray-300 rounded-xl sm:rounded-r-none sm:border-r-0 p-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Needs a teacher</div>
              {unassignedSubjects.length === 0 ? (
                <div className="text-xs text-gray-300 py-3 text-center">All subjects assigned</div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {unassignedSubjects.map((s) => (
                    <UnassignedSubjectRow
                      key={s.id}
                      subject={s}
                      classroomId={classroom.id}
                      termId={termId}
                      staff={staff}
                      onDone={handleAssignDone}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center justify-center w-9 bg-gray-50/80 border-t border-b border-dashed border-gray-300">
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>

            <div className="flex-1 border border-dashed border-gray-300 rounded-xl sm:rounded-l-none p-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Assigned</div>
              {assignments.length === 0 ? (
                <div className="text-xs text-gray-300 py-3 text-center">Nothing assigned yet</div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {assignments.map((a) => (
                    <AssignedSubjectRow
                      key={a.id}
                      assignment={a}
                      staff={staff}
                      onReassign={handleTeacherReassign}
                      onRemove={handleRemove}
                      flashed={flashedId === a.id}
                    />
                  ))}
                </div>
              )}
            </div>
                    </div>
        </div>
      )}

      {conflict && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setConflict(null)}
        >
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg font-bold text-navy mb-2">Move form master?</div>
            <p className="text-sm text-gray-600 leading-relaxed mb-1">
              You are assigning <span className="font-semibold text-navy">{classroom.full_name}</span> to{' '}
              <span className="font-semibold text-navy">{conflict.name}</span>.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              They are currently the form master of{' '}
              <span className="font-semibold text-navy">{conflict.currentClass}</span>, and will be
              released from that class. Is that correct?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setConflict(null); toast.push('Form assignment restrained') }}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2.5 rounded-lg hover:bg-gray-200 transition"
              >
                No
              </button>
              <button
                onClick={() => { const c = conflict; setConflict(null); handleFormTeacherChange(c.teacherId, true) }}
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

  const { data: staffData } = useQuery({ queryKey: ['all-staff-unfiltered'], queryFn: () => getAllStaff({ page_size: 200 }) })
  const staff = (staffData?.data?.staff || []).filter((s) => s.staff_category === 'teaching')

  const { data: subjectsData } = useQuery({ queryKey: ['subjects'], queryFn: getSubjects })
  const subjects = subjectsData?.data?.subjects || []

  const assignmentsByClassroom = useMemo(() => {
    const map = {}
    for (const a of assignments) {
      if (!map[a.classroom]) map[a.classroom] = []
      map[a.classroom].push(a)
    }
    return map
  }, [assignments])

  const groups = useMemo(() => {
    const byBand = {}
    for (const c of classrooms) {
      const band = bandFor(c.class_level_display?.toLowerCase().replace(/\s+/g, '_') || '')
      if (!byBand[band]) byBand[band] = []
      byBand[band].push(c)
    }
    return BAND_ORDER
      .filter((band) => byBand[band]?.length)
      .map((band) => ({ band, label: BAND_LABELS[band], classrooms: byBand[band] }))
  }, [classrooms])

  const refetch = async () => {
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
      <div className="flex flex-col gap-5">
        <div className="text-xs text-gray-400">
          Set each class's form teacher and assign subject teachers for{' '}
          {setupData?.data?.academic_year?.current_term?.name_display || 'the current term'}.
        </div>
        {groups.map((group) => (
          <div key={group.band} className={`${BAND_WASH[group.band]} rounded-2xl p-4 sm:p-5`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="text-sm font-bold text-navy">{group.label}</div>
              <div className="text-xs text-gray-400">{group.classrooms.length} class{group.classrooms.length !== 1 ? 'es' : ''}</div>
            </div>
            <div className="flex flex-col gap-3">
              {group.classrooms.map((c) => (
                <ClassroomAssignmentCard
                  key={c.id}
                  classroom={c}
                  termId={termId}
                  subjects={subjects}
                  staff={staff}
                  assignmentsByClassroom={assignmentsByClassroom}
                  refetch={refetch}
                  toast={toast}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default AssignmentTab