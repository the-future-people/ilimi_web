import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getDocumentTemplates, getStudentDocuments, previewDocument, generateDocument } from '../../api/documents'


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

function FolderCard({ label, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gold/40 hover:shadow-md transition"
    >
      <div className="relative w-16 h-14">
        <div className="absolute inset-x-1.5 -top-1.5 h-10 bg-white border border-gray-200 rounded-sm shadow-sm -rotate-[4deg] group-hover:-rotate-[8deg] transition-transform" />
        <div className="absolute inset-x-1 -top-0.5 h-10 bg-white border border-gray-200 rounded-sm shadow-sm rotate-[3deg] group-hover:rotate-[6deg] transition-transform" />
        <div className="absolute left-0 -top-1.5 w-7 h-3 bg-gold rounded-t-md" />
        <div className="absolute inset-x-0 bottom-0 h-11 bg-gradient-to-br from-gold to-gold-light rounded-md rounded-tl-none shadow-sm" />
      </div>
      <div className="text-xs font-bold text-navy text-center leading-tight">{label}</div>
      <div className="text-[10px] text-gray-400">{count} document{count !== 1 ? 's' : ''}</div>
    </button>
  )
}


const STEPS = {
  SELECT: 'select',
  FORM: 'form',
  PREVIEW: 'preview',
}

export default function DocumentsTab({ studentId }) {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [openFolder, setOpenFolder] = useState(null)
  const [step, setStep] = useState(STEPS.SELECT)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [extraValues, setExtraValues] = useState({})
  const [previewHtml, setPreviewHtml] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const { data: templatesData } = useQuery({
    queryKey: ['document-templates'],
    queryFn: () => getDocumentTemplates({ is_active: true }),
    enabled: showModal,
  })
  const templates = templatesData?.data || []

  const { data: documentsData, isLoading: documentsLoading } = useQuery({
    queryKey: ['student-documents', studentId],
    queryFn: () => getStudentDocuments(studentId),
  })
  const documents = documentsData?.data || []

  const folders = DOCUMENT_TYPE_ORDER
    .map((type) => {
      const docsOfType = documents.filter((d) => d.document_type === type)
      if (docsOfType.length === 0) return null
      return { type, label: DOCUMENT_TYPE_LABELS[type] || type, count: docsOfType.length }
    })
    .filter(Boolean)

  const openFolderDocs = openFolder ? documents.filter((d) => d.document_type === openFolder) : []

  const selectedTemplate = templates.find((t) => String(t.id) === String(selectedTemplateId))

  const resetModal = () => {
    setStep(STEPS.SELECT)
    setSelectedTemplateId('')
    setExtraValues({})
    setPreviewHtml('')
    setError('')
    setFieldErrors({})
  }

  const closeModal = () => {
    if (loading) return
    setShowModal(false)
    resetModal()
  }

  const handleSelectTemplate = () => {
    if (!selectedTemplateId) {
      setError('Please select a document type.')
      return
    }
    setError('')
    setExtraValues({})
    setStep(STEPS.FORM)
  }

  const handlePreview = async () => {
    setLoading(true)
    setError('')
    setFieldErrors({})
    try {
      const res = await previewDocument(studentId, {
        template_id: selectedTemplate.id,
        extra_values: extraValues,
      })
      setPreviewHtml(res.data.html)
      setStep(STEPS.PREVIEW)
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors && typeof errors === 'object') {
        setFieldErrors(errors)
        setError('Please fix the highlighted fields.')
      } else {
        setError(err.response?.data?.message || 'Failed to generate preview.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      await generateDocument(studentId, {
        template_id: selectedTemplate.id,
        extra_values: extraValues,
      })
      await queryClient.invalidateQueries({ queryKey: ['student-documents', studentId] })
      closeModal()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate document.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-bold text-navy uppercase tracking-wide">Documents & Letters</div>
        <button
          onClick={() => setShowModal(true)}
          className="text-xs font-semibold bg-navy text-white px-3.5 py-2 rounded-lg hover:bg-navy-light transition"
        >
          + Generate Document
        </button>
      </div>

      {documentsLoading && (
        <div className="text-center py-10 text-gray-400 text-sm">Loading documents...</div>
      )}

      {!documentsLoading && folders.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">No documents generated yet.</div>
      )}

      {!documentsLoading && folders.length > 0 && !openFolder && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {folders.map((folder) => (
            <FolderCard
              key={folder.type}
              label={folder.label}
              count={folder.count}
              onClick={() => setOpenFolder(folder.type)}
            />
          ))}
        </div>
      )}

      {!documentsLoading && openFolder && (
        <div>
          <button
            onClick={() => setOpenFolder(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-navy transition mb-3"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            {DOCUMENT_TYPE_LABELS[openFolder] || openFolder}
          </button>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {openFolderDocs.map((doc) => (
              <div
                key={doc.id}
                className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition"
              >
                
                <a
                  href={doc.pdf_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-navy hover:bg-gray-50 transition opacity-0 group-hover:opacity-100"
                  title="Download"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                <a href={doc.pdf_file} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </a>
                <div className="text-xs font-bold text-navy text-center leading-tight line-clamp-2">{doc.template_name}</div>
                <div className="text-[10px] text-gray-400 text-center">{formatDate(doc.generated_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {step === STEPS.SELECT && (
              <>
                <div className="font-serif text-lg font-bold text-navy mb-1">Generate Document</div>
                <div className="text-xs text-gray-400 mb-4">Choose the type of document to issue.</div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Document Type</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
                  >
                    <option value="">Select a document type...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={closeModal}
                    className="flex-1 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSelectTemplate}
                    className="flex-1 text-sm font-semibold bg-navy text-white rounded-lg py-2.5 hover:bg-navy-light transition"
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {step === STEPS.FORM && (
              <>
                <div className="font-serif text-lg font-bold text-navy mb-1">{selectedTemplate?.name}</div>
                <div className="text-xs text-gray-400 mb-4">Fill in the details for this document.</div>

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

                {error && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => setStep(STEPS.SELECT)}
                    className="flex-1 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePreview}
                    disabled={loading}
                    className="flex-1 text-sm font-semibold bg-navy text-white rounded-lg py-2.5 hover:bg-navy-light transition disabled:opacity-50"
                  >
                    {loading ? 'Loading preview...' : 'Preview'}
                  </button>
                </div>
              </>
            )}

            {step === STEPS.PREVIEW && (
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

                {error && (
                  <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                    {error}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStep(STEPS.FORM)}
                    disabled={loading}
                    className="flex-1 text-sm font-semibold text-gray-500 border border-gray-200 rounded-lg py-2.5 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleConfirmGenerate}
                    disabled={loading}
                    className="flex-1 text-sm font-semibold bg-gold text-navy rounded-lg py-2.5 hover:bg-gold-light transition disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Confirm & Generate'}
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
