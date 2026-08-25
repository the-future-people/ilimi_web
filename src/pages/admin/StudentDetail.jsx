import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { getStudentDetail, changeStudentClass, updateStudent, uploadStudentFile } from '../../api/students'
import { getSchoolClassrooms } from '../../api/academics'
import DocumentsTab from './DocumentsTab'
import { API_BASE_URL } from '../../config'
import { STUDENTS_TAB } from '../../constants/nav'
import PhotoCapture from '../../components/PhotoCapture'

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'guardians', label: 'Guardians & Contacts' },
  { key: 'health', label: 'Health & Safety' },
  { key: 'documents', label: 'Documents & Letters' },
]

const statusStyles = {
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  graduated: 'bg-blue-50 text-blue-700',
  withdrawn: 'bg-red-50 text-red-700',
  suspended: 'bg-amber-50 text-amber-700',
}

// â”€â”€ Choice maps (mirror apps/students/models.py) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// The API returns these fields as raw codes, so both the read-only display
// and the edit dropdowns key off these. Keep in sync with the model.
const GENDER_CHOICES = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const RELIGION_CHOICES = [
  { value: '', label: '—' },
  { value: 'christian', label: 'Christian' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'traditionalist', label: 'Traditionalist' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'None / Prefer not to say' },
]

const BOARDING_CHOICES = [
  { value: 'day', label: 'Day Student' },
  { value: 'boarder', label: 'Full Boarder' },
  { value: 'weekly', label: 'Weekly Boarder' },
]

const REGION_CHOICES = [
  { value: '', label: '—' },
  { value: 'greater_accra', label: 'Greater Accra' },
  { value: 'ashanti', label: 'Ashanti' },
  { value: 'western', label: 'Western' },
  { value: 'western_north', label: 'Western North' },
  { value: 'central', label: 'Central' },
  { value: 'eastern', label: 'Eastern' },
  { value: 'volta', label: 'Volta' },
  { value: 'oti', label: 'Oti' },
  { value: 'northern', label: 'Northern' },
  { value: 'savannah', label: 'Savannah' },
  { value: 'north_east', label: 'North East' },
  { value: 'upper_east', label: 'Upper East' },
  { value: 'upper_west', label: 'Upper West' },
  { value: 'bono', label: 'Bono' },
  { value: 'bono_east', label: 'Bono East' },
  { value: 'ahafo', label: 'Ahafo' },
  { value: 'other', label: 'Other / Outside Ghana' },
]

const labelFor = (choices, value) => {
  const found = choices.find((c) => c.value === value)
  return found ? found.label : (value || '—')
}

// Fields the edit form owns. Class is edited separately (the pencil), and
// health fields live on the Health tab, so neither is here.
const EDITABLE_FIELDS = [
  'first_name', 'middle_name', 'last_name', 'date_of_birth', 'gender',
  'place_of_birth', 'home_town', 'nationality', 'mother_tongue', 'religion',
  'previous_school', 'boarding_status', 'house_dormitory',
  'residential_address', 'city', 'region',
]

function InfoRow({ label, value }) {
  return (
    <div className="py-2.5 border-b border-gray-50 last:border-0">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm text-navy">{value || '—'}</div>
    </div>
  )
}

function EditRow({ label, children }) {
  return (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1 block">{label}</label>
      {children}
    </div>
  )
}

const editInput = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"

const CARD_ICONS = {
  identity: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2',
  background: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  academic: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  address: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z',
}

function SectionCard({ icon, title, locked, editing, onEdit, onCancel, onSave, saving, dirty, children }) {
  return (
    <div className={`bg-white rounded-xl p-4 border ${editing ? 'border-navy border-2' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
          </svg>
          <span className="text-[13px] font-semibold text-navy">{title}</span>
        </div>
        {locked ? (
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Locked
          </span>
        ) : !editing ? (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-[11px] font-semibold text-navy hover:text-gold transition"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        ) : null}
      </div>

      {children}

      {editing && (
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3 mt-3">
          <span className="text-[11px] text-amber-700">{dirty ? 'Unsaved changes' : ''}</span>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="text-xs font-semibold text-gray-600 border border-gray-300 rounded-lg px-3.5 py-1.5 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving || !dirty}
              className="text-xs font-bold text-white bg-navy rounded-lg px-4 py-1.5 hover:bg-navy-light transition disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StudentDetail() {
  const { studentId } = useParams()
  const { activeMember } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [isScrolled, setIsScrolled] = useState(false)
  const [showClassModal, setShowClassModal] = useState(false)
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [classChangeRemarks, setClassChangeRemarks] = useState('')
  const [changingClass, setChangingClass] = useState(false)
  const [classChangeError, setClassChangeError] = useState('')
  const CARD_FIELDS = {
    background: ['place_of_birth', 'home_town', 'nationality', 'mother_tongue', 'religion'],
    academic: ['previous_school', 'boarding_status', 'house_dormitory'],
    address: ['residential_address', 'city', 'region'],
  }

  const startEditing = (card) => {
    const fields = CARD_FIELDS[card] || []
    const seed = {}
    fields.forEach((f) => { seed[f] = student[f] ?? '' })
    setEditForm(seed)
    setSaveError('')
    setSaveSuccess('')
    setEditingCard(card)
  }

  const cancelEditing = () => {
    setEditingCard(null)
    setEditForm({})
    setSaveError('')
  }

  const updateField = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const isDirty = () =>
    Object.entries(editForm).some(([k, v]) => String(v ?? '') !== String(student[k] ?? ''))

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const changed = {}
      Object.entries(editForm).forEach(([k, v]) => {
        if (String(v ?? '') !== String(student[k] ?? '')) changed[k] = v
      })
      if (Object.keys(changed).length) {
        await updateStudent(studentId, changed)
        await queryClient.invalidateQueries({ queryKey: ['student-detail', studentId] })
      }
      setSaveSuccess('Saved.')
      setEditingCard(null)
      setEditForm({})
      setTimeout(() => setSaveSuccess(''), 2500)
    } catch (err) {
      const data = err.response?.data
      const fieldError = data?.errors && Object.values(data.errors)[0]?.[0]
      setSaveError(fieldError || data?.message || 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }
    useEffect(() => {
    checkTabScroll()
    const el = tabScrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkTabScroll)
    window.addEventListener('resize', checkTabScroll)
    return () => {
      el.removeEventListener('scroll', checkTabScroll)
      window.removeEventListener('resize', checkTabScroll)
    }
  }, [student])

  const initials = (name) => name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '—'

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <PortalHeader />
        <div className="text-center py-20 text-gray-400 text-sm">Loading student profile...</div>
      </div>
    )
  }

  if (isError || !student) {
    return (
      <div className="min-h-screen">
        <PortalHeader />
        <div className="text-center py-20 text-red-500 text-sm">Failed to load student profile.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <PortalHeader />

      {/* Sticky breadcrumb + tabs */}
      <div
        className={`sticky top-16 z-40 bg-gray-100/95 backdrop-blur-sm transition-shadow pt-6 ${
          isScrolled ? 'shadow-sm border-b border-gray-200' : ''
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
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
              label: 'Students', href: STUDENTS_TAB, icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              )
            },
            {
              label: student.full_name, icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )
            },
          ]} />
          <div className="bg-white rounded-t-2xl shadow relative">
            {canScrollLeft && (
              <button
                onClick={() => scrollTabs('left')}
                className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-white via-white to-transparent rounded-tl-2xl"
              >
                <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scrollTabs('right')}
                className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-white via-white to-transparent rounded-tr-2xl"
              >
                <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <div ref={tabScrollRef} className="flex items-center gap-1 px-3 sm:px-6 overflow-x-auto no-scrollbar scroll-smooth">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  disabled={!!editingCard && tab.key !== 'overview'}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                    activeTab === tab.key
                      ? 'border-gold text-navy'
                      : 'border-transparent text-gray-400 hover:text-navy'
                } ${editingCard && tab.key !== 'overview' ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 pb-10">
        <div className="bg-white rounded-b-2xl shadow-lg -mt-px">
          {/* Profile header */}
          <div className="flex flex-wrap items-start gap-4 p-5 sm:p-6 border-b border-gray-100">
            <div className="relative w-16 h-16 flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-navy text-white text-lg font-bold flex items-center justify-center overflow-hidden">
                {stagedPhoto ? (
                  <img src={URL.createObjectURL(stagedPhoto)} alt="" className="w-full h-full object-cover" />
                ) : student.photo ? (
                  <img src={`${API_BASE_URL}${student.photo}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  initials(student.full_name)
                )}
              </div>
              {true && (
                <button
                  onClick={() => setShowPhotoPicker(true)}
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold text-navy flex items-center justify-center shadow-md hover:bg-gold-light transition"
                  title="Change photo"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy truncate">{student.full_name}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-xs text-gray-400">{student.student_id}</span>
                <span className="text-gray-200">·</span>
                <button
                  onClick={() => { setSelectedClassroom(student.current_class || ''); setShowClassModal(true); }}
                  disabled={editing}
                  className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 disabled:opacity-40 disabled:no-underline"
                >
                  {student.classroom_name || 'Unassigned'}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyles[student.status] || 'bg-gray-100 text-gray-500'}`}>
                  {student.status}
                </span>
              </div>
            </div>
            {!editing ? (
              <button
                onClick={startEditing}
                className="basis-full sm:basis-auto flex items-center gap-2 bg-navy text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-navy-light transition whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
            ) : (
              <div className="basis-full sm:basis-auto flex items-center gap-2">
                <button
                  onClick={cancelEditing}
                  disabled={saving}
                  className="text-xs font-bold text-gray-500 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-gold text-navy text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-gold-light transition whitespace-nowrap disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {saveError && (
            <div className="mx-5 sm:mx-6 mt-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {saveError}
            </div>
          )}

          {/* Overview Tab */}
                    {activeTab === 'overview' && (
            <div className="p-4 sm:p-6">
              {saveError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                  {saveError}
                </div>
              )}
              {saveSuccess && (
                <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-3">
                  {saveSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">

                <SectionCard icon={CARD_ICONS.identity} title="Identity" locked>
                  <table className="w-full text-xs">
                    <tbody>
                      <InfoRow label="Full name" value={student.full_name} />
                      <InfoRow label="Student ID" value={student.student_id} />
                      <InfoRow label="Date of birth" value={formatDate(student.date_of_birth)} />
                      <InfoRow label="Gender" value={labelFor(GENDER_CHOICES, student.gender)} />
                    </tbody>
                  </table>
                  <div className="text-[11px] text-gray-400 mt-2.5 leading-relaxed">
                    These are set at enrolment. Ask the registrar if any of them need correcting.
                  </div>
                </SectionCard>

                <SectionCard
                  icon={CARD_ICONS.background}
                  title="Background"
                  editing={editingCard === 'background'}
                  onEdit={() => startEditing('background')}
                  onCancel={cancelEditing}
                  onSave={handleSave}
                  saving={saving}
                  dirty={isDirty()}
                >
                  {editingCard === 'background' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <EditRow label="Place of birth">
                        <input className={editInput} value={editForm.place_of_birth} onChange={(e) => updateField('place_of_birth', e.target.value)} />
                      </EditRow>
                      <EditRow label="Home town">
                        <input className={editInput} value={editForm.home_town} onChange={(e) => updateField('home_town', e.target.value)} />
                      </EditRow>
                      <EditRow label="Nationality">
                        <input className={editInput} value={editForm.nationality} onChange={(e) => updateField('nationality', e.target.value)} />
                      </EditRow>
                      <EditRow label="Mother tongue">
                        <input className={editInput} value={editForm.mother_tongue} onChange={(e) => updateField('mother_tongue', e.target.value)} />
                      </EditRow>
                      <EditRow label="Religion">
                        <select className={editInput} value={editForm.religion} onChange={(e) => updateField('religion', e.target.value)}>
                          {RELIGION_CHOICES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </EditRow>
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <tbody>
                        <InfoRow label="Place of birth" value={student.place_of_birth} />
                        <InfoRow label="Home town" value={student.home_town} />
                        <InfoRow label="Nationality" value={student.nationality} />
                        <InfoRow label="Mother tongue" value={student.mother_tongue} />
                        <InfoRow label="Religion" value={labelFor(RELIGION_CHOICES, student.religion)} />
                      </tbody>
                    </table>
                  )}
                </SectionCard>

                <SectionCard
                  icon={CARD_ICONS.academic}
                  title="Academic"
                  editing={editingCard === 'academic'}
                  onEdit={() => startEditing('academic')}
                  onCancel={cancelEditing}
                  onSave={handleSave}
                  saving={saving}
                  dirty={isDirty()}
                >
                  <div className="flex items-center justify-between gap-2 pb-2 mb-1 border-b border-gray-100">
                    <div>
                      <div className="text-gray-500 text-xs">Class</div>
                      <div className="text-sm font-semibold text-navy">
                        {student.classroom_name || 'Unassigned'}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowClassModal(true)}
                      className="text-[11px] font-semibold text-navy border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition flex-shrink-0"
                    >
                      Move class
                    </button>
                  </div>

                  {editingCard === 'academic' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
                      <EditRow label="Previous school">
                        <input className={editInput} value={editForm.previous_school} onChange={(e) => updateField('previous_school', e.target.value)} />
                      </EditRow>
                      <EditRow label="Boarding status">
                        <select className={editInput} value={editForm.boarding_status} onChange={(e) => updateField('boarding_status', e.target.value)}>
                          {BOARDING_CHOICES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </EditRow>
                      <EditRow label="House / dormitory">
                        <input className={editInput} value={editForm.house_dormitory} onChange={(e) => updateField('house_dormitory', e.target.value)} />
                      </EditRow>
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <tbody>
                        <InfoRow label="Enrolled" value={formatDate(student.enrollment_date)} />
                        <InfoRow label="Previous school" value={student.previous_school} />
                        <InfoRow label="Boarding status" value={labelFor(BOARDING_CHOICES, student.boarding_status)} />
                        <InfoRow label="House / dormitory" value={student.house_dormitory} />
                      </tbody>
                    </table>
                  )}
                </SectionCard>

                <SectionCard
                  icon={CARD_ICONS.address}
                  title="Address"
                  editing={editingCard === 'address'}
                  onEdit={() => startEditing('address')}
                  onCancel={cancelEditing}
                  onSave={handleSave}
                  saving={saving}
                  dirty={isDirty()}
                >
                  {editingCard === 'address' ? (
                    <div className="flex flex-col gap-2.5">
                      <EditRow label="Residential address">
                        <textarea rows={2} className={editInput} value={editForm.residential_address} onChange={(e) => updateField('residential_address', e.target.value)} />
                      </EditRow>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <EditRow label="City">
                          <input className={editInput} value={editForm.city} onChange={(e) => updateField('city', e.target.value)} />
                        </EditRow>
                        <EditRow label="Region">
                          <select className={editInput} value={editForm.region} onChange={(e) => updateField('region', e.target.value)}>
                            {REGION_CHOICES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                          </select>
                        </EditRow>
                      </div>
                    </div>
                  ) : (
                    <table className="w-full text-xs">
                      <tbody>
                        <InfoRow label="Residential address" value={student.residential_address} />
                        <InfoRow label="City" value={student.city} />
                        <InfoRow label="Region" value={labelFor(REGION_CHOICES, student.region)} />
                      </tbody>
                    </table>
                  )}
                </SectionCard>

              </div>
            </div>
          )}
          {activeTab === 'guardians' && (
            <div className="p-5 sm:p-6">
              <div className="text-xs font-bold text-navy uppercase tracking-wide mb-3">Guardians</div>
              {(!student.guardians || student.guardians.length === 0) && (
                <div className="text-center py-10 text-gray-400 text-sm">No guardians on record.</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {student.guardians?.map((g) => (
                  <div key={g.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-bold text-navy">
                        {g.guardian.first_name} {g.guardian.last_name}
                      </div>
                      {g.is_primary && (
                        <span className="text-[10px] font-bold bg-gold/10 text-amber-700 px-2 py-0.5 rounded-full">Primary</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mb-2 capitalize">{g.guardian.relationship}</div>
                    <div className="text-sm text-gray-600">{g.guardian.phone}</div>
                    {g.guardian.email && <div className="text-sm text-gray-500">{g.guardian.email}</div>}
                    {g.guardian.occupation && (
                      <div className="text-xs text-gray-400 mt-2">{g.guardian.occupation}{g.guardian.employer ? ` Â· ${g.guardian.employer}` : ''}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-xs font-bold text-navy uppercase tracking-wide mb-3">Emergency Contacts</div>
              {(!student.emergency_contacts || student.emergency_contacts.length === 0) && (
                <div className="text-center py-10 text-gray-400 text-sm">No emergency contacts on record.</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {student.emergency_contacts?.map((ec) => (
                  <div key={ec.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="text-sm font-bold text-navy mb-1">{ec.full_name}</div>
                    <div className="text-xs text-gray-400 mb-2 capitalize">{ec.relationship}</div>
                    <div className="text-sm text-gray-600">{ec.phone}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Health & Safety Tab */}
          {activeTab === 'health' && (
            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <div className="text-xs font-bold text-navy uppercase tracking-wide mb-2">Medical Information</div>
                <InfoRow label="Blood Group" value={student.blood_group} />
                <InfoRow label="Known Allergies" value={student.known_allergies} />
                <InfoRow label="Medical Notes" value={student.medical_notes} />
                <InfoRow label="Disability" value={student.disability_status ? 'Yes' : 'No'} />
                {student.disability_status && (
                  <InfoRow label="Disability Details" value={student.disability_description} />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-navy uppercase tracking-wide mb-2 mt-6 md:mt-0">Additional Notes</div>
                <InfoRow label="Talents & Skills" value={student.talents_skills} />
                <InfoRow label="Additional Notes" value={student.additional_notes} />
                <InfoRow label="Birth Certificate No." value={student.birth_certificate_number} />
                <InfoRow label="NHIS Number" value={student.nhis_number} />
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <DocumentsTab studentId={studentId} />
          )}
        </div>
      </div>

      {/* Change Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !changingClass && setShowClassModal(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg font-bold text-navy mb-1">Change Class</div>
            <div className="text-xs text-gray-400 mb-4">
              Currently: <span className="font-semibold text-navy">{student.classroom_name || 'Unassigned'}</span>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">New Class</label>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
                >
                  <option value="">Select a class...</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Remarks (optional)</label>
                <textarea
                  rows={2}
                  value={classChangeRemarks}
                  onChange={(e) => setClassChangeRemarks(e.target.value)}
                  placeholder="e.g. Promoted, transferred, corrected placement..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
                />
              </div>

              {classChangeError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {classChangeError}
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setShowClassModal(false)}
                  disabled={changingClass}
                  className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2.5 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangeClass}
                  disabled={changingClass}
                  className="flex-1 bg-navy text-white text-sm font-bold py-2.5 rounded-lg hover:bg-navy-light transition disabled:opacity-50"
                >
                  {changingClass ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo picker (edit mode) */}
      {showPhotoPicker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowPhotoPicker(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg font-bold text-navy mb-1">Change Photo</div>
            <div className="text-xs text-gray-400 mb-4">The new photo saves when you save the profile.</div>
            <PhotoCapture value={stagedPhoto} onChange={setStagedPhoto} allowCamera />
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => { setStagedPhoto(null); }}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2.5 rounded-lg hover:bg-gray-200 transition"
              >
                Clear
              </button>
              <button
                onClick={() => setShowPhotoPicker(false)}
                className="flex-1 bg-navy text-white text-sm font-bold py-2.5 rounded-lg hover:bg-navy-light transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      
      {/* Success toast */}
      {saveSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg z-50">
          {saveSuccess}
        </div>
      )}
    </div>
  )
}

export default StudentDetail