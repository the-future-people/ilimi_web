import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClasswork,
  createClasswork,
  getClassworkRecords,
  markClasswork,
  getComponentTypes,
} from '../../api/classwork'

const WORK_TYPES = [
  { value: 'homework', label: 'Homework' },
  { value: 'exercise', label: 'Class Exercise' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'test', label: 'Class Test' },
  { value: 'group_work', label: 'Group Work' },
  { value: 'project', label: 'Project' },
]

const today = () => new Date().toISOString().slice(0, 10)

function SetWorkForm({ classroomId, subject, onCancel, onCreated }) {
  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [workType, setWorkType] = useState('homework')
  const [dueDate, setDueDate] = useState('')
  const [counts, setCounts] = useState(false)
  const [componentType, setComponentType] = useState('')
  const [maxScore, setMaxScore] = useState(10)
  const [visibleToParents, setVisibleToParents] = useState(true)
  const [error, setError] = useState('')

  const { data: typesData } = useQuery({
    queryKey: ['ca-component-types'],
    queryFn: getComponentTypes,
  })
  const componentTypes = typesData?.data?.component_types || []

  const mutation = useMutation({
    mutationFn: createClasswork,
    onSuccess: (res) => onCreated(res.message || 'Work posted.'),
    onError: (err) => {
      const data = err.response?.data
      const fieldError = data?.errors && Object.values(data.errors)[0]?.[0]
      setError(fieldError || data?.message || 'Could not post the work.')
    },
  })

  const submit = () => {
    setError('')
    if (!name.trim()) return setError('Give the work a name.')
    if (counts && !componentType) return setError('Choose which CA component this counts toward.')

    mutation.mutate({
      classroom: classroomId,
      subject: subject.id,
      term: subject.term_id,
      work_type: workType,
      name: name.trim(),
      instructions: instructions.trim(),
      date: today(),
      due_date: dueDate || null,
      component_type: counts ? Number(componentType) : null,
      max_score: counts ? Number(maxScore) : null,
      visible_to_parents: visibleToParents,
      allows_digital_submission: false,
    })
  }

  return (
    <div className="border-2 border-navy rounded-xl p-4">
      <div className="text-sm font-semibold text-navy mb-3">Set new work</div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="What is the work called?"
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold mb-2"
      />

      <textarea
        rows={2}
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        placeholder="Instructions for the class"
        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold mb-2 resize-none"
      />

      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Type</label>
          <select
            value={workType}
            onChange={(e) => setWorkType(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold bg-white"
          >
            {WORK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
          />
        </div>
      </div>

      <div className={`border-l-[3px] p-3 mb-3 transition-colors ${counts ? 'bg-amber-50 border-gold' : 'bg-gray-50 border-gray-300'}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-navy">Counts toward CA score</div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {counts ? 'This work will affect end-of-term grades.' : 'This work will be tracked but not graded.'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCounts(!counts)}
            className={`w-[42px] h-[24px] rounded-full flex-shrink-0 relative transition-colors ${counts ? 'bg-gold' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full transition-all ${counts ? 'left-[21px]' : 'left-[3px]'}`}
            />
          </button>
        </div>

        {counts && (
          <div className="flex gap-2 mt-3">
            <div className="flex-[2]">
              <label className="text-[11px] font-semibold text-amber-800 mb-1 block">CA component</label>
              <select
                value={componentType}
                onChange={(e) => setComponentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold bg-white"
              >
                <option value="">Choose...</option>
                {componentTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.weight}%)</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-amber-800 mb-1 block">Out of</label>
              <input
                type="number"
                min={1}
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">{error}</div>
      )}

      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={visibleToParents}
            onChange={(e) => setVisibleToParents(e.target.checked)}
          />
          Parents can see this
        </label>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={mutation.isPending}
            className="text-xs font-bold text-white bg-navy rounded-lg px-5 py-2 hover:bg-navy-light transition disabled:opacity-50"
          >
            {mutation.isPending ? 'Posting...' : 'Post work'}
          </button>
        </div>
      </div>
    </div>
  )
}

const initialsOf = (name) =>
  name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase()

function MarkScreen({ classworkId, onBack }) {
  const queryClient = useQueryClient()
  const [edits, setEdits] = useState({})
  const [toast, setToast] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['classwork-records', classworkId],
    queryFn: () => getClassworkRecords(classworkId),
  })

  const classwork = data?.data?.classwork
  const records = data?.data?.records || []
  const isGraded = classwork?.is_graded

  const mutation = useMutation({
    mutationFn: (payload) => markClasswork(classworkId, payload),
    onSuccess: (res) => {
      setEdits({})
      setToast(res.message || 'Saved.')
      queryClient.invalidateQueries({ queryKey: ['classwork-records', classworkId] })
      queryClient.invalidateQueries({ queryKey: ['classwork'] })
      queryClient.invalidateQueries({ queryKey: ['my-classrooms'] })
      setTimeout(() => setToast(''), 3000)
    },
  })

  const setEdit = (recordId, patch) =>
    setEdits((prev) => ({ ...prev, [recordId]: { ...prev[recordId], ...patch } }))

  const valueFor = (record, field) =>
    edits[record.id]?.[field] !== undefined ? edits[record.id][field] : record[field]

  const save = () => {
    const payload = Object.entries(edits).map(([id, patch]) => ({
      record_id: Number(id),
      ...patch,
    }))
    if (payload.length) mutation.mutate(payload)
  }

  const dirtyCount = Object.keys(edits).length
  const markedCount = records.filter((r) => r.status !== 'not_done').length

  if (isLoading) {
    return <div className="text-center py-14 text-gray-400 text-sm">Loading records...</div>
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-navy border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <span className={`text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full ${
          isGraded ? 'bg-red-100 text-red-900' : 'bg-gray-100 text-gray-600'
        }`}>
          {classwork?.work_type_display} · {isGraded ? 'Counts' : 'Ungraded'}
        </span>
      </div>

      <div className="text-base font-semibold text-navy">{classwork?.name}</div>
      <div className="text-[11px] text-gray-500 mb-4">
        {isGraded
          ? `Out of ${classwork.max_score} · feeds ${classwork.component_type_name} (${classwork.component_weight}%)`
          : 'Tap done or not done for each student'}
      </div>

      <div className="divide-y divide-gray-100">
        {records.map((record) => {
          const status = valueFor(record, 'status')
          const score = valueFor(record, 'score')
          const isExcused = status === 'excused'

          return (
            <div key={record.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center text-[9px] font-bold text-white overflow-hidden flex-shrink-0">
                  {record.student_photo
                    ? <img src={record.student_photo} alt="" className="w-full h-full object-cover" />
                    : initialsOf(record.student_name)}
                </div>
                <span className="text-sm text-navy truncate">{record.student_name}</span>
              </div>

              {isGraded ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEdit(record.id, isExcused ? { status: 'not_done' } : { status: 'excused', score: null })}
                    className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                      isExcused ? 'bg-amber-100 border-amber-300 text-amber-900' : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Absent
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={classwork.max_score}
                    disabled={isExcused}
                    value={score ?? ''}
                    onChange={(e) => setEdit(record.id, { score: e.target.value === '' ? null : Number(e.target.value) })}
                    placeholder="—"
                    className="w-[62px] px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center outline-none focus:border-gold disabled:bg-gray-50"
                  />
                  <span className="text-[11px] text-gray-400 w-8">/ {classwork.max_score}</span>
                </div>
              ) : (
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setEdit(record.id, { status: 'done' })}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition ${
                      status === 'done' ? 'bg-green-100 border-green-300 text-green-900' : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Done
                  </button>
                  <button
                    onClick={() => setEdit(record.id, { status: 'not_done' })}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition ${
                      status === 'not_done' ? 'bg-red-100 border-red-300 text-red-900' : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Not done
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 mt-3 pt-3">
        <span className="text-[11px] text-gray-500">
          {markedCount} of {records.length} marked
          {dirtyCount > 0 && <span className="text-gold font-semibold"> · {dirtyCount} unsaved</span>}
        </span>
        <button
          onClick={save}
          disabled={dirtyCount === 0 || mutation.isPending}
          className="text-xs font-bold text-white bg-navy rounded-lg px-5 py-2 hover:bg-navy-light transition disabled:opacity-40"
        >
          {mutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-navy text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg z-50 border-l-4 border-gold">
          {toast}
        </div>
      )}
    </div>
  )
}

const fmtDate = (iso) => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const fmtScore = (n) => (n === null || n === undefined ? null : Number(n).toString())

const daysFromToday = (iso) => {
  if (!iso) return null
  const today = new Date(new Date().toDateString())
  const due = new Date(new Date(iso).toDateString())
  return Math.round((due - today) / 86400000)
}

const Icon = ({ d, className = 'w-[15px] h-[15px]' }) => (
  <svg className={`${className} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
  </svg>
)

const ICONS = {
  alarm: 'M12 8v4l2 2m6-2a8 8 0 11-16 0 8 8 0 0116 0zM5 3L2 6m20 0l-3-3',
  calendarDue: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  calendarCheck: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm4-6l2 2 4-4',
  checkbox: 'M9 12l2 2 4-4m5 6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v10z',
  circleCheck: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  target: 'M12 8a4 4 0 100 8 4 4 0 000-8zm0-5a9 9 0 100 18 9 9 0 000-18zm0 8a1 1 0 100 2 1 1 0 000-2z',
}

function WorkCard({ item, onMark, state }) {
  const unmarked = item.unmarked_count
  const total = item.record_count
  const marked = total - unmarked
  const pct = total > 0 ? Math.round((marked / total) * 100) : 0
  const days = daysFromToday(item.due_date)

  const dueLabel = !item.due_date
    ? `Set ${fmtDate(item.date)}`
    : state === 'complete'
      ? `Due ${fmtDate(item.due_date)}`
      : days < 0
        ? `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} late`
        : days === 0
          ? 'Due today'
          : days === 1
            ? 'Due tomorrow'
            : `Due ${fmtDate(item.due_date)}`

  const markLabel = !item.is_graded
    ? unmarked === 0 ? `All ${total} marked` : `${marked} of ${total} done`
    : unmarked === 0 ? `All ${total} marked` : marked === 0 ? 'Nothing marked yet' : `${marked} of ${total} marked`

  const urgent = state === 'needs'
  const progress = state === 'progress'
  const complete = state === 'complete'

  const wrap = urgent
    ? 'bg-amber-50 border-l-[3px] border-amber-600 px-3 py-2.5 mb-1.5'
    : progress
      ? 'bg-white border border-blue-300 rounded-lg px-3 py-2.5 mb-1.5'
      : 'bg-white border border-gray-200 rounded-lg px-3 py-2.5 mb-1.5'

  const metaColor = urgent ? 'text-amber-800' : 'text-gray-500'
  const markColor = urgent
    ? 'text-amber-800'
    : complete || unmarked === 0
      ? 'text-green-700'
      : progress
        ? 'text-blue-600'
        : marked === 0
          ? 'text-gray-400'
          : 'text-gray-500'

  const btn = urgent
    ? 'bg-amber-600 text-white hover:bg-amber-700'
    : progress
      ? 'bg-navy text-white hover:bg-navy-light'
      : 'border border-gray-300 text-navy hover:bg-gray-50'

  const btnLabel = urgent
    ? 'Mark now'
    : progress
      ? 'Continue marking'
      : unmarked === 0
        ? 'View'
        : 'Mark early'

  return (
    <div className={wrap}>
      <div className="flex items-start justify-between gap-2.5 mb-1.5">
        <div className={`text-sm font-semibold ${urgent ? 'text-amber-950' : 'text-navy'}`}>
          {item.name}
        </div>
        <span
          className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${
            urgent ? 'bg-amber-300 text-amber-950' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {item.work_type_display} · {item.is_graded ? 'Counts' : 'Ungraded'}
        </span>
      </div>

      <div className={`flex items-center gap-3.5 flex-wrap text-xs mb-2 ${metaColor}`}>
        <span className="flex items-center gap-1">
          <Icon d={urgent ? ICONS.alarm : complete ? ICONS.calendarCheck : ICONS.calendarDue} />
          {dueLabel}
        </span>
        <span className={`flex items-center gap-1 ${markColor}`}>
          <Icon d={unmarked === 0 ? ICONS.circleCheck : ICONS.checkbox} />
          {markLabel}
        </span>
        {item.is_graded && (
          <span className="flex items-center gap-1">
            <Icon d={ICONS.target} />
            out of {fmtScore(item.max_score)}
          </span>
        )}
      </div>

      {(urgent || progress) && total > 0 && (
        <div className={`h-[5px] rounded-full overflow-hidden mb-2.5 ${urgent ? 'bg-amber-200' : 'bg-blue-100'}`}>
          <div
            className={`h-full transition-all ${urgent ? 'bg-amber-600' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <button
        onClick={() => onMark(item.id)}
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${btn}`}
      >
        {btnLabel}
      </button>
    </div>
  )
}

function ClassworkPanel({ classroomId, subjects = [] }) {
  const queryClient = useQueryClient()
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || null)
  const [showForm, setShowForm] = useState(false)
  const [markingId, setMarkingId] = useState(null)
  const [showEarlier, setShowEarlier] = useState(false)
  const [toast, setToast] = useState('')

  const subject = subjects.find((s) => s.id === subjectId)

  const { data, isLoading } = useQuery({
    queryKey: ['classwork', classroomId, subjectId],
    queryFn: () => getClasswork({ classroom: classroomId, subject: subjectId }),
    enabled: !!subjectId,
  })

  const items = data?.data?.classwork || []

  const isOverdue = (i) => daysFromToday(i.due_date) !== null && daysFromToday(i.due_date) < 0

  const needsMarking = items.filter((i) => isOverdue(i) && i.unmarked_count > 0)
  const inProgress = items.filter(
    (i) => !isOverdue(i) && i.unmarked_count > 0 && i.unmarked_count < i.record_count
  )
  const waiting = items.filter(
    (i) => !isOverdue(i) && i.unmarked_count === i.record_count && i.record_count > 0
  )
  const complete = items.filter((i) => i.record_count > 0 && i.unmarked_count === 0)

  const handleCreated = (message) => {
    setShowForm(false)
    setToast(message)
    queryClient.invalidateQueries({ queryKey: ['classwork', classroomId, subjectId] })
    queryClient.invalidateQueries({ queryKey: ['my-classrooms'] })
    setTimeout(() => setToast(''), 3000)
  }

  if (!subjects.length) {
    return (
      <div className="p-4 sm:p-6 text-center py-14 text-gray-400 text-sm">
        No subjects assigned to you for this class.
      </div>
    )
  }

  if (markingId) {
    return (
      <div className="p-4 sm:p-6">
        <MarkScreen classworkId={markingId} onBack={() => setMarkingId(null)} />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] text-gray-400 flex-shrink-0">Subject</span>
          <select
            value={subjectId || ''}
            onChange={(e) => { setSubjectId(Number(e.target.value)); setShowForm(false) }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold text-navy outline-none focus:border-gold bg-white"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-navy rounded-lg px-3.5 py-2 hover:bg-navy-light transition flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Set work
          </button>
        )}
      </div>

      {showForm && subject && (
        <div className="mb-4">
          <SetWorkForm
            classroomId={classroomId}
            subject={subject}
            onCancel={() => setShowForm(false)}
            onCreated={handleCreated}
          />
        </div>
      )}

            {isLoading && <div className="text-center py-14 text-gray-400 text-sm">Loading classwork...</div>}

      {!isLoading && items.length === 0 && !showForm && (
        <div className="text-center py-14">
          <div className="text-sm font-semibold text-navy mb-1">No work set yet</div>
          <div className="text-xs text-gray-400">Anything you set for {subject?.name} will appear here.</div>
        </div>
      )}

          {needsMarking.length > 0 && (
        <>
          <div className="text-xs font-semibold text-amber-700 mb-1.5">
            Needs marking · {needsMarking.length}
          </div>
          {needsMarking.map((i) => <WorkCard key={i.id} item={i} onMark={setMarkingId} state="needs" />)}
        </>
      )}

      {inProgress.length > 0 && (
        <>
          <div className="text-xs font-semibold text-blue-600 mt-4 mb-1.5">
            In progress · {inProgress.length}
          </div>
          {inProgress.map((i) => <WorkCard key={i.id} item={i} onMark={setMarkingId} state="progress" />)}
        </>
      )}

      {waiting.length > 0 && (
        <>
          <div className="text-xs font-semibold text-gray-500 mt-4 mb-1.5">
            Waiting on students · {waiting.length}
          </div>
          {waiting.map((i) => <WorkCard key={i.id} item={i} onMark={setMarkingId} state="waiting" />)}
        </>
      )}

      {complete.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowEarlier((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Completed · {complete.length}
            </span>
            <span className="text-xs text-navy font-semibold flex items-center gap-1">
              {showEarlier ? 'Hide' : 'Show'}
              <svg className={`w-3.5 h-3.5 transition-transform ${showEarlier ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </button>
          {showEarlier && (
            <div className="mt-1.5">
              {complete.map((i) => <WorkCard key={i.id} item={i} onMark={setMarkingId} state="complete" />)}
            </div>
          )}
        </div>
      )}

            {toast && (
        <div className="fixed bottom-6 right-6 bg-navy text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg z-50 border-l-4 border-gold">
          {toast}
        </div>
      )}
    </div>
  )
}

export default ClassworkPanel