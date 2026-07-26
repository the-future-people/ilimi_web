import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { useAuth } from '../../context/AuthContext'
import { getSchoolClassrooms } from '../../api/academics'
import { getAllStudents } from '../../api/students'
import {
  getExcursions, createExcursion, requestExcursionConsent,
  getConsentRequests, createConsentRequest,
  generateConsentPdf, emailConsentPdf, getConsentWhatsAppLink,
} from '../../api/communications'

const inputClass = "px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
const PAGE_SIZE = 15

const CONSENT_TYPE_LABELS = {
  first_aid: 'First Aid Administration',
  image_use: "Use of Child's Image / Likeness",
  excursion: 'Excursion / Trip',
  other: 'Other',
}

const CONSENT_TYPE_STYLES = {
  first_aid: { bg: 'bg-red-50', text: 'text-red-600', icon: 'M12 4.5v15m7.5-7.5h-15' },
  image_use: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z' },
  excursion: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  other: { bg: 'bg-gray-100', text: 'text-gray-500', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
}

const STATUS_STYLES = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  granted: { bg: 'bg-green-50', text: 'text-green-700', icon: 'M5 13l4 4L19 7' },
  denied: { bg: 'bg-red-50', text: 'text-red-700', icon: 'M6 18L18 6M6 6l12 12' },
  expired: { bg: 'bg-gray-100', text: 'text-gray-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
}

const TABS = [
  { key: 'communications', label: 'Communications' },
  { key: 'consents', label: 'Consents' },
  { key: 'authorization', label: 'Authorization' },
]

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatBlock({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={icon} />
      </svg>
      <div>
        <div className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold leading-none">{label}</div>
        <div className="text-xs text-navy font-semibold mt-0.5">{value}</div>
      </div>
    </div>
  )
}

function ExcursionCard({ excursion, onRequestConsent, requesting, result }) {
  const { granted, denied, pending, total } = excursion.consent_summary
  const respondedPct = total > 0 ? Math.round(((granted + denied) / total) * 100) : 0
  const grantedPct = total > 0 ? (granted / total) * 100 : 0
  const deniedPct = total > 0 ? (denied / total) * 100 : 0
  const pendingPct = total > 0 ? (pending / total) * 100 : 0

  return (
    <div className="relative">
      <div className="absolute -top-2 -right-2 w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl -rotate-2" />
      <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={CONSENT_TYPE_STYLES.excursion.icon} />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-navy">{excursion.name}</div>
              <div className="text-xs text-gray-400">{excursion.classroom_names.join(', ') || 'No classes linked'}</div>
            </div>
          </div>
          <button
            onClick={() => onRequestConsent(excursion.id)}
            disabled={requesting}
            className="text-xs font-semibold bg-navy text-white px-3.5 py-2 rounded-lg hover:bg-navy-light transition disabled:opacity-50 whitespace-nowrap flex-shrink-0"
          >
            {requesting ? 'Sending...' : 'Request Consent'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatBlock icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" label="Date" value={formatDate(excursion.date)} />
          <StatBlock icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" label="Location" value={excursion.location || '—'} />
          <StatBlock icon="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" label="Classes" value={excursion.classroom_names.length} />
        </div>

        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Response Progress</span>
          <span className="text-[10px] font-semibold text-navy">{respondedPct}% responded</span>
        </div>
        {total > 0 ? (
          <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
            {grantedPct > 0 && <div className="bg-green-500" style={{ width: `${grantedPct}%` }} />}
            {deniedPct > 0 && <div className="bg-red-500" style={{ width: `${deniedPct}%` }} />}
            {pendingPct > 0 && <div className="bg-amber-400" style={{ width: `${pendingPct}%` }} />}
          </div>
        ) : (
          <div className="h-2 rounded-full bg-gray-100" />
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px] text-gray-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{granted} granted</span>
          <span className="text-[10px] text-gray-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{denied} denied</span>
          <span className="text-[10px] text-gray-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{pending} pending</span>
        </div>

        {result && (
          <div className={`text-xs mt-2 ${result.isError ? 'text-red-600' : 'text-green-700'}`}>{result.message}</div>
        )}
      </div>
    </div>
  )
}

function ConsentRequestRow({ cr, onGeneratePdf, onEmail, onWhatsApp, actionState }) {
  const typeStyle = CONSENT_TYPE_STYLES[cr.consent_type] || CONSENT_TYPE_STYLES.other
  const statusStyle = STATUS_STYLES[cr.is_expired ? 'expired' : cr.status] || STATUS_STYLES.pending

  return (
    <div className="flex items-center gap-3 p-4">
      <div className={`w-10 h-10 rounded-lg ${typeStyle.bg} flex items-center justify-center flex-shrink-0`}>
        <svg className={`w-5 h-5 ${typeStyle.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={typeStyle.icon} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-navy">{cr.student_name}</div>
        <div className="text-xs text-gray-400">
          {CONSENT_TYPE_LABELS[cr.consent_type]}{cr.excursion_name ? ` Â· ${cr.excursion_name}` : ''}
          {cr.guardian_name ? ` Â· ${cr.guardian_name}` : ''}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onGeneratePdf(cr.id)}
          disabled={actionState.id === cr.id}
          title="Generate / Download PDF"
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-40"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
        <button
          onClick={() => onEmail(cr.id)}
          disabled={actionState.id === cr.id}
          title="Email to Guardian"
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-40"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>
        <button
          onClick={() => onWhatsApp(cr.id)}
          disabled={actionState.id === cr.id}
          title="Share via WhatsApp"
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-green-50 transition disabled:opacity-40"
        >
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.85.505 3.583 1.383 5.07L2 22l5.056-1.362A9.955 9.955 0 0012.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.176a8.157 8.157 0 01-4.15-1.135l-.298-.177-3.007.81.81-2.938-.194-.303A8.15 8.15 0 013.826 12c0-4.508 3.667-8.176 8.175-8.176 4.508 0 8.175 3.668 8.175 8.176 0 4.508-3.667 8.176-8.175 8.176z" />
          </svg>
        </button>
      </div>

      <span className={`text-[11px] font-semibold pl-2 pr-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${statusStyle.bg} ${statusStyle.text}`}>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={statusStyle.icon} />
        </svg>
        <span className="capitalize">{cr.is_expired ? 'expired' : cr.status}</span>
      </span>
    </div>
  )
}

function GroupHeader({ label, count }) {
  return (
    <div className="px-4 pt-4 pb-2 bg-gray-50/80 border-y-2 border-navy/10">
      <span className="text-sm font-bold text-navy">{label || 'Unassigned'}</span>
      <span className="text-[11px] text-gray-400 font-semibold ml-2">{count} student{count !== 1 ? 's' : ''}</span>
    </div>
  )
}

function Pagination({ page, totalPages, hasNext, hasPrevious, onChange }) {
  if (totalPages <= 1) return null
  const pageNumbers = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const nums = new Set([1, totalPages, page, page - 1, page + 1])
    return Array.from(nums).filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
  })()

  return (
    <div className="flex items-center justify-center gap-1.5 p-4 border-t border-gray-100">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={!hasPrevious}
        className="flex items-center gap-1 text-xs font-semibold text-gray-500 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40 disabled:pointer-events-none"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Previous
      </button>
      {pageNumbers.map((n, i) => (
        <span key={n} className="flex items-center">
          {i > 0 && pageNumbers[i - 1] !== n - 1 && <span className="text-xs text-gray-300 px-1">Â·Â·Â·</span>}
          <button
            onClick={() => onChange(n)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition ${n === page ? 'bg-navy text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {n}
          </button>
        </span>
      ))}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={!hasNext}
        className="flex items-center gap-1 text-xs font-semibold text-gray-500 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40 disabled:pointer-events-none"
      >
        Next
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

function GroupedRequestList({ requests, onGeneratePdf, onEmail, onWhatsApp, actionState }) {
  const groups = useMemo(() => {
    const segments = []
    let current = null
    for (const cr of requests) {
      const key = cr.current_class_id ?? 'unassigned'
      if (!current || current.key !== key) {
        current = { key, label: cr.classroom_name, requests: [] }
        segments.push(current)
      }
      current.requests.push(cr)
    }
    return segments
  }, [requests])

  return (
    <div className="flex flex-col divide-y divide-gray-50">
      {groups.map((group) => (
        <div key={`${group.key}-${group.requests[0].id}`}>
          <GroupHeader label={group.label} count={group.requests.length} />
          <div className="flex flex-col divide-y divide-gray-50">
            {group.requests.map((cr) => (
              <ConsentRequestRow
                key={cr.id}
                cr={cr}
                onGeneratePdf={onGeneratePdf}
                onEmail={onEmail}
                onWhatsApp={onWhatsApp}
                actionState={actionState}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CommunicationsPlaceholder() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-10 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
      <div className="font-serif text-lg font-bold text-navy mb-1">Coming Soon</div>
      <p className="text-sm text-gray-400 max-w-sm">
        Send broadcast announcements to the whole school, target a specific class, or message an individual parent — via SMS, WhatsApp, or email.
      </p>
    </div>
  )
}

export default function CommunicationsCenter() {
  const { activeMember } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('communications')

  const { data: excursionsData, isLoading: excursionsLoading } = useQuery({
    queryKey: ['excursions'],
    queryFn: getExcursions,
  })
  const excursions = excursionsData?.data?.excursions || []

  const { data: classroomsData } = useQuery({
    queryKey: ['school-classrooms'],
    queryFn: getSchoolClassrooms,
  })
  const classrooms = classroomsData?.data?.classrooms || []

  const [showExcursionModal, setShowExcursionModal] = useState(false)
  const [excName, setExcName] = useState('')
  const [excDescription, setExcDescription] = useState('')
  const [excLocation, setExcLocation] = useState('')
  const [excDate, setExcDate] = useState('')
  const [excClassrooms, setExcClassrooms] = useState([])
  const [excLoading, setExcLoading] = useState(false)
  const [excError, setExcError] = useState('')

  const resetExcursionForm = () => {
    setExcName(''); setExcDescription(''); setExcLocation(''); setExcDate(''); setExcClassrooms([])
    setExcError('')
  }

  const toggleExcClassroom = (id) => {
    setExcClassrooms((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])
  }

  const handleCreateExcursion = async () => {
    if (!excName.trim() || !excDate || excClassrooms.length === 0) {
      setExcError('Name, date, and at least one class are required.')
      return
    }
    setExcLoading(true)
    setExcError('')
    try {
      await createExcursion({
        name: excName, description: excDescription, location: excLocation,
        date: excDate, classrooms: excClassrooms,
      })
      await queryClient.invalidateQueries({ queryKey: ['excursions'] })
      setShowExcursionModal(false)
      resetExcursionForm()
    } catch (err) {
      setExcError(err.response?.data?.message || 'Failed to create excursion.')
    } finally {
      setExcLoading(false)
    }
  }

  const [requestingId, setRequestingId] = useState(null)
  const [requestResult, setRequestResult] = useState(null)

  const handleRequestConsent = async (excursionId) => {
    setRequestingId(excursionId)
    setRequestResult(null)
    try {
      const res = await requestExcursionConsent(excursionId)
      setRequestResult({ excursionId, message: res.data?.message || res.message })
      await queryClient.invalidateQueries({ queryKey: ['excursions'] })
      await queryClient.invalidateQueries({ queryKey: ['consent-requests'] })
    } catch (err) {
      setRequestResult({ excursionId, message: err.response?.data?.message || 'Failed to send requests.', isError: true })
    } finally {
      setRequestingId(null)
    }
  }

  const [consentsStatusFilter, setConsentsStatusFilter] = useState('')
  const [consentsPage, setConsentsPage] = useState(1)
  const { data: digitalData, isLoading: digitalLoading } = useQuery({
    queryKey: ['consent-requests', 'digital_link', consentsStatusFilter, consentsPage],
    queryFn: () => getConsentRequests({
      method: 'digital_link',
      status: consentsStatusFilter || undefined,
      page: consentsPage,
      page_size: PAGE_SIZE,
    }),
    enabled: activeTab === 'consents',
  })
  const digitalRequests = digitalData?.data?.requests || []
  const digitalTotalPages = digitalData?.data?.total_pages || 0
  const digitalHasNext = digitalData?.data?.has_next || false
  const digitalHasPrevious = digitalData?.data?.has_previous || false

  const [authStatusFilter, setAuthStatusFilter] = useState('')
  const [authPage, setAuthPage] = useState(1)
  const { data: manualData, isLoading: manualLoading } = useQuery({
    queryKey: ['consent-requests', 'manual', authStatusFilter, authPage],
    queryFn: () => getConsentRequests({
      method: 'manual',
      status: authStatusFilter || undefined,
      page: authPage,
      page_size: PAGE_SIZE,
    }),
    enabled: activeTab === 'authorization',
  })
  const manualRequests = manualData?.data?.requests || []
  const manualTotalPages = manualData?.data?.total_pages || 0
  const manualHasNext = manualData?.data?.has_next || false
  const manualHasPrevious = manualData?.data?.has_previous || false

  const [actionState, setActionState] = useState({ id: null, type: null, message: '', isError: false })

  const invalidateConsentLists = () => {
    queryClient.invalidateQueries({ queryKey: ['consent-requests'] })
  }

  const handleGeneratePdf = async (id) => {
    setActionState({ id, type: 'pdf', message: '', isError: false })
    try {
      const res = await generateConsentPdf(id)
      const url = res.data?.pdf_url || res.pdf_url
      if (url) window.open(url, '_blank')
      setActionState({ id: null, type: null, message: '', isError: false })
    } catch (err) {
      setActionState({ id: null, type: null, message: err.response?.data?.message || 'Failed to generate PDF.', isError: true })
    }
  }

  const handleEmail = async (id) => {
    setActionState({ id, type: 'email', message: '', isError: false })
    try {
      const res = await emailConsentPdf(id)
      setActionState({ id: null, type: null, message: res.data?.message || res.message, isError: false })
    } catch (err) {
      setActionState({ id: null, type: null, message: err.response?.data?.message || 'Failed to email PDF.', isError: true })
    }
  }

  const handleWhatsApp = async (id) => {
    setActionState({ id, type: 'whatsapp', message: '', isError: false })
    try {
      const res = await getConsentWhatsAppLink(id)
      const link = res.data?.whatsapp_link || res.whatsapp_link
      if (link) {
        window.open(link, '_blank')
        setActionState({ id: null, type: null, message: '', isError: false })
      } else {
        setActionState({ id: null, type: null, message: res.data?.message || 'No phone number on file.', isError: true })
      }
    } catch (err) {
      setActionState({ id: null, type: null, message: err.response?.data?.message || 'Failed to build WhatsApp link.', isError: true })
    }
  }

  const [showConsentModal, setShowConsentModal] = useState(false)
  const [studentQuery, setStudentQuery] = useState('')
  const [studentResults, setStudentResults] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [consentType, setConsentType] = useState('first_aid')
  const [consentLoading, setConsentLoading] = useState(false)
  const [consentError, setConsentError] = useState('')

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authStudentQuery, setAuthStudentQuery] = useState('')
  const [authStudentResults, setAuthStudentResults] = useState([])
  const [authSelectedStudent, setAuthSelectedStudent] = useState(null)
  const [authConsentType, setAuthConsentType] = useState('first_aid')
  const [authDecision, setAuthDecision] = useState('granted')
  const [authSignedName, setAuthSignedName] = useState('')
  const [authNotes, setAuthNotes] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const resetConsentModal = () => {
    setStudentQuery(''); setStudentResults([]); setSelectedStudent(null)
    setConsentType('first_aid'); setConsentError('')
  }

  const resetAuthModal = () => {
    setAuthStudentQuery(''); setAuthStudentResults([]); setAuthSelectedStudent(null)
    setAuthConsentType('first_aid'); setAuthDecision('granted')
    setAuthSignedName(''); setAuthNotes(''); setAuthError('')
  }

  const handleStudentSearch = async (text, setQuery, setResults) => {
    setQuery(text)
    if (text.trim().length < 2) { setResults([]); return }
    try {
      const res = await getAllStudents({ search: text.trim() })
      setResults(res.data?.students || [])
    } catch {
      setResults([])
    }
  }

  const handleCreateConsentRequest = async () => {
    if (!selectedStudent) { setConsentError('Please select a student.'); return }
    setConsentLoading(true)
    setConsentError('')
    try {
      await createConsentRequest({ student: selectedStudent.id, consent_type: consentType, method: 'digital_link' })
      invalidateConsentLists()
      setShowConsentModal(false)
      resetConsentModal()
    } catch (err) {
      setConsentError(err.response?.data?.message || JSON.stringify(err.response?.data?.errors || 'Failed to create request.'))
    } finally {
      setConsentLoading(false)
    }
  }

  const handleCreateAuthorization = async () => {
    if (!authSelectedStudent) { setAuthError('Please select a student.'); return }
    setAuthLoading(true)
    setAuthError('')
    try {
      await createConsentRequest({
        student: authSelectedStudent.id,
        consent_type: authConsentType,
        method: 'manual',
        status: authDecision,
        signed_name: authSignedName,
        response_notes: authNotes,
      })
      invalidateConsentLists()
      setShowAuthModal(false)
      resetAuthModal()
    } catch (err) {
      setAuthError(err.response?.data?.message || JSON.stringify(err.response?.data?.errors || 'Failed to save record.'))
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <PortalHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <Breadcrumb items={[
          {
            label: 'Dashboard',
            href: activeMember?.role === 'registrar' ? '/registrar' : activeMember?.role === 'accountant' ? '/accountant' : '/admin',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )
          },
          {
            label: 'Communications, Legal & Consents', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            )
          },
        ]} />

        <div className="mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">Communications, Legal &amp; Consents</h1>
          <p className="text-sm text-gray-400 mt-1">Messaging, excursion consent, and manual authorization records.</p>
        </div>

        <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
                activeTab === tab.key ? 'border-gold text-navy' : 'border-transparent text-gray-400 hover:text-navy'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'communications' && <CommunicationsPlaceholder />}

        {activeTab === 'consents' && (
          <>
            <div className="flex items-center justify-end mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setShowExcursionModal(true)} className="flex items-center gap-2 bg-white text-navy border border-gray-200 text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-gray-50 transition whitespace-nowrap">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  New Excursion
                </button>
                <button onClick={() => setShowConsentModal(true)} className="flex items-center gap-2 bg-navy text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-navy-light transition whitespace-nowrap">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Request Consent
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="text-sm font-bold text-navy">Excursions</div>
                <div className="text-xs text-gray-400">{excursions.length}</div>
              </div>
              {excursionsLoading && <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-2xl">Loading...</div>}
              {!excursionsLoading && excursions.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-2xl">No excursions yet.</div>
              )}
              {!excursionsLoading && excursions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  {excursions.map((exc) => (
                    <ExcursionCard
                      key={exc.id}
                      excursion={exc}
                      onRequestConsent={handleRequestConsent}
                      requesting={requestingId === exc.id}
                      result={requestResult?.excursionId === exc.id ? requestResult : null}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm mt-8 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="text-sm font-bold text-navy">Digital Consent Requests</div>
                <select
                  value={consentsStatusFilter}
                  onChange={(e) => { setConsentsStatusFilter(e.target.value); setConsentsPage(1) }}
                  className={inputClass}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="granted">Granted</option>
                  <option value="denied">Denied</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              {actionState.message && (
                <div className={`text-xs px-5 py-2.5 ${actionState.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  {actionState.message}
                </div>
              )}
              {digitalLoading && <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>}
              {!digitalLoading && digitalRequests.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">No digital consent requests found.</div>
              )}
              {!digitalLoading && digitalRequests.length > 0 && (
                <GroupedRequestList
                  requests={digitalRequests}
                  onGeneratePdf={handleGeneratePdf}
                  onEmail={handleEmail}
                  onWhatsApp={handleWhatsApp}
                  actionState={actionState}
                />
              )}
              <Pagination
                page={consentsPage}
                totalPages={digitalTotalPages}
                hasNext={digitalHasNext}
                hasPrevious={digitalHasPrevious}
                onChange={setConsentsPage}
              />
            </div>
          </>
        )}

        {activeTab === 'authorization' && (
          <>
            <div className="flex items-center justify-end mb-4">
              <button onClick={() => setShowAuthModal(true)} className="flex items-center gap-2 bg-navy text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-navy-light transition whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Record Authorization
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="text-sm font-bold text-navy">Manual Authorization Records</div>
                <select
                  value={authStatusFilter}
                  onChange={(e) => { setAuthStatusFilter(e.target.value); setAuthPage(1) }}
                  className={inputClass}
                >
                  <option value="">All Statuses</option>
                  <option value="granted">Granted</option>
                  <option value="denied">Denied</option>
                </select>
              </div>
              {actionState.message && (
                <div className={`text-xs px-5 py-2.5 ${actionState.isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  {actionState.message}
                </div>
              )}
              {manualLoading && <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>}
              {!manualLoading && manualRequests.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">No manual authorization records found.</div>
              )}
              {!manualLoading && manualRequests.length > 0 && (
                <GroupedRequestList
                  requests={manualRequests}
                  onGeneratePdf={handleGeneratePdf}
                  onEmail={handleEmail}
                  onWhatsApp={handleWhatsApp}
                  actionState={actionState}
                />
              )}
              <Pagination
                page={authPage}
                totalPages={manualTotalPages}
                hasNext={manualHasNext}
                hasPrevious={manualHasPrevious}
                onChange={setAuthPage}
              />
            </div>
          </>
        )}
      </div>

      {showExcursionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !excLoading && setShowExcursionModal(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg font-bold text-navy mb-1">New Excursion</div>
            <div className="text-xs text-gray-400 mb-4">Create the trip, then request consent from linked classes.</div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Name</label>
                <input className={inputClass + ' w-full'} value={excName} onChange={(e) => setExcName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Description</label>
                <textarea rows={2} className={inputClass + ' w-full'} value={excDescription} onChange={(e) => setExcDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Date</label>
                  <input type="date" className={inputClass + ' w-full'} value={excDate} onChange={(e) => setExcDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Location</label>
                  <input className={inputClass + ' w-full'} value={excLocation} onChange={(e) => setExcLocation(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Classes</label>
                <div className="flex flex-wrap gap-2 border border-gray-200 rounded-lg p-3">
                  {classrooms.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleExcClassroom(c.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                        excClassrooms.includes(c.id) ? 'bg-navy text-white border-navy' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {c.full_name}
                    </button>
                  ))}
                </div>
              </div>
              {excError && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{excError}</div>}
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => { setShowExcursionModal(false); resetExcursionForm() }} disabled={excLoading} className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2.5 rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleCreateExcursion} disabled={excLoading} className="flex-1 bg-navy text-white text-sm font-bold py-2.5 rounded-lg hover:bg-navy-light transition disabled:opacity-50">
                  {excLoading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConsentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !consentLoading && setShowConsentModal(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg font-bold text-navy mb-1">Request Consent</div>
            <div className="text-xs text-gray-400 mb-4">Sends a secure link to the guardian's phone to grant or deny.</div>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Student</label>
                {selectedStudent ? (
                  <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5">
                    <span className="text-sm text-navy font-semibold">{selectedStudent.full_name}</span>
                    <button onClick={() => setSelectedStudent(null)} className="text-xs text-red-500 hover:underline">Change</button>
                  </div>
                ) : (
                  <>
                    <input className={inputClass + ' w-full'} placeholder="Search by name..." value={studentQuery} onChange={(e) => handleStudentSearch(e.target.value, setStudentQuery, setStudentResults)} />
                    {studentResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                        {studentResults.map((s) => (
                          <button key={s.id} type="button" onClick={() => { setSelectedStudent(s); setStudentResults([]) }} className="w-full text-left px-3 py-2 text-sm text-navy hover:bg-gray-50 transition">
                            {s.full_name} <span className="text-gray-400 text-xs">({s.student_id})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Consent Type</label>
                <select className={inputClass + ' w-full'} value={consentType} onChange={(e) => setConsentType(e.target.value)}>
                  <option value="first_aid">First Aid Administration</option>
                  <option value="image_use">Use of Child's Image / Likeness</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {consentError && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{consentError}</div>}
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => { setShowConsentModal(false); resetConsentModal() }} disabled={consentLoading} className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2.5 rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleCreateConsentRequest} disabled={consentLoading} className="flex-1 bg-navy text-white text-sm font-bold py-2.5 rounded-lg hover:bg-navy-light transition disabled:opacity-50">
                  {consentLoading ? 'Sending...' : 'Send Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !authLoading && setShowAuthModal(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg font-bold text-navy mb-1">Record Authorization</div>
            <div className="text-xs text-gray-400 mb-4">For a physically signed form already on file.</div>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Student</label>
                {authSelectedStudent ? (
                  <div className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5">
                    <span className="text-sm text-navy font-semibold">{authSelectedStudent.full_name}</span>
                    <button onClick={() => setAuthSelectedStudent(null)} className="text-xs text-red-500 hover:underline">Change</button>
                  </div>
                ) : (
                  <>
                    <input className={inputClass + ' w-full'} placeholder="Search by name..." value={authStudentQuery} onChange={(e) => handleStudentSearch(e.target.value, setAuthStudentQuery, setAuthStudentResults)} />
                    {authStudentResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-40 overflow-y-auto">
                        {authStudentResults.map((s) => (
                          <button key={s.id} type="button" onClick={() => { setAuthSelectedStudent(s); setAuthStudentResults([]) }} className="w-full text-left px-3 py-2 text-sm text-navy hover:bg-gray-50 transition">
                            {s.full_name} <span className="text-gray-400 text-xs">({s.student_id})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Consent Type</label>
                <select className={inputClass + ' w-full'} value={authConsentType} onChange={(e) => setAuthConsentType(e.target.value)}>
                  <option value="first_aid">First Aid Administration</option>
                  <option value="image_use">Use of Child's Image / Likeness</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Decision</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setAuthDecision('granted')} className={`flex-1 text-sm font-semibold py-2 rounded-lg border transition ${authDecision === 'granted' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200'}`}>
                    Granted
                  </button>
                  <button type="button" onClick={() => setAuthDecision('denied')} className={`flex-1 text-sm font-semibold py-2 rounded-lg border transition ${authDecision === 'denied' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-500 border-gray-200'}`}>
                    Denied
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Signed Name</label>
                <input className={inputClass + ' w-full'} value={authSignedName} onChange={(e) => setAuthSignedName(e.target.value)} placeholder="e.g. Efua Ansah (Mother)" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Notes</label>
                <textarea rows={2} className={inputClass + ' w-full'} value={authNotes} onChange={(e) => setAuthNotes(e.target.value)} placeholder="e.g. Signed physical form on file, kept in student folder." />
              </div>
              {authError && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{authError}</div>}
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => { setShowAuthModal(false); resetAuthModal() }} disabled={authLoading} className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2.5 rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleCreateAuthorization} disabled={authLoading} className="flex-1 bg-navy text-white text-sm font-bold py-2.5 rounded-lg hover:bg-navy-light transition disabled:opacity-50">
                  {authLoading ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}