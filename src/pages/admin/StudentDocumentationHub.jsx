import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { useAuth } from '../../context/AuthContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAllStudents } from '../../api/students'
import { getDocumentTemplates, getGeneratedDocuments, previewDocument, generateDocument } from '../../api/documents'
import PortalHeader from '../../components/layout/PortalHeader'
import { API_BASE_URL } from '../../config'
import { ADMISSIONS_TAB } from '../../constants/nav'

const DOCUMENT_TYPE_LABELS = {
  recommendation_letter: 'Recommendation Letters',
  introduction_letter: 'Introduction Letters',
  transcript: 'Transcripts',
  transfer_letter: 'Transfer Letters',
  financial_clearance: 'Financial Clearance',
  custom: 'Other Documents',
}

const DOCUMENT_TYPE_ORDER = [
  'recommendation_letter',
  'introduction_letter',
  'transcript',
  'transfer_letter',
  'financial_clearance',
  'custom',
]

const DOCUMENT_TYPE_ICONS = {
  recommendation_letter: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  introduction_letter: 'M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z',
  transcript: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  transfer_letter: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h18M16.5 3L21 7.5m0 0L16.5 12M21 7.5H3',
  financial_clearance: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  custom: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z',
}

const DOCUMENT_TYPE_GRADIENTS = {
  recommendation_letter: 'from-blue-500 to-blue-600',
  introduction_letter: 'from-amber-500 to-amber-600',
  transcript: 'from-emerald-500 to-emerald-600',
  transfer_letter: 'from-purple-500 to-purple-600',
  financial_clearance: 'from-teal-500 to-teal-600',
  custom: 'from-gray-500 to-gray-600',
}

const DOCUMENT_TYPE_TAB_COLORS = {
  recommendation_letter: 'bg-blue-400',
  introduction_letter: 'bg-amber-400',
  transcript: 'bg-emerald-400',
  transfer_letter: 'bg-purple-400',
  financial_clearance: 'bg-teal-400',
  custom: 'bg-gray-400',
}

const DOCUMENT_TYPE_SHORT_LABELS = {
  recommendation_letter: 'Recomends',
  introduction_letter: 'Intro Letters',
  transcript: 'Transcripts',
  transfer_letter: 'Transfer',
  financial_clearance: 'Financial',
  custom: 'Other',
}

const DOCUMENT_TYPE_DESCRIPTIONS = {
  recommendation_letter: "Formal letters recommending a student for opportunities, transfers, or admissions.",
  introduction_letter: "Letters introducing a student for embassy visits or visa applications.",
  transcript: "Official academic records showing a student's performance across terms.",
  transfer_letter: "Letters confirming a student's transfer to another school.",
  financial_clearance: "Confirmation that a student's fees are fully settled.",
  custom: "Other one-off documents not covered by the standard types.",
}

const FILE_ICON_PATH = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
const FOLDER_ICON_PATH = 'M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0v6a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25v-6m-19.5 0h19.5M6 9.75V6.375c0-.621.504-1.125 1.125-1.125h2.25c.31 0 .606.126.822.348l1.223 1.222c.216.221.512.348.822.348h4.383c.621 0 1.125.504 1.125 1.125v2.25'

const STEPS = { STUDENT: 'student', TEMPLATE: 'template', FORM: 'form', PREVIEW: 'preview' }

function TypeCard({ type, label, count, active, onClick }) {
  const gradient = DOCUMENT_TYPE_GRADIENTS[type] || DOCUMENT_TYPE_GRADIENTS.custom
  const tabColor = DOCUMENT_TYPE_TAB_COLORS[type] || DOCUMENT_TYPE_TAB_COLORS.custom
  const shortLabel = DOCUMENT_TYPE_SHORT_LABELS[type] || label

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border text-center transition aspect-square ${
        active ? 'bg-navy border-navy' : 'bg-white border-gray-100 hover:border-gray-200'
      }`}
    >
      <div className="relative w-7 h-6 flex-shrink-0">
        <div className="absolute inset-x-0.5 -top-0.5 h-4 bg-white border border-gray-200 rounded-sm shadow-sm -rotate-[4deg]" />
        <div className="absolute inset-x-0 top-0 h-4 bg-white border border-gray-200 rounded-sm shadow-sm rotate-[3deg]" />
        <div className={`absolute left-0 -top-0.5 w-3 h-1 rounded-t-sm ${tabColor}`} />
        <div className={`absolute inset-x-0 bottom-0 h-5 bg-gradient-to-br ${gradient} rounded-md rounded-tl-none shadow-sm`} />
      </div>
      <div className="min-w-0 w-full">
        <div className={`text-[10px] font-bold truncate w-full ${active ? 'text-white' : 'text-navy'}`}>{shortLabel}</div>
        <div className={`text-[10px] ${active ? 'text-white/50' : 'text-gray-400'}`}>
          {count} doc{count !== 1 ? 's' : ''}
        </div>
      </div>
    </button>
  )
}

function TypeGridCard({ type, label, count, templateCount, lastGeneratedDate, onClick }) {
  const gradient = DOCUMENT_TYPE_GRADIENTS[type] || DOCUMENT_TYPE_GRADIENTS.custom
  const description = DOCUMENT_TYPE_DESCRIPTIONS[type] || ''
  const hasTemplate = templateCount > 0

  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition flex flex-col"
    >
      <div className={`h-8 bg-gradient-to-r ${gradient} flex items-center justify-center`}>
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">{label}</span>
      </div>

      <div className="p-3">
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-3.5 mb-3">
          <div className="text-sm font-bold text-navy mb-1.5">{label}</div>
          <p className="text-xs text-gray-400 line-clamp-2 mb-3">{description}</p>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
            hasTemplate ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {hasTemplate ? 'Active' : 'No Template Yet'}
          </span>
        </div>

        <div className="flex items-center justify-between text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={FILE_ICON_PATH} />
              </svg>
              {count}
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={FOLDER_ICON_PATH} />
              </svg>
              {templateCount}
            </span>
          </div>
          <span className="text-[11px]">{lastGeneratedDate || '—'}</span>
        </div>
      </div>
    </button>
  )
}

export default function StudentDocumentationHub() {
  const { activeMember } = useAuth()
  const queryClient = useQueryClient()
  const [selectedType, setSelectedType] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [modalStep, setModalStep] = useState(STEPS.STUDENT)
  const [studentQuery, setStudentQuery] = useState('')
  const [studentResults, setStudentResults] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [typeTemplates, setTypeTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [extraValues, setExtraValues] = useState({})
  const [previewHtml, setPreviewHtml] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const studentDebounceRef = useRef(null)

  const [enter, setEnter] = useState(false)
  useEffect(() => {
    if (selectedType) {
      setEnter(false)
      const id = requestAnimationFrame(() => setEnter(true))
      return () => cancelAnimationFrame(id)
    }
  }, [selectedType])

  const typeListRef = useRef(null)
  const [canScrollStart, setCanScrollStart] = useState(false)
  const [canScrollEnd, setCanScrollEnd] = useState(false)

  const checkTypeListScroll = () => {
    const el = typeListRef.current
    if (!el) return
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    if (isDesktop) {
      setCanScrollStart(el.scrollTop > 4)
      setCanScrollEnd(el.scrollTop + el.clientHeight < el.scrollHeight - 4)
    } else {
      setCanScrollStart(el.scrollLeft > 4)
      setCanScrollEnd(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }
  }

  const scrollTypeList = (direction) => {
    const el = typeListRef.current
    if (!el) return
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    const delta = direction === 'start' ? -140 : 140
    if (isDesktop) {
      el.scrollBy({ top: delta, behavior: 'smooth' })
    } else {
      el.scrollBy({ left: delta, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    checkTypeListScroll()
    const el = typeListRef.current
    if (!el) return
    el.addEventListener('scroll', checkTypeListScroll)
    window.addEventListener('resize', checkTypeListScroll)
    return () => {
      el.removeEventListener('scroll', checkTypeListScroll)
      window.removeEventListener('resize', checkTypeListScroll)
    }
  }, [selectedType])

  const { data: allDocsData } = useQuery({
    queryKey: ['generated-documents-all-for-counts'],
    queryFn: () => getGeneratedDocuments({ page_size: 1000 }),
  })
  const allDocs = allDocsData?.data?.documents || []
  const countsByType = DOCUMENT_TYPE_ORDER.reduce((acc, type) => {
    acc[type] = allDocs.filter((d) => d.document_type === type).length
    return acc
  }, {})
  const lastGeneratedByType = DOCUMENT_TYPE_ORDER.reduce((acc, type) => {
    const docsOfType = allDocs.filter((d) => d.document_type === type)
    if (docsOfType.length === 0) {
      acc[type] = null
      return acc
    }
    const mostRecent = docsOfType.reduce((latest, d) =>
      new Date(d.generated_at) > new Date(latest.generated_at) ? d : latest
    )
    acc[type] = new Date(mostRecent.generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    return acc
  }, {})

  const { data: allTemplatesData } = useQuery({
    queryKey: ['document-templates-all-active'],
    queryFn: () => getDocumentTemplates({ is_active: true }),
  })
  const allTemplates = allTemplatesData?.data?.results || allTemplatesData?.data || []
  const templateCountsByType = DOCUMENT_TYPE_ORDER.reduce((acc, type) => {
    acc[type] = allTemplates.filter((t) => t.document_type === type).length
    return acc
  }, {})

  const { data: typeDocsData, isLoading: typeDocsLoading } = useQuery({
    queryKey: ['generated-documents-by-type', selectedType],
    queryFn: () => getGeneratedDocuments({ document_type: selectedType, page_size: 50 }),
    enabled: !!selectedType,
  })
  const typeDocs = typeDocsData?.data?.documents || []

  const selectedTemplate = typeTemplates.find((t) => String(t.id) === String(selectedTemplateId))

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const initials = (name) => name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '—'

  const resetModal = () => {
    setModalStep(STEPS.STUDENT)
    setStudentQuery('')
    setStudentResults([])
    setSelectedStudent(null)
    setTypeTemplates([])
    setSelectedTemplateId('')
    setExtraValues({})
    setPreviewHtml('')
    setModalError('')
    setFieldErrors({})
  }

  const openModal = () => {
    resetModal()
    setShowModal(true)
  }

  const closeModal = () => {
    if (modalLoading) return
    setShowModal(false)
    resetModal()
  }

  const handleStudentSearch = (text) => {
    setStudentQuery(text)
    if (studentDebounceRef.current) clearTimeout(studentDebounceRef.current)
    if (text.trim().length < 2) {
      setStudentResults([])
      return
    }
    studentDebounceRef.current = setTimeout(async () => {
      try {
        const res = await getAllStudents({ search: text.trim() })
        setStudentResults(res.data?.students || [])
      } catch {
        setStudentResults([])
      }
    }, 300)
  }

  const selectStudentForGeneration = async (student) => {
    setSelectedStudent(student)
    setStudentQuery('')
    setStudentResults([])
    setModalLoading(true)
    setModalError('')
    try {
      const res = await getDocumentTemplates({ document_type: selectedType, is_active: true })
      const templates = res.data?.results || res.data || []
      setTypeTemplates(templates)
      if (templates.length === 1) {
        setSelectedTemplateId(templates[0].id)
        setModalStep(STEPS.FORM)
      } else if (templates.length > 1) {
        setModalStep(STEPS.TEMPLATE)
      } else {
        setModalError('No active template exists for this document type yet.')
      }
    } catch {
      setModalError('Failed to load templates for this document type.')
    } finally {
      setModalLoading(false)
    }
  }

  const handlePreview = async () => {
    setModalLoading(true)
    setModalError('')
    setFieldErrors({})
    try {
      const res = await previewDocument(selectedStudent.id, {
        template_id: selectedTemplate.id,
        extra_values: extraValues,
      })
      setPreviewHtml(res.data.html)
      setModalStep(STEPS.PREVIEW)
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors && typeof errors === 'object') {
        setFieldErrors(errors)
        setModalError('Please fix the highlighted fields.')
      } else {
        setModalError(err.response?.data?.message || 'Failed to generate preview.')
      }
    } finally {
      setModalLoading(false)
    }
  }

  const handleConfirmGenerate = async () => {
    setModalLoading(true)
    setModalError('')
    try {
      await generateDocument(selectedStudent.id, {
        template_id: selectedTemplate.id,
        extra_values: extraValues,
      })
      await queryClient.invalidateQueries({ queryKey: ['generated-documents-by-type', selectedType] })
      await queryClient.invalidateQueries({ queryKey: ['generated-documents-all-for-counts'] })
      closeModal()
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to generate document.')
    } finally {
      setModalLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <PortalHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <Breadcrumb items={[
          {
            label: 'Dashboard',
            href: dashboardPath(activeMember),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )
          },
          {
            label: 'Admissions', href: ADMISSIONS_TAB, icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4v16m8-8H4" />
              </svg>
            )
          },
          {
            label: 'Student Documentation', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )
          },
        ]} />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mb-1">Student Documentation</h1>
            <p className="text-sm text-gray-400">Browse and generate documents by type.</p>
          </div>
          <Link
            to="/admin/students/documents/templates"
            className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-navy transition whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Manage Templates
          </Link>
        </div>

        {!selectedType && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {DOCUMENT_TYPE_ORDER.map((type) => (
              <TypeGridCard
                key={type}
                type={type}
                label={DOCUMENT_TYPE_LABELS[type]}
                count={countsByType[type] || 0}
                templateCount={templateCountsByType[type] || 0}
                lastGeneratedDate={lastGeneratedByType[type]}
                onClick={() => setSelectedType(type)}
              />
            ))}
          </div>
        )}

        {selectedType && (
          <div
            className="transition-all duration-300 ease-out"
            style={{
              opacity: enter ? 1 : 0,
              transform: enter ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            <div className="flex flex-col md:flex-row gap-5">
              <div className="w-full md:w-24 flex-shrink-0">
                <button
                  onClick={() => setSelectedType(null)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-navy transition mb-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  All Document Types
                </button>

                <div className="relative">
                  {canScrollStart && (
                    <>
                      <button
                        onClick={() => scrollTypeList('start')}
                        className="hidden md:flex absolute top-0 left-0 right-0 z-10 h-8 items-center justify-center bg-gradient-to-b from-gray-100 via-gray-100 to-transparent"
                      >
                        <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => scrollTypeList('start')}
                        className="md:hidden absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-gray-100 via-gray-100 to-transparent"
                      >
                        <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    </>
                  )}
                  {canScrollEnd && (
                    <>
                      <button
                        onClick={() => scrollTypeList('end')}
                        className="hidden md:flex absolute bottom-0 left-0 right-0 z-10 h-8 items-center justify-center bg-gradient-to-t from-gray-100 via-gray-100 to-transparent"
                      >
                        <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => scrollTypeList('end')}
                        className="md:hidden absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-gray-100 via-gray-100 to-transparent"
                      >
                        <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  <div
                    ref={typeListRef}
                    className="flex flex-row md:grid md:grid-cols-1 gap-2 overflow-x-auto md:overflow-x-visible md:overflow-y-auto no-scrollbar scroll-smooth md:max-h-[420px]"
                  >
                    {DOCUMENT_TYPE_ORDER.map((type) => (
                      <div key={type} className="flex-shrink-0 w-24 md:w-24">
                        <TypeCard
                          type={type}
                          label={DOCUMENT_TYPE_LABELS[type]}
                          count={countsByType[type] || 0}
                          active={selectedType === type}
                          onClick={() => setSelectedType(type)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="text-sm font-bold text-navy">{DOCUMENT_TYPE_LABELS[selectedType]}</div>
                    <button
                      onClick={openModal}
                      className="text-xs font-semibold bg-navy text-white px-3.5 py-2 rounded-lg hover:bg-navy-light transition whitespace-nowrap"
                    >
                      + Generate New
                    </button>
                  </div>

                {typeDocsLoading && (
                  <div className="text-center py-12 text-gray-400 text-sm">Loading documents...</div>
                )}
                {!typeDocsLoading && typeDocs.length === 0 && (
                  <div className="text-center py-12 text-gray-400 text-sm">No documents of this type yet.</div>
                )}
                {!typeDocsLoading && typeDocs.length > 0 && (
                  <div className="flex flex-col divide-y divide-gray-50">
                    {typeDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-4">
                        <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/admin/students/${doc.student}`} className="text-sm font-bold text-navy hover:underline">
                            {doc.student_name}
                          </Link>
                          <div className="text-xs text-gray-400">
                            {doc.student_id_number} Â· Issued {formatDate(doc.generated_at)} by {doc.generated_by_name || 'Unknown'}
                          </div>
                        </div>
                        <a
                          href={doc.pdf_file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-gold hover:underline flex-shrink-0"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

            {modalStep === STEPS.STUDENT && (
              <>
                <div className="font-serif text-lg font-bold text-navy mb-1">
                  Generate {DOCUMENT_TYPE_LABELS[selectedType]}
                </div>
                <div className="text-xs text-gray-400 mb-4">Search for the student this document is for.</div>

                <div className="relative">
                  <input
                    type="text"
                    value={studentQuery}
                    onChange={(e) => handleStudentSearch(e.target.value)}
                    placeholder="Search by name or student ID..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
                    autoComplete="off"
                  />
                  {studentResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-56 overflow-y-auto">
                      {studentResults.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => selectStudentForGeneration(student)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-navy text-white text-[10px] font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                            {student.photo ? (
                              <img src={`${API_BASE_URL}${student.photo}`} alt="" className="w-full h-full object-cover" />
                            ) : (
                              initials(student.full_name)
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-navy">{student.full_name}</div>
                            <div className="text-xs text-gray-400">{student.student_id}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {modalError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
                    {modalError}
                  </div>
                )}

                <div className="flex items-center justify-end mt-4">
                  <button onClick={closeModal} className="text-sm font-semibold text-gray-500 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition">
                    Cancel
                  </button>
                </div>
              </>
            )}

            {modalStep === STEPS.TEMPLATE && (
              <>
                <div className="font-serif text-lg font-bold text-navy mb-1">Choose a Template</div>
                <div className="text-xs text-gray-400 mb-4">For {selectedStudent?.full_name}</div>
                <div className="flex flex-col gap-2">
                  {typeTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedTemplateId(t.id); setModalStep(STEPS.FORM) }}
                      className="text-left px-4 py-3 border border-gray-200 rounded-lg hover:border-gold transition"
                    >
                      <div className="text-sm font-semibold text-navy">{t.name}</div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <button onClick={() => setModalStep(STEPS.STUDENT)} className="text-sm font-semibold text-gray-500 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition">
                    Back
                  </button>
                </div>
              </>
            )}

            {modalStep === STEPS.FORM && (
              <>
                <div className="font-serif text-lg font-bold text-navy mb-1">{selectedTemplate?.name}</div>
                <div className="text-xs text-gray-400 mb-4">For {selectedStudent?.full_name}</div>

                <div className="flex flex-col gap-3">
                  {(selectedTemplate?.extra_fields || []).map((field) => (
                    <div key={field.token}>
                      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                        {field.label}{field.required && <span className="text-red-500"> *</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          value={extraValues[field.token] || ''}
                          onChange={(e) => setExtraValues({ ...extraValues, [field.token]: e.target.value })}
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:border-gold ${
                            fieldErrors[field.token] ? 'border-red-300' : 'border-gray-200'
                          }`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={extraValues[field.token] || ''}
                          onChange={(e) => setExtraValues({ ...extraValues, [field.token]: e.target.value })}
                          className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:border-gold ${
                            fieldErrors[field.token] ? 'border-red-300' : 'border-gray-200'
                          }`}
                        />
                      )}
                      {fieldErrors[field.token] && (
                        <div className="text-xs text-red-600 mt-1">{fieldErrors[field.token]}</div>
                      )}
                    </div>
                  ))}
                  {(!selectedTemplate?.extra_fields || selectedTemplate.extra_fields.length === 0) && (
                    <div className="text-xs text-gray-400">No additional details needed for this document.</div>
                  )}
                </div>

                {modalError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
                    {modalError}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => setModalStep(typeTemplates.length > 1 ? STEPS.TEMPLATE : STEPS.STUDENT)}
                    className="flex-1 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePreview}
                    disabled={modalLoading}
                    className="flex-1 text-sm font-semibold bg-navy text-white rounded-lg py-2.5 hover:bg-navy-light transition disabled:opacity-50"
                  >
                    {modalLoading ? 'Loading preview...' : 'Preview'}
                  </button>
                </div>
              </>
            )}

            {modalStep === STEPS.PREVIEW && (
              <>
                <div className="font-serif text-lg font-bold text-navy mb-1">Preview</div>
                <div className="text-xs text-gray-400 mb-4">Review before issuing. You can go back to make changes.</div>

                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 mb-3">
                  <iframe
                    title="document-preview"
                    srcDoc={previewHtml}
                    className="w-full bg-white rounded-lg"
                    style={{ height: '400px', border: 'none' }}
                  />
                </div>

                {modalError && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                    {modalError}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalStep(STEPS.FORM)}
                    disabled={modalLoading}
                    className="flex-1 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleConfirmGenerate}
                    disabled={modalLoading}
                    className="flex-1 text-sm font-semibold bg-gold text-navy rounded-lg py-2.5 hover:bg-gold-light transition disabled:opacity-50"
                  >
                    {modalLoading ? 'Generating...' : 'Confirm & Generate'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}