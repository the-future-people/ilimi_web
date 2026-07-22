import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCalendarTemplates, setupAcademicYear } from '../../api/academics'

const TERM_LABELS = {
  term_1: 'Term 1',
  term_2: 'Term 2',
  term_3: 'Term 3',
}

const BLANK_TERMS = ['term_1', 'term_2', 'term_3'].map((name) => ({
  name,
  start_date: '',
  end_date: '',
}))

function AcademicYearSetup({ onComplete }) {
  const [calendarId, setCalendarId] = useState('')
  const [currentTerm, setCurrentTerm] = useState('term_1')
  const [showDates, setShowDates] = useState(false)
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', terms: BLANK_TERMS })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['calendar-templates'],
    queryFn: getCalendarTemplates,
  })

  const calendars = data?.data?.calendars || []
  const suggestedId = data?.data?.suggested_calendar_id
  const suggestedTerm = data?.data?.suggested_term

  // Seed the form from the suggested calendar once templates arrive.
  useEffect(() => {
    if (!calendars.length || calendarId) return
    const initial = suggestedId || calendars[0].id
    setCalendarId(String(initial))
    if (suggestedTerm) setCurrentTerm(suggestedTerm)
  }, [calendars, suggestedId, suggestedTerm, calendarId])

  // Re-seed whenever the chosen calendar changes.
  useEffect(() => {
    if (!calendarId) return
    const tpl = calendars.find((c) => String(c.id) === String(calendarId))
    if (!tpl) return
    setForm({
      name: tpl.name,
      start_date: tpl.start_date,
      end_date: tpl.end_date,
      terms: tpl.terms.map((t) => ({
        name: t.name,
        start_date: t.start_date,
        end_date: t.end_date,
      })),
    })
  }, [calendarId, calendars])

  const updateTerm = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      terms: prev.terms.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    }))
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.name.trim()) return setError('Give the academic year a name, e.g. 2026/2027.')
    if (!form.start_date || !form.end_date) return setError('Set the start and end dates for the year.')
    if (form.terms.some((t) => !t.start_date || !t.end_date)) {
      setShowDates(true)
      return setError('Every term needs a start and end date.')
    }

    setSubmitting(true)
    try {
      const res = await setupAcademicYear({ ...form, current_term_name: currentTerm })
      onComplete?.(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not set up the academic year. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const fmt = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (isLoading) {
    return <div className="text-center py-16 text-gray-400 text-sm">Loading academic calendar...</div>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 sm:px-7 pt-7 pb-5 border-b border-gray-100">
        <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center mb-4">
          <svg className="w-5 h-5 text-gold-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-navy">Set up your academic year</h2>
        <p className="text-sm text-gray-400 mt-1.5 max-w-lg">
          Before you can create classes, your school needs an academic year and its terms.
          We've pre-filled the official GES calendar — adjust anything that differs for your school.
        </p>
      </div>

      <div className="px-5 sm:px-7 py-6 flex flex-col gap-6">
        {calendars.length === 0 && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            No published GES calendar is available yet, so you'll need to enter your dates manually below.
          </div>
        )}

        {/* Academic year */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            Academic Year
          </label>
          {calendars.length > 0 ? (
            <select
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              className="w-full sm:max-w-xs px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold bg-white"
            >
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.id === suggestedId ? ' — recommended' : ''}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. 2026/2027"
              className="w-full sm:max-w-xs px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
            />
          )}
        </div>

        {/* Starting term */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
            Which term are you starting in?
          </label>
          <p className="text-xs text-gray-400 mb-2.5">
            All three terms are created either way. This just tells us where you are now.
          </p>
          <div className="flex flex-wrap gap-2">
            {form.terms.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setCurrentTerm(t.name)}
                className={`px-4 py-2.5 rounded-lg text-sm font-bold border transition ${
                  currentTerm === t.name
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {TERM_LABELS[t.name]}
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Term Dates</label>
            <button
              type="button"
              onClick={() => setShowDates((v) => !v)}
              className="text-xs font-bold text-navy hover:underline"
            >
              {showDates ? 'Done adjusting' : 'Adjust dates'}
            </button>
          </div>

          {!showDates ? (
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
              {form.terms.map((t) => (
                <div key={t.name} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-semibold text-navy">
                    {TERM_LABELS[t.name]}
                    {currentTerm === t.name && (
                      <span className="ml-2 text-[10px] font-bold text-gold-dark bg-gold/15 px-2 py-0.5 rounded-full uppercase">
                        Current
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-400">
                    {fmt(t.start_date)} — {fmt(t.end_date)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Year starts</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Year ends</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
                  />
                </div>
              </div>

              {form.terms.map((t, i) => (
                <div key={t.name} className="border border-gray-100 rounded-xl p-4">
                  <div className="text-sm font-bold text-navy mb-3">{TERM_LABELS[t.name]}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Starts</label>
                      <input
                        type="date"
                        value={t.start_date}
                        onChange={(e) => updateTerm(i, 'start_date', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Ends</label>
                      <input
                        type="date"
                        value={t.end_date}
                        onChange={(e) => updateTerm(i, 'end_date', e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-navy text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-navy-light transition disabled:opacity-50"
          >
            {submitting ? 'Setting up...' : 'Create academic year'}
          </button>
          <span className="text-xs text-gray-400">You can change these dates later.</span>
        </div>
      </div>
    </div>
  )
}

export default AcademicYearSetup