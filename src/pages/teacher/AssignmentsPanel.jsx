import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAssignments, createAssignment, markCompletion } from '../../api/classroom'

const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"

const STATUS_STYLES = {
  not_done: 'bg-gray-100 text-gray-500',
  done: 'bg-green-50 text-green-700',
  submitted: 'bg-blue-50 text-blue-700',
  graded: 'bg-amber-50 text-amber-700',
}

function CompletionRow({ completion, onMark }) {
  const [saving, setSaving] = useState(false)

  const toggle = async () => {
    setSaving(true)
    try {
      await onMark(completion.id, completion.status === 'done' ? 'not_done' : 'done')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-gray-50/60">
      <span className="text-sm text-navy">{completion.student_name}</span>
      <button
        onClick={toggle}
        disabled={saving}
        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition disabled:opacity-50 ${STATUS_STYLES[completion.status] || STATUS_STYLES.not_done}`}
      >
        {completion.status_display}
      </button>
    </div>
  )
}

function AssignmentCard({ assignment, onMark }) {
  const [expanded, setExpanded] = useState(false)
  const doneCount = assignment.completions.filter((c) => c.status !== 'not_done').length
  const total = assignment.completions.length

  return (
    <div className="border-2 border-dashed border-gold/40 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gold/5 transition text-left"
      >
        <div>
          <div className="text-sm font-semibold text-navy">{assignment.title}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {assignment.due_date ? `Due ${assignment.due_date}` : 'No due date'} · {doneCount}/{total} marked
          </div>
        </div>
        <svg className={`w-4 h-4 text-gray-300 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-50 flex flex-col gap-3">
          <p className="text-sm text-gray-600">{assignment.instructions}</p>
          <div className="flex flex-col gap-1.5">
            {assignment.completions.map((c) => (
              <CompletionRow key={c.id} completion={c} onMark={onMark} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NewAssignmentForm({ subjectAssignmentId, onDone }) {
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!title.trim() || !instructions.trim()) return setError('Title and instructions are required.')
    setSaving(true)
    setError('')
    try {
      await createAssignment({
        subject_assignment: subjectAssignmentId,
        title, instructions,
        due_date: dueDate || null,
        allows_digital_submission: false,
      })
      setTitle(''); setInstructions(''); setDueDate('')
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post assignment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col gap-3">
      <div className="text-sm font-bold text-navy">Post a New Assignment</div>
      <input className={inputClass} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea rows={3} className={inputClass} placeholder="Instructions — this is what the parent sees in full" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
      <input type="date" className={inputClass} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
      <button onClick={handleSubmit} disabled={saving} className="bg-navy text-white text-sm font-bold py-2.5 rounded-lg hover:bg-navy-light transition disabled:opacity-50">
        {saving ? 'Posting...' : 'Post Assignment'}
      </button>
    </div>
  )
}

function AssignmentsPanel({ subjects }) {
  const queryClient = useQueryClient()
  const [selectedSubject, setSelectedSubject] = useState(subjects.length === 1 ? subjects[0] : null)
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['assignments', selectedSubject?.subject_assignment_id],
    queryFn: () => getAssignments(selectedSubject.subject_assignment_id),
    enabled: !!selectedSubject,
  })
  const assignments = data?.data?.assignments || []

  const handleMark = async (completionId, statusValue) => {
    await markCompletion(completionId, statusValue)
    queryClient.invalidateQueries({ queryKey: ['assignments', selectedSubject?.subject_assignment_id] })
  }

  if (!selectedSubject) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-sm font-bold text-navy mb-3">Which subject?</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subjects.map((s) => (
            <button
              key={s.subject_assignment_id}
              onClick={() => setSelectedSubject(s)}
              className="text-left px-4 py-3 bg-white border-2 border-dashed border-gold/40 rounded-xl hover:bg-gold/5 transition"
            >
              <span className="text-sm font-semibold text-navy">{s.name}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      {subjects.length > 1 && (
        <button onClick={() => setSelectedSubject(null)} className="text-xs font-bold text-gray-400 hover:text-navy transition self-start">
          ← Change subject
        </button>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-navy">{selectedSubject.name} — Assignments</div>
        <button onClick={() => setShowForm((v) => !v)} className="text-xs font-bold text-navy hover:underline">
          {showForm ? 'Cancel' : '+ New Assignment'}
        </button>
      </div>

      {showForm && (
        <NewAssignmentForm
          subjectAssignmentId={selectedSubject.subject_assignment_id}
          onDone={() => {
            setShowForm(false)
            queryClient.invalidateQueries({ queryKey: ['assignments', selectedSubject.subject_assignment_id] })
          }}
        />
      )}

      {isLoading && <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>}
      {!isLoading && assignments.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">No assignments posted yet.</div>
      )}

      <div className="flex flex-col gap-3">
        {assignments.map((a) => (
          <AssignmentCard key={a.id} assignment={a} onMark={handleMark} />
        ))}
      </div>
    </div>
  )
}

export default AssignmentsPanel