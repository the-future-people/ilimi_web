import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getLessonPlans,
  getLessonPlan,
  createLessonPlan,
  updateLessonPlan,
  updateLessonPlanDay,
  submitLessonPlan,
} from '../../api/lessonPlans'

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-50 text-blue-700',
  vetted: 'bg-green-50 text-green-700',
  returned: 'bg-red-50 text-red-700',
}

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''

const nextFriday = () => {
  const d = new Date()
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7))
  return d.toISOString().slice(0, 10)
}

const HEADER_FIELDS = [
  { key: 'strand', label: 'Strand', half: true },
  { key: 'sub_strand', label: 'Sub-strand', half: true },
  { key: 'content_standard_code', label: 'Content standard', half: true, placeholder: 'B4-4-4-1' },
  { key: 'indicator_code', label: 'Indicator', half: true, placeholder: 'B4-4-4-1-1' },
  { key: 'performance_indicator', label: 'Performance indicator', textarea: true },
  { key: 'core_competencies', label: 'Core competencies', half: true },
  { key: 'key_words', label: 'Key words', half: true },
  { key: 'tlr', label: 'T.L.R.s', half: true },
  { key: 'reference', label: 'Reference', half: true },
]

function WeekHeaderForm({ values, onChange, onDone, onCancel, saving, title }) {
  return (
    <div className="border-2 border-navy rounded-xl p-4">
      <div className="text-sm font-semibold text-navy mb-3">{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {HEADER_FIELDS.map((f) => (
          <div key={f.key} className={f.half ? '' : 'sm:col-span-2'}>
            <label className="text-[11px] font-semibold text-gray-500 mb-1 block">{f.label}</label>
            {f.textarea ? (
              <textarea
                rows={2}
                value={values[f.key] || ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold resize-none"
              />
            ) : (
              <input
                type="text"
                value={values[f.key] || ''}
                placeholder={f.placeholder || ''}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={onDone}
          disabled={saving}
          className="text-xs font-bold text-white bg-navy rounded-lg px-5 py-2 hover:bg-navy-light transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function PlanListItem({ plan, onOpen }) {
  return (
    <button
      onClick={() => onOpen(plan.id)}
      className="w-full text-left bg-white border border-gray-200 rounded-lg px-3 py-2.5 mb-1.5 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-2.5 mb-1">
        <div className="text-sm font-semibold text-navy">
          Week ending {fmtDate(plan.week_ending)}
        </div>
        <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLES[plan.status]}`}>
          {plan.status_display}
        </span>
      </div>
      <div className="text-xs text-gray-500">
        {plan.sub_strand || plan.strand || 'No strand set'} · {plan.days_written} day{plan.days_written !== 1 ? 's' : ''} written
      </div>
    </button>
  )
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

function DayEditor({ day, editable, onSaved }) {
  const [values, setValues] = useState({
    period: day.period || '',
    phase_1_starter: day.phase_1_starter || '',
    phase_2_main: day.phase_2_main || '',
    phase_3_plenary: day.phase_3_plenary || '',
  })
  const [savedAt, setSavedAt] = useState(null)

  const mutation = useMutation({
    mutationFn: (payload) => updateLessonPlanDay(day.id, payload),
    onSuccess: () => {
      setSavedAt(new Date())
      onSaved()
    },
  })

  const set = (key, value) => setValues((v) => ({ ...v, [key]: value }))
  const dirty =
    values.period !== (day.period || '') ||
    values.phase_1_starter !== (day.phase_1_starter || '') ||
    values.phase_2_main !== (day.phase_2_main || '') ||
    values.phase_3_plenary !== (day.phase_3_plenary || '')

  const field = (key, label, rows) => (
    <div className="mb-2.5">
      <label className="text-[11px] font-semibold text-gray-500 mb-1 block">{label}</label>
      <textarea
        rows={rows}
        disabled={!editable}
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold resize-none disabled:bg-gray-50 disabled:text-gray-600"
      />
    </div>
  )

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-sm font-semibold text-navy">{day.day_display}</span>
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-gray-500">Period</label>
          <input
            type="text"
            disabled={!editable}
            value={values.period}
            onChange={(e) => set('period', e.target.value)}
            placeholder="1 hour"
            className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-gold disabled:bg-gray-50"
          />
        </div>
      </div>

      {field('phase_1_starter', 'Starter — preparing the brain for learning', 3)}
      {field('phase_2_main', 'Main — new learning including assessment', 5)}
      {field('phase_3_plenary', 'Plenary and reflections', 3)}

      {editable && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
          <span className="text-[11px] text-gray-400">
            {mutation.isPending
              ? 'Saving...'
              : dirty
                ? 'Unsaved changes'
                : savedAt
                  ? 'Saved'
                  : ''}
          </span>
          <button
            onClick={() => mutation.mutate(values)}
            disabled={!dirty || mutation.isPending}
            className="text-xs font-bold text-white bg-navy rounded-lg px-5 py-2 hover:bg-navy-light transition disabled:opacity-40"
          >
            Save day
          </button>
        </div>
      )}
    </div>
  )
}

function PlanEditor({ planId, onBack }) {
  const queryClient = useQueryClient()
  const [activeDay, setActiveDay] = useState('monday')
  const [editingHeader, setEditingHeader] = useState(false)
  const [header, setHeader] = useState({})
  const [toast, setToast] = useState('')
  const [confirmEmpty, setConfirmEmpty] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['lesson-plan', planId],
    queryFn: () => getLessonPlan(planId),
  })

  const plan = data?.data
  const days = plan?.days || []
  const editable = plan?.is_editable
  const current = days.find((d) => d.day === activeDay)
  const daysWritten = days.filter((d) => d.has_content).length

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['lesson-plan', planId] })

  const headerMutation = useMutation({
    mutationFn: (payload) => updateLessonPlan(planId, payload),
    onSuccess: () => { setEditingHeader(false); refresh() },
  })

  const submitMutation = useMutation({
    mutationFn: () => submitLessonPlan(planId),
    onSuccess: (res) => {
      setToast(res.message || 'Submitted.')
      refresh()
      queryClient.invalidateQueries({ queryKey: ['lesson-plans'] })
      setTimeout(() => setToast(''), 3000)
    },
    onError: (err) => setToast(err.response?.data?.message || 'Could not submit.'),
  })

  const trySubmit = () => {
    const empty = days.filter((d) => !d.phase_2_main).map((d) => d.day_display)
    if (empty.length) setConfirmEmpty(empty)
    else submitMutation.mutate()
  }

  if (isLoading) {
    return <div className="text-center py-14 text-gray-400 text-sm">Loading plan...</div>
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
      </div>

      {editingHeader ? (
        <div className="mb-3">
          <WeekHeaderForm
            title="The week"
            values={header}
            onChange={(k, v) => setHeader((h) => ({ ...h, [k]: v }))}
            onCancel={() => setEditingHeader(false)}
            onDone={() => headerMutation.mutate(header)}
            saving={headerMutation.isPending}
          />
        </div>
      ) : (
        <div className={`bg-white rounded-xl p-4 mb-3 border ${
          plan.status === 'submitted' ? 'border-blue-300'
          : plan.status === 'returned' ? 'border-red-300'
          : plan.status === 'vetted' ? 'border-green-300'
          : 'border-gray-200'
        }`}>
          <div className="flex items-start justify-between gap-3 mb-2.5 flex-wrap">
            <div>
              <div className="text-[15px] font-semibold text-navy">
                Week ending {fmtDate(plan.week_ending)}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {plan.subject_name} · {plan.classroom_name}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${STATUS_STYLES[plan.status]}`}>
                {plan.status_display}
              </span>
              {editable && plan.strand && (
                <button
                  onClick={trySubmit}
                  disabled={submitMutation.isPending}
                  className="text-xs font-bold text-white bg-navy rounded-lg px-4 py-2 hover:bg-navy-light transition disabled:opacity-50"
                >
                  {submitMutation.isPending
                    ? 'Submitting...'
                    : plan.status === 'returned' ? 'Resubmit' : 'Submit for vetting'}
                </button>
              )}
            </div>
          </div>

          {plan.status === 'submitted' && (
            <div className="bg-blue-50 border-l-[3px] border-blue-500 px-3 py-2.5 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-xs text-blue-900">
                Handed in {fmtDate(plan.submitted_at)} · read-only until it is vetted
              </div>
            </div>
          )}

          {plan.status === 'returned' && (
            <div className="bg-red-50 border-l-[3px] border-red-700 px-3 py-2.5 flex items-start gap-2">
              <svg className="w-4 h-4 text-red-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-red-900">
                  {plan.vetted_by_name} returned this on {fmtDate(plan.vetted_at)}
                </div>
                <div className="text-[11px] text-red-700 mt-0.5">{plan.vetting_remarks}</div>
              </div>
            </div>
          )}

          {plan.status === 'vetted' && (
            <div className="bg-green-50 border-l-[3px] border-green-600 px-3 py-2.5 flex items-start gap-2">
              <svg className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-green-900">
                  Vetted by {plan.vetted_by_name} on {fmtDate(plan.vetted_at)}
                </div>
                {plan.vetting_remarks && (
                  <div className="text-[11px] text-green-700 mt-0.5">{plan.vetting_remarks}</div>
                )}
              </div>
            </div>
          )}

          {editable && !plan.strand ? (
            <div className="bg-amber-50 border-l-[3px] border-amber-600 px-3 py-2.5 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-4 h-4 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-amber-950">No strand set</div>
                  <div className="text-[11px] text-amber-800">Add the week details before submitting</div>
                </div>
              </div>
              <button
                onClick={() => { setHeader(plan); setEditingHeader(true) }}
                className="text-[11px] font-bold text-white bg-amber-600 px-3 py-1.5 rounded-lg hover:bg-amber-700 transition flex-shrink-0"
              >
                Add details
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg px-3 py-2.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-navy">
                  {[plan.strand, plan.sub_strand].filter(Boolean).join(' · ')}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {[plan.indicator_code, plan.tlr, plan.reference].filter(Boolean).join(' · ') || 'No indicator set'}
                </div>
              </div>
              {editable && (
                <button
                  onClick={() => { setHeader(plan); setEditingHeader(true) }}
                  className="text-[11px] font-semibold text-navy flex-shrink-0 hover:underline"
                >
                  Edit week
                </button>
              )}
            </div>
          )}

          {daysWritten > 0 && (
            <div className="flex items-center gap-2.5 mt-3">
              <div className="flex-1 h-[5px] bg-green-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 transition-all"
                  style={{ width: `${(daysWritten / 5) * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-green-700 whitespace-nowrap">
                {daysWritten} of 5 days written
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200 mb-3 overflow-x-auto no-scrollbar">
        {DAY_ORDER.map((key) => {
          const d = days.find((x) => x.day === key)
          const written = d?.has_content
          return (
            <button
              key={key}
              onClick={() => setActiveDay(key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
                activeDay === key ? 'border-gold text-navy' : 'border-transparent text-gray-400 hover:text-navy'
              }`}
            >
              <svg
                className={`w-3.5 h-3.5 ${written ? 'text-green-600' : 'text-gray-300'}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d={written ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}
                />
              </svg>
              {d?.day_display || key}
            </button>
          )
        })}
      </div>

      {current && (
        <DayEditor key={current.id} day={current} editable={editable} onSaved={refresh} />
      )}

      {confirmEmpty && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setConfirmEmpty(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg font-bold text-navy mb-2">Submit with empty days?</div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {confirmEmpty.join(', ')} {confirmEmpty.length === 1 ? 'has' : 'have'} nothing written.
              Submit anyway if you do not teach this class those days.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmEmpty(null)}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2.5 rounded-lg hover:bg-gray-200 transition"
              >
                Go back
              </button>
              <button
                onClick={() => { setConfirmEmpty(null); submitMutation.mutate() }}
                className="flex-1 bg-navy text-white text-sm font-bold py-2.5 rounded-lg hover:bg-navy-light transition"
              >
                Submit anyway
              </button>
            </div>
          </div>
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

function LessonNotesPanel({ classroomId, subjects = [] }) {
  const queryClient = useQueryClient()
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || null)
  const [openPlanId, setOpenPlanId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newPlan, setNewPlan] = useState({})
  const [toast, setToast] = useState('')

  const subject = subjects.find((s) => s.id === subjectId)

  const { data, isLoading } = useQuery({
    queryKey: ['lesson-plans', classroomId, subjectId],
    queryFn: () => getLessonPlans({ classroom: classroomId, subject: subjectId }),
    enabled: !!subjectId,
  })

  const plans = data?.data?.lesson_plans || []

  const createMutation = useMutation({
    mutationFn: createLessonPlan,
    onSuccess: (res) => {
      setCreating(false)
      setNewPlan({})
      queryClient.invalidateQueries({ queryKey: ['lesson-plans', classroomId, subjectId] })
      setOpenPlanId(res.data?.lesson_plan?.id)
    },
    onError: (err) => setToast(err.response?.data?.message || 'Could not start the plan.'),
  })

  const start = () => {
    createMutation.mutate({
      classroom: classroomId,
      subject: subjectId,
      term: subject?.term_id,
      week_ending: newPlan.week_ending || nextFriday(),
      ...newPlan,
    })
  }

   const copyLast = async () => {
    const last = plans[0]
    if (!last) return setToast('No earlier plan to copy.')
    try {
      const res = await getLessonPlan(last.id)
      const p = res.data
      setNewPlan({
        strand: p.strand,
        sub_strand: p.sub_strand,
        content_standard_code: p.content_standard_code,
        core_competencies: p.core_competencies,
        key_words: p.key_words,
        tlr: p.tlr,
        reference: p.reference,
        week_ending: nextFriday(),
      })
      setCreating(true)
    } catch {
      setToast('Could not copy the last plan.')
    }
  }

  if (!subjects.length) {
    return (
      <div className="p-4 sm:p-6 text-center py-14 text-gray-400 text-sm">
        No subjects assigned to you for this class.
      </div>
    )
  }

  if (openPlanId) {
    return (
      <div className="p-4 sm:p-6">
        <PlanEditor planId={openPlanId} onBack={() => setOpenPlanId(null)} />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] text-gray-400 flex-shrink-0">Subject</span>
          <select
            value={subjectId || ''}
            onChange={(e) => { setSubjectId(Number(e.target.value)); setCreating(false) }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold text-navy outline-none focus:border-gold bg-white"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {!creating && (
          <div className="flex gap-2">
            {plans.length > 0 && (
              <button
                onClick={copyLast}
                className="text-xs font-semibold text-navy border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition"
              >
                Copy last week
              </button>
            )}
            <button
              onClick={() => { setNewPlan({ week_ending: nextFriday() }); setCreating(true) }}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-navy rounded-lg px-3.5 py-2 hover:bg-navy-light transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New week
            </button>
          </div>
        )}
      </div>

      {creating && (
        <div className="mb-4">
          <div className="mb-2.5">
            <label className="text-[11px] font-semibold text-gray-500 mb-1 block">Week ending</label>
            <input
              type="date"
              value={newPlan.week_ending || ''}
              onChange={(e) => setNewPlan((p) => ({ ...p, week_ending: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
            />
          </div>
          <WeekHeaderForm
            title="Start a new week"
            values={newPlan}
            onChange={(k, v) => setNewPlan((p) => ({ ...p, [k]: v }))}
            onCancel={() => setCreating(false)}
            onDone={start}
            saving={createMutation.isPending}
          />
        </div>
      )}

      {isLoading && <div className="text-center py-14 text-gray-400 text-sm">Loading plans...</div>}

      {!isLoading && plans.length === 0 && !creating && (
        <div className="text-center py-14">
          <div className="text-sm font-semibold text-navy mb-1">No lesson plans yet</div>
          <div className="text-xs text-gray-400">
            Start a week for {subject?.name} and it will appear here.
          </div>
        </div>
      )}

      {plans.map((p) => (
        <PlanListItem key={p.id} plan={p} onOpen={setOpenPlanId} />
      ))}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-navy text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg z-50 border-l-4 border-gold">
          {toast}
        </div>
      )}
    </div>
  )
}

export default LessonNotesPanel