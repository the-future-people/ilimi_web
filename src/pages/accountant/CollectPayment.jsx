import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { getAllStudents } from '../../api/students'
import { getSchoolClassrooms } from '../../api/academics'
import { getFeeTypeSummary, getStudentFees, createPayment, getClassroomFeeSummary } from '../../api/fees'
import { API_BASE_URL } from '../../config'

const STATUS_STYLES = {
  unpaid: 'bg-red-50 text-red-700',
  partial: 'bg-amber-50 text-amber-700',
  paid: 'bg-green-50 text-green-700',
  waived: 'bg-gray-100 text-gray-500',
  overdue: 'bg-red-50 text-red-700',
}

const METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'momo', label: 'MoMo' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
]
const MOMO_PROVIDERS = [
  { value: 'mtn', label: 'MTN MoMo' },
  { value: 'vodafone', label: 'Vodafone Cash' },
  { value: 'airteltigo', label: 'AirtelTigo Money' },
]

const BAND_LABELS = { early: 'Early Years', primary: 'Primary', jhs: 'JHS' }
const BAND_ORDER = ['early', 'primary', 'jhs']
const bandFor = (levelName = '') => {
  if (levelName.startsWith('nursery') || levelName.startsWith('kindergarten')) return 'early'
  if (levelName.startsWith('primary')) return 'primary'
  return 'jhs'
}

const FEE_ICONS = {
  school: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  feeding: 'M18.75 12.75h1.5a2.25 2.25 0 000-4.5h-1.5m-13.5 4.5a12 12 0 108.4-11.4M4.5 12a7.5 7.5 0 007.5 7.5',
  excursion: 'M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h.75M9 12h.75M9 17.25h.75',
  default: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
}
function iconFor(name = '') {
  const n = name.toLowerCase()
  if (n.includes('school') || n.includes('tuition')) return FEE_ICONS.school
  if (n.includes('feed') || n.includes('meal') || n.includes('lunch')) return FEE_ICONS.feeding
  if (n.includes('excursion') || n.includes('trip')) return FEE_ICONS.excursion
  return FEE_ICONS.default
}

const RING_R = 18
const RING_C = 2 * Math.PI * RING_R
const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"

function initials(name) {
  return name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '—'
}

// ── Step 1: pick what you're collecting ─────────────────────────────────
function FeeTypeSelector({ onSelect }) {
  const { data, isLoading } = useQuery({ queryKey: ['fee-type-summary'], queryFn: getFeeTypeSummary })
  const feeTypes = data?.data?.fee_type_summary || []

  if (isLoading) return <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>

  if (feeTypes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm py-16 px-6 text-center">
        <div className="text-sm font-bold text-navy mb-1">No fee types set up yet</div>
        <p className="text-xs text-gray-400 max-w-sm mx-auto">
          Ask your school admin to set up Fee Structures before collecting payments.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="text-sm font-bold text-navy mb-1">What are you collecting?</div>
      <p className="text-xs text-gray-400 mb-6">Pick a fee type to begin.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {feeTypes.map((ft) => {
          const offset = RING_C * (1 - ft.percent_collected / 100)
          return (
            <button
              key={ft.id}
              onClick={() => onSelect(ft)}
              className="text-left rounded-2xl p-6 flex flex-col gap-4 hover:-translate-y-1 transition"
              style={{
                background: '#1a2b4a',
                boxShadow: '0 12px 28px rgba(26,43,74,0.35)',
                outline: '2px dashed rgba(201,162,39,0.4)',
                outlineOffset: '6px',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,162,39,0.18)' }}>
                  <svg className="w-4 h-4" style={{ color: '#c9a227' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d={iconFor(ft.name)} />
                  </svg>
                </div>
                <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '20px', color: '#faf8f4' }}>{ft.name}</div>
              </div>
              <div className="flex gap-2.5">
                <div className="flex-1 rounded-xl p-2.5 flex flex-col items-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r={RING_R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                    <circle cx="22" cy="22" r={RING_R} fill="none" stroke="#c9a227" strokeWidth="4" strokeLinecap="round" strokeDasharray={RING_C} strokeDashoffset={offset} transform="rotate(-90 22 22)" />
                  </svg>
                  <div className="text-[11px] mt-1" style={{ color: 'rgba(250,248,244,0.7)' }}>{ft.percent_collected}% paid</div>
                </div>
                <div className="flex-1 rounded-xl p-2.5 flex flex-col items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="text-[15px] font-semibold" style={{ color: '#faf8f4' }}>GH₵{ft.total_outstanding.toFixed(0)}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'rgba(250,248,244,0.55)' }}>outstanding</div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 2a: By Class — grouped picker, worklist with multi-select ─────
function ByClass({ feeType, classroomId, setClassroomId, onSelectStudent, onSelectBatch }) {
  const [selectedIds, setSelectedIds] = useState([]) // ordered list of fee ids, selection order preserved

  const { data: summaryData } = useQuery({
    queryKey: ['classroom-fee-summary', feeType.id],
    queryFn: () => getClassroomFeeSummary(feeType.id),
  })
  const classroomSummary = summaryData?.data?.classroom_summary || []
  const needsAttention = classroomSummary.filter((c) => !c.settled)
  const settledOnes = classroomSummary.filter((c) => c.settled)
  const [showSettled, setShowSettled] = useState(false)

  const selectedClassroom = classroomSummary.find((c) => c.id === classroomId)

  const { data: feesData, isLoading } = useQuery({
    queryKey: ['class-fees', feeType.id, classroomId],
    queryFn: () => getStudentFees({ fee_type: feeType.id, classroom: classroomId }),
    enabled: !!classroomId,
  })
  const fees = feesData?.data?.student_fees || []
  const outstanding = fees.filter((f) => f.status !== 'paid' && f.status !== 'waived')

  const toggleSelect = (feeId) => {
    setSelectedIds((prev) =>
      prev.includes(feeId) ? prev.filter((id) => id !== feeId) : [...prev, feeId]
    )
  }

  const selectedFees = selectedIds.map((id) => outstanding.find((f) => f.id === id)).filter(Boolean)

  if (!classroomId) {
    const byBand = {}
    for (const c of classroomSummary) {
      const band = bandFor(c.level_name)
      if (!byBand[band]) byBand[band] = []
      byBand[band].push(c)
    }
    const grouped = BAND_ORDER.filter((b) => byBand[b]?.length).map((b) => ({ band: b, label: BAND_LABELS[b], classrooms: byBand[b] }))

    return (
      <div className="flex flex-col gap-5">
        {grouped.map((group) => (
          <div key={group.band}>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{group.label}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {group.classrooms.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setClassroomId(c.id)}
                  className="text-left flex items-center justify-between gap-3 px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-gold/40 transition"
                >
                  <span className="text-sm font-semibold text-navy truncate">{c.full_name}</span>
                  {c.settled ? (
                    <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">Settled</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                      {c.owing_count} owe · GH₵{c.outstanding.toFixed(0)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => { setClassroomId(null); setSelectedIds([]) }}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition hover:opacity-90 flex-shrink-0"
          style={{ background: '#1a2b4a', color: '#c9a227' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Change class
        </button>
        <div className="text-sm font-bold text-navy truncate">{selectedClassroom?.full_name} — {feeType.name}</div>
      </div>

      {isLoading && <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>}

      {!isLoading && outstanding.length === 0 && (
        <div className="text-center py-8 text-green-700 text-sm bg-green-50 rounded-xl">
          Everyone in this class is settled for {feeType.name}. ✓
        </div>
      )}

      {outstanding.length > 0 && (
        <div className="flex flex-col gap-2 mb-16">
          {outstanding.map((f) => {
            const checked = selectedIds.includes(f.id)
            return (
              <div
                key={f.id}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition ${
                  checked ? 'border-gold bg-gold/5' : 'border-gray-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSelect(f.id)}
                  className="w-4 h-4 accent-navy cursor-pointer flex-shrink-0"
                />
                <button
                  onClick={() => onSelectStudent({ id: f.student, full_name: f.student_name, student_id: f.student_id }, f)}
                  className="flex-1 flex items-center justify-between gap-3 text-left min-w-0"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-navy truncate">{f.student_name}</div>
                    <div className="text-xs text-gray-400">{f.student_id}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[f.status] || 'bg-gray-100 text-gray-500'}`}>
                      {f.status}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-bold text-navy">GH₵{Number(f.balance).toFixed(2)}</div>
                      <div className="text-[10px] text-gray-400">owed</div>
                    </div>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-navy rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-4 z-50 max-w-[92vw]">
          <span className="text-sm text-white font-semibold whitespace-nowrap">
            {selectedIds.length} student{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="w-px h-5 bg-white/15 flex-shrink-0" />
          <button
            onClick={() => onSelectBatch(selectedFees)}
            className="text-sm font-bold text-navy bg-gold px-4 py-2 rounded-lg hover:bg-gold-light transition whitespace-nowrap"
          >
            Pay for Selected
          </button>
          <button onClick={() => setSelectedIds([])} className="text-white/50 hover:text-white transition flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Step 2b: By Student — search, scoped to this fee type (single only) ─
function ByStudent({ feeType, onSelectStudent }) {
  const [query, setQuery] = useState('')
  const [applied, setApplied] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['payment-student-search', applied],
    queryFn: () => getAllStudents({ search: applied, page_size: 10 }),
    enabled: applied.length > 1,
  })
  const results = data?.data?.students || []

  const [selected, setSelected] = useState(null)
  const { data: feesData, isLoading: loadingFees } = useQuery({
    queryKey: ['student-fee-type-fees', selected?.id, feeType.id],
    queryFn: () => getStudentFees({ student: selected.id, fee_type: feeType.id }),
    enabled: !!selected,
  })
  const fees = feesData?.data?.student_fees || []
  const outstanding = fees.filter((f) => f.status !== 'paid' && f.status !== 'waived')

  if (selected) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition hover:opacity-90 flex-shrink-0"
            style={{ background: '#1a2b4a', color: '#c9a227' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Change student
          </button>
          <div className="text-sm font-bold text-navy truncate">{selected.full_name} — {feeType.name}</div>
        </div>
        {loadingFees && <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>}
        {!loadingFees && outstanding.length === 0 && (
          <div className="text-center py-8 text-green-700 text-sm bg-green-50 rounded-xl">{selected.full_name} is settled for {feeType.name}. ✓</div>
        )}
        {outstanding.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelectStudent(selected, f)}
            className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-gold/50 hover:bg-gold/5 transition text-left"
          >
            <div className="text-sm font-semibold text-navy">{f.term_name}</div>
            <div className="text-sm font-bold text-navy">GH₵{Number(f.balance).toFixed(2)} owed</div>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
      <div className="relative">
        <svg className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          autoFocus type="text" placeholder="Search by name or student ID..."
          value={query} onChange={(e) => { setQuery(e.target.value); setApplied(e.target.value) }}
          className={`${inputClass} pl-9`}
        />
      </div>
      {isLoading && applied.length > 1 && <div className="text-center py-8 text-gray-400 text-sm">Searching...</div>}
      {results.length > 0 && (
        <div className="mt-4 flex flex-col gap-1.5">
          {results.map((s) => (
            <button key={s.id} onClick={() => setSelected(s)} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gold/50 hover:bg-gold/5 transition text-left">
              <div className="w-10 h-10 rounded-lg bg-navy text-white text-xs font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                {s.photo ? <img src={`${API_BASE_URL}${s.photo}`} alt="" className="w-full h-full object-cover" /> : initials(s.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-navy truncate">{s.full_name}</div>
                <div className="text-xs text-gray-400 truncate">{s.student_id}{s.classroom_name ? ` · ${s.classroom_name}` : ''}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Step 3a: single payment form ────────────────────────────────────────
function PaymentForm({ student, fee, onBack, onDone }) {
  const [amount, setAmount] = useState(String(fee.balance))
  const [method, setMethod] = useState('cash')
  const [momoProvider, setMomoProvider] = useState('')
  const [momoNumber, setMomoNumber] = useState('')
  const [momoTxnId, setMomoTxnId] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankReference, setBankReference] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) return setError('Enter a valid amount.')
    if (numAmount > Number(fee.balance)) return setError(`Amount exceeds the outstanding balance of GH₵${Number(fee.balance).toFixed(2)}.`)
    setSaving(true)
    try {
      const payload = { student_fee: fee.id, amount: numAmount, payment_method: method, payment_date: new Date().toISOString().split('T')[0], notes }
      if (method === 'momo') { payload.momo_provider = momoProvider; payload.momo_number = momoNumber; payload.momo_transaction_id = momoTxnId }
      if (method === 'bank_transfer') { payload.bank_name = bankName; payload.bank_reference = bankReference }
      const res = await createPayment(payload)
      onDone(res.data)
    } catch (err) {
      const data = err.response?.data
      const fieldError = data?.errors && Object.values(data.errors)[0]?.[0]
      setError(fieldError || data?.message || 'Could not record the payment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition hover:opacity-90 flex-shrink-0"
          style={{ background: '#1a2b4a', color: '#c9a227' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <div className="min-w-0">
          <div className="text-sm font-bold text-navy truncate">{student.full_name}</div>
          <div className="text-xs text-gray-400">Balance GH₵{Number(fee.balance).toFixed(2)}</div>
        </div>
      </div>
     <div>
        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Amount (GH₵)</label>
        <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
      </div>
      <MethodFields
        method={method} setMethod={setMethod}
        momoProvider={momoProvider} setMomoProvider={setMomoProvider}
        momoNumber={momoNumber} setMomoNumber={setMomoNumber}
        momoTxnId={momoTxnId} setMomoTxnId={setMomoTxnId}
        bankName={bankName} setBankName={setBankName}
        bankReference={bankReference} setBankReference={setBankReference}
        notes={notes} setNotes={setNotes}
        error={error} saving={saving} onSubmit={handleSubmit}
        buttonLabel={`Record GH₵${amount || '0.00'} Payment`}
      />
    </div>
  )
}

// ── Step 3b: batch payment form — same amount applied to each selected ──
function BatchPaymentForm({ feeType, students, onBack, onDone }) {
  // Per-student amount, defaulting to each one's real balance. Editable
  // individually — the common case (everyone pays in full) needs no
  // edits at all; a partial payment for one student is a single field.
  const [amounts, setAmounts] = useState(
    () => Object.fromEntries(students.map((f) => [f.id, String(f.balance)]))
  )
  const [method, setMethod] = useState('cash')
  const [momoProvider, setMomoProvider] = useState('')
  const [momoNumber, setMomoNumber] = useState('')
  const [momoTxnId, setMomoTxnId] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankReference, setBankReference] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)

  const setAmountFor = (feeId, value) => {
    setAmounts((prev) => ({ ...prev, [feeId]: value }))
  }

  const total = students.reduce((sum, f) => sum + (Number(amounts[f.id]) || 0), 0)

  const handleSubmit = async () => {
    setError('')
    const invalid = students.find((f) => !(Number(amounts[f.id]) > 0))
    if (invalid) return setError(`Enter a valid amount for ${invalid.student_name}.`)

    setSaving(true)
    const results = []
    for (let i = 0; i < students.length; i += 1) {
      const fee = students[i]
      const numAmount = Number(amounts[fee.id])
      setProgress(i + 1)
      try {
        const payload = { student_fee: fee.id, amount: numAmount, payment_method: method, payment_date: new Date().toISOString().split('T')[0], notes }
        if (method === 'momo') { payload.momo_provider = momoProvider; payload.momo_number = momoNumber; payload.momo_transaction_id = momoTxnId }
        if (method === 'bank_transfer') { payload.bank_name = bankName; payload.bank_reference = bankReference }
        const res = await createPayment(payload)
        results.push({ student_name: fee.student_name, success: true, receipt_number: res.data.receipt_number, amount: numAmount })
      } catch (err) {
        const data = err.response?.data
        const fieldError = data?.errors && Object.values(data.errors)[0]?.[0]
        results.push({ student_name: fee.student_name, success: false, error: fieldError || data?.message || 'Failed.' })
      }
    }
    setSaving(false)
    onDone(results)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-1">
        <button
          onClick={onBack}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition hover:opacity-90 disabled:opacity-40 flex-shrink-0"
          style={{ background: '#1a2b4a', color: '#c9a227' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <div className="text-sm font-bold text-navy truncate">{students.length} students — {feeType.name}</div>
      </div>
      <p className="text-xs text-gray-400 mb-4">Defaults to each student's full balance — edit any amount for a partial payment.</p>

      <div className="flex flex-col gap-2 mb-4">
        {students.map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-gray-50/60 rounded-xl">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-navy truncate">{f.student_name}</div>
              <div className="text-[11px] text-gray-400">Owes GH₵{Number(f.balance).toFixed(2)}</div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs text-gray-400">GH₵</span>
              <input
                type="number" step="0.01"
                value={amounts[f.id]}
                onChange={(e) => setAmountFor(f.id, e.target.value)}
                className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right outline-none focus:border-gold"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-3.5 py-3 bg-gold/10 rounded-xl mb-4">
        <span className="text-sm font-bold text-navy">Total</span>
        <span className="text-lg font-bold text-navy">GH₵{total.toFixed(2)}</span>
      </div>

      <MethodFields
        method={method} setMethod={setMethod}
        momoProvider={momoProvider} setMomoProvider={setMomoProvider}
        momoNumber={momoNumber} setMomoNumber={setMomoNumber}
        momoTxnId={momoTxnId} setMomoTxnId={setMomoTxnId}
        bankName={bankName} setBankName={setBankName}
        bankReference={bankReference} setBankReference={setBankReference}
        notes={notes} setNotes={setNotes}
        error={error} saving={saving} onSubmit={handleSubmit}
        buttonLabel={saving ? `Recording ${progress} of ${students.length}...` : `Record GH₵${total.toFixed(2)} for ${students.length} Students`}
      />
    </div>
  )
}

// ── Shared amount/method/notes fields, used by both single and batch ────
function MethodFields({
  method, setMethod,
  momoProvider, setMomoProvider, momoNumber, setMomoNumber, momoTxnId, setMomoTxnId,
  bankName, setBankName, bankReference, setBankReference,
  notes, setNotes, error, saving, onSubmit, buttonLabel,
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Payment Method</label>
        <div className="flex gap-2">
          {METHOD_OPTIONS.map((m) => (
            <button
              key={m.value} type="button" onClick={() => setMethod(m.value)}
              className={`flex-1 text-sm font-bold py-2.5 rounded-lg border transition ${
                method === m.value ? 'bg-navy text-white border-navy' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {method === 'momo' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-gray-50/60 rounded-xl">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Provider</label>
            <select value={momoProvider} onChange={(e) => setMomoProvider(e.target.value)} className={inputClass}>
              <option value="">Select...</option>
              {MOMO_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">MoMo Number</label>
            <input type="text" value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} className={inputClass} placeholder="024..." />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Transaction ID</label>
            <input type="text" value={momoTxnId} onChange={(e) => setMomoTxnId(e.target.value)} className={inputClass} placeholder="Optional" />
          </div>
        </div>
      )}

      {method === 'bank_transfer' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-gray-50/60 rounded-xl">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Bank Name</label>
            <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Reference</label>
            <input type="text" value={bankReference} onChange={(e) => setBankReference(e.target.value)} className={inputClass} placeholder="Optional" />
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Notes (optional)</label>
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} />
      </div>

      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">{error}</div>}

      <button onClick={onSubmit} disabled={saving} className="bg-gold text-navy text-sm font-bold py-3 rounded-lg hover:bg-gold-light transition disabled:opacity-50">
        {buttonLabel}
      </button>
    </div>
  )
}

function ReceiptConfirmation({ payment, student, onCollectAnother }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8 sm:p-10 text-center">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="font-serif text-xl font-bold text-navy mb-1">Payment recorded</div>
      <p className="text-sm text-gray-400 mb-5">GH₵{Number(payment.amount).toFixed(2)} from {student.full_name}</p>
      <div className="inline-block bg-gray-50 rounded-xl px-5 py-3 mb-6">
        <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Receipt Number</div>
        <div className="text-lg font-bold text-navy">{payment.receipt_number}</div>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button onClick={onCollectAnother} className="bg-navy text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-navy-light transition">Collect Another Payment</button>
        <Link to="/accountant" className="bg-gray-100 text-gray-600 text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-gray-200 transition">Back to Dashboard</Link>
      </div>
    </div>
  )
}

function BatchReceiptConfirmation({ results, onCollectAnother }) {
  const succeeded = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="font-serif text-xl font-bold text-navy mb-1">
          {succeeded.length} of {results.length} payments recorded
        </div>
        {failed.length > 0 && <p className="text-sm text-red-600">{failed.length} could not be recorded — see below.</p>}
      </div>

      <div className="flex flex-col gap-2 mb-6">
        {results.map((r, i) => (
          <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl ${r.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <span className={`text-sm font-semibold ${r.success ? 'text-green-800' : 'text-red-700'}`}>{r.student_name}</span>
            {r.success ? (
              <span className="text-xs font-bold text-green-700">{r.receipt_number} · GH₵{Number(r.amount).toFixed(2)}</span>
            ) : (
              <span className="text-xs text-red-600">{r.error}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button onClick={onCollectAnother} className="bg-navy text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-navy-light transition">Collect Another Payment</button>
        <Link to="/accountant" className="bg-gray-100 text-gray-600 text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-gray-200 transition">Back to Dashboard</Link>
      </div>
    </div>
  )
}

function Breadcrumb({ feeType, onChangeFeeType }) {
  return (
    <div className="flex items-center gap-2.5 text-[15px] mb-6">
      <Link to="/accountant" className="flex items-center gap-1.5 text-gray-400 hover:text-navy transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Dashboard
      </Link>

      <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
      </svg>

      {feeType ? (
        <button onClick={onChangeFeeType} className="flex items-center gap-1.5 text-gray-400 hover:text-navy transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2m0-2c-1.11 0-2.08-.402-2.599-1M12 21a9 9 0 100-18 9 9 0 000 18z" />
          </svg>
          Collect payment
        </button>
      ) : (
        <span className="flex items-center gap-1.5 text-navy font-semibold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2m0-2c-1.11 0-2.08-.402-2.599-1M12 21a9 9 0 100-18 9 9 0 000 18z" />
          </svg>
          Collect payment
        </span>
      )}

      {feeType && (
        <>
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <span className="flex items-center gap-1.5 font-semibold" style={{ color: '#c9a227' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={iconFor(feeType.name)} />
            </svg>
            {feeType.name}
          </span>
        </>
      )}
    </div>
  )
}

function CollectPayment() {
  const queryClient = useQueryClient()
  const [feeType, setFeeType] = useState(null)
  const [mode, setMode] = useState('class')
  const [classroomId, setClassroomId] = useState(null)
  const [target, setTarget] = useState(null)       // single: { student, fee }
  const [batch, setBatch] = useState(null)          // batch: [fee, fee, ...]
  const [receipt, setReceipt] = useState(null)       // single result
  const [batchResults, setBatchResults] = useState(null) // batch results array

  const invalidateFees = async () => {
    await queryClient.invalidateQueries({ queryKey: ['class-fees'] })
    await queryClient.invalidateQueries({ queryKey: ['student-fee-type-fees'] })
    await queryClient.invalidateQueries({ queryKey: ['fee-type-summary'] })
  }

  const handlePaymentDone = async (payment) => {
    await invalidateFees()
    setReceipt(payment)
  }

  const handleBatchDone = async (results) => {
    await invalidateFees()
    setBatchResults(results)
  }

  const collectAnother = () => {
    // Return to the same fee type + mode + classroom she was already in —
    // most of her real work is one fee type across many students in one
    // class, not re-choosing the fee type or class every time.
    setTarget(null)
    setBatch(null)
    setReceipt(null)
    setBatchResults(null)
  }

  return (
    <div className="min-h-screen">
      <PortalHeader />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <Breadcrumb feeType={feeType} onChangeFeeType={() => setFeeType(null)} />

        {receipt ? (
          <ReceiptConfirmation payment={receipt} student={target.student} onCollectAnother={collectAnother} />
        ) : batchResults ? (
          <BatchReceiptConfirmation results={batchResults} onCollectAnother={collectAnother} />
        ) : !feeType ? (
          <FeeTypeSelector onSelect={(ft) => { setFeeType(ft); setClassroomId(null) }} />
        ) : target ? (
          <PaymentForm student={target.student} fee={target.fee} onBack={() => setTarget(null)} onDone={handlePaymentDone} />
        ) : batch ? (
          <BatchPaymentForm feeType={feeType} students={batch} onBack={() => setBatch(null)} onDone={handleBatchDone} />
        ) : (
          <>
            <div className="flex items-center gap-1 border-b border-gray-200 mb-5">
              {[{ key: 'class', label: 'By Class' }, { key: 'student', label: 'By Student' }].map((t) => (
                <button
                  key={t.key} onClick={() => setMode(t.key)}
                  className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition ${mode === t.key ? 'text-navy border-navy' : 'text-gray-400 border-transparent hover:text-navy'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {mode === 'class' ? (
              <ByClass
                feeType={feeType}
                classroomId={classroomId}
                setClassroomId={setClassroomId}
                onSelectStudent={(s, f) => setTarget({ student: s, fee: f })}
                onSelectBatch={(fees) => setBatch(fees)}
              />
            ) : (
              <ByStudent feeType={feeType} onSelectStudent={(s, f) => setTarget({ student: s, fee: f })} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CollectPayment