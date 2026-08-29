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
import { dashboardPath } from '../../constants/permissions'

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

// Choice maps (mirror apps/students/models.py). The API returns these fields
// as raw codes, so both the read-only display and the edit dropdowns key off
// these. Keep in sync with the model.
const GENDER_CHOICES = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const RELIGION_CHOICES = [
  { value: '', label: 'Not set' },
  { value: 'christian', label: 'Christian' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'traditionalist', label: 'Traditionalist' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'None / Prefer not to say' },
]

const BOARDING_CHOICES = [
  { value: 'day', label: 'Day student' },
  { value: 'boarder', label: 'Full boarder' },
  { value: 'weekly', label: 'Weekly boarder' },
]

const REGION_CHOICES = [
  { value: '', label: 'Not set' },
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
  return found && found.value ? found.label : ''
}

// Each card owns its own slice of the model. Saving a card PATCHes only the
// fields listed here, diffed against the loaded student. Class, enrolment date
// and status are deliberately absent: class moves through changeStudentClass,
// the other two are not user-editable.
const CARD_FIELDS = {
  identity: [
    'first_name', 'middle_name', 'last_name', 'date_of_birth', 'gender',
    'place_of_birth', 'home_town', 'nationality', 'mother_tongue', 'religion',
  ],
  academic: ['previous_school', 'boarding_status', 'house_dormitory'],
  address: ['residential_address', 'city', 'region'],
}

const editInput = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-navy outline-none focus:border-gold'

function Card({ icon, title, action, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-navy flex-shrink-0">{icon}</span>
          <h2 className="text-[15px] font-bold text-navy truncate">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-[7px]">
      <span className="text-[13px] text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-[13px] text-navy text-right min-w-0 break-words">
        {value || <span className="text-gray-300">Not set</span>}
      </span>
    </div>
  )
}

function Field({ label, children, hint }) {
  return (
    <div className="py-2">
      <label className="text-[13px] text-slate-500 mb-1.5 block">{label}</label>
      {children}
      {hint && <div className="text-[11px] text-gray-400 mt-1">{hint}</div>}
    </div>
  )
}

function EditButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-[12px] font-semibold text-navy border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition disabled:opacity-30 disabled:hover:bg-white flex-shrink-0"
    >
      Edit
    </button>
  )
}

function CardActions({ onCancel, onSave, saving }) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={onCancel}
        disabled={saving}
        className="text-[12px] font-semibold text-gray-500 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="text-[12px] font-bold text-navy bg-gold px-3.5 py-1.5 rounded-lg hover:bg-gold-light transition disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}

const icons = {
  identity: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0h4M9 14a2 2 0 100-4 2 2 0 000 4zm0 0c-1.3 0-2.4.8-2.8 2M15 12h3m-3 3h2" />
    </svg>
  ),
  academic: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  address: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  guardians: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  medical: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  records: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  emergency: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-2.99l-6.93-12a2 2 0 00-3.48 0l-6.93 12A2 2 0 005.07 19z" />
    </svg>
  ),
}

function StudentDetail() {
  const { studentId } = useParams()
  const { activeMember } = useAuth()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [showClassModal, setShowClassModal] = useState(false)
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [classChangeRemarks, setClassChangeRemarks] = useState('')
  const [changingClass, setChangingClass] = useState(false)
  const [classChangeError, setClassChangeError] = useState('')

  // Per-card editing. Only one card is editable at a time so there is never
  // any ambiguity about what Save saves.
  const [editingCard, setEditingCard] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const [stagedPhoto, setStagedPhoto] = useState(null)
  const [showPhotoPicker, setShowPhotoPicker] = useState(false)
  const [photoSaving, setPhotoSaving] = useState(false)
  const [photoError, setPhotoError] = useState('')

  const tabScrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkTabScroll = () => {
    const el = tabScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  const scrollTabs = (direction) => {
    const el = tabScrollRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' })
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-detail', studentId],
    queryFn: () => getStudentDetail(studentId),
  })
  const student = data?.data || data

  const { data: classroomsData } = useQuery({
    queryKey: ['school-classrooms'],
    queryFn: getSchoolClassrooms,
  })
  const classrooms = classroomsData?.data?.classrooms || []

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

  const handleChangeClass = async () => {
    if (!selectedClassroom) {
      setClassChangeError('Select a class first.')
      return
    }
    setChangingClass(true)
    setClassChangeError('')
    try {
      await changeStudentClass(studentId, {
        classroom_id: selectedClassroom,
        remarks: classChangeRemarks,
      })
      await queryClient.invalidateQueries({ queryKey: ['student-detail', studentId] })
      setShowClassModal(false)
      setSelectedClassroom('')
      setClassChangeRemarks('')
      flashSuccess('Class updated.')
    } catch (err) {
      setClassChangeError(err.response?.data?.message || 'Could not change the class. Try again.')
    } finally {
      setChangingClass(false)
    }
  }

  const flashSuccess = (message) => {
    setSaveSuccess(message)
    setTimeout(() => setSaveSuccess(''), 3500)
  }

  const startEditing = (cardKey) => {
    const seed = {}
    for (const field of CARD_FIELDS[cardKey]) {
      seed[field] = student[field] ?? ''
    }
    setEditForm(seed)
    setSaveError('')
    setEditingCard(cardKey)
  }

  const cancelEditing = () => {
    setEditingCard(null)
    setEditForm({})
    setSaveError('')
  }

  const updateField = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  const saveCard = async (cardKey) => {
    const payload = {}
    for (const field of CARD_FIELDS[cardKey]) {
      const current = student[field] ?? ''
      if (editForm[field] !== current) {
        payload[field] = editForm[field]
      }
    }

    if (Object.keys(payload).length === 0) {
      cancelEditing()
      return
    }

    setSaving(true)
    setSaveError('')
    try {
      await updateStudent(studentId, payload)
      await queryClient.invalidateQueries({ queryKey: ['student-detail', studentId] })
      await queryClient.invalidateQueries({ queryKey: ['all-students-unfiltered'] })
      await queryClient.invalidateQueries({ queryKey: ['students'] })
      setEditingCard(null)
      setEditForm({})
      flashSuccess('Changes saved.')
    } catch (err) {
      const dataErr = err.response?.data
      const fieldError = dataErr?.errors && Object.values(dataErr.errors)[0]?.[0]
      setSaveError(fieldError || dataErr?.message || 'Could not save the changes. Try again.')
    } finally {
      setSaving(false)
    }
  }

  // The photo has its own endpoint and now its own save, so it no longer waits
  // on a profile-wide save button that does not exist any more.
  const savePhoto = async () => {
    if (!stagedPhoto) {
      setShowPhotoPicker(false)
      return
    }
    setPhotoSaving(true)
    setPhotoError('')
    try {
      await uploadStudentFile(studentId, 'photo', stagedPhoto)
      await queryClient.invalidateQueries({ queryKey: ['student-detail', studentId] })
      await queryClient.invalidateQueries({ queryKey: ['all-students-unfiltered'] })
      await queryClient.invalidateQueries({ queryKey: ['students'] })
      setStagedPhoto(null)
      setShowPhotoPicker(false)
      flashSuccess('Photo updated.')
    } catch (err) {
      setPhotoError(err.response?.data?.message || 'Could not upload the photo. Try again.')
    } finally {
      setPhotoSaving(false)
    }
  }

  const closePhotoPicker = () => {
    if (photoSaving) return
    setStagedPhoto(null)
    setPhotoError('')
    setShowPhotoPicker(false)
  }

  const initials = (name) => name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '?'

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
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
        <div className="text-center py-20 text-red-500 text-sm">Could not load this student profile.</div>
      </div>
    )
  }

  const primaryGuardian = student.guardians?.find((g) => g.is_primary) || student.guardians?.[0]
  const otherGuardianCount = Math.max((student.guardians?.length || 0) - 1, 0)

  return (
    <div className="min-h-screen pb-12">
      <PortalHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 pt-6">
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
          <div className="bg-white rounded-2xl border border-gray-200 mb-5">
            <div className="p-5 pb-4">
              <div className="flex items-start gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <div className="w-16 h-16 rounded-xl bg-navy text-white text-lg font-bold flex items-center justify-center overflow-hidden">
                    {student.photo ? (
                      <img src={`${API_BASE_URL}${student.photo}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials(student.full_name)
                    )}
                  </div>
                  <button
                    onClick={() => setShowPhotoPicker(true)}
                    title="Change photo"
                    aria-label="Change photo"
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold text-navy flex items-center justify-center hover:bg-gold-light transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy truncate">{student.full_name}</h1>
                  <div className="text-[13px] text-slate-500 mt-1">
                    {student.student_id}
                    {student.classroom_name && <span> &middot; {student.classroom_name}</span>}
                    {student.enrollment_date && <span> &middot; Enrolled {formatDate(student.enrollment_date)}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-2.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusStyles[student.status] || 'bg-gray-100 text-gray-500'}`}>
                      {student.status}
                    </span>
                    {student.boarding_status && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        {labelFor(BOARDING_CHOICES, student.boarding_status)}
                      </span>
                    )}
                    {student.house_dormitory && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                        {student.house_dormitory}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative border-t border-gray-100">
            {canScrollLeft && (
              <button
                onClick={() => scrollTabs('left')}
                aria-label="Scroll tabs left"
                className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-white via-white to-transparent rounded-bl-2xl"
              >
                <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scrollTabs('right')}
                aria-label="Scroll tabs right"
                className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-white via-white to-transparent rounded-br-2xl"
              >
                <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <div ref={tabScrollRef} className="flex items-center gap-1 px-3 sm:px-5 overflow-x-auto no-scrollbar scroll-smooth">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  disabled={!!editingCard && tab.key !== 'overview'}
                  className={`px-3 sm:px-4 py-3.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
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

        {saveError && (
          <div className="mb-5 text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {saveError}
          </div>
        )}

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

            {/* Identity */}
            <Card
              icon={icons.identity}
              title="Identity"
              action={editingCard === 'identity'
                ? <CardActions onCancel={cancelEditing} onSave={() => saveCard('identity')} saving={saving} />
                : <EditButton onClick={() => startEditing('identity')} disabled={!!editingCard} />}
            >
              {editingCard === 'identity' ? (
                <div>
                  <div className="text-[12px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                    These details were recorded at enrolment and appear on report cards and exam registrations. Change them only to correct an error.
                  </div>
                  <Field label="First name">
                    <input className={editInput} value={editForm.first_name} onChange={(e) => updateField('first_name', e.target.value)} />
                  </Field>
                  <Field label="Middle name">
                    <input className={editInput} value={editForm.middle_name} onChange={(e) => updateField('middle_name', e.target.value)} />
                  </Field>
                  <Field label="Last name">
                    <input className={editInput} value={editForm.last_name} onChange={(e) => updateField('last_name', e.target.value)} />
                  </Field>
                  <Field label="Date of birth">
                    <input type="date" className={editInput} value={editForm.date_of_birth || ''} onChange={(e) => updateField('date_of_birth', e.target.value)} />
                  </Field>
                  <Field label="Gender">
                    <select className={editInput} value={editForm.gender} onChange={(e) => updateField('gender', e.target.value)}>
                      {GENDER_CHOICES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Place of birth">
                    <input className={editInput} value={editForm.place_of_birth} onChange={(e) => updateField('place_of_birth', e.target.value)} />
                  </Field>
                  <Field label="Home town">
                    <input className={editInput} value={editForm.home_town} onChange={(e) => updateField('home_town', e.target.value)} />
                  </Field>
                  <Field label="Nationality">
                    <input className={editInput} value={editForm.nationality} onChange={(e) => updateField('nationality', e.target.value)} />
                  </Field>
                  <Field label="Mother tongue">
                    <input className={editInput} value={editForm.mother_tongue} onChange={(e) => updateField('mother_tongue', e.target.value)} />
                  </Field>
                  <Field label="Religion">
                    <select className={editInput} value={editForm.religion} onChange={(e) => updateField('religion', e.target.value)}>
                      {RELIGION_CHOICES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                </div>
              ) : (
                <div>
                  <Row label="Date of birth" value={formatDate(student.date_of_birth)} />
                  <Row label="Gender" value={labelFor(GENDER_CHOICES, student.gender)} />
                  <Row label="Place of birth" value={student.place_of_birth} />
                  <Row label="Home town" value={student.home_town} />
                  <Row label="Nationality" value={student.nationality} />
                  <Row label="Mother tongue" value={student.mother_tongue} />
                  <Row label="Religion" value={labelFor(RELIGION_CHOICES, student.religion)} />
                </div>
              )}
            </Card>

            {/* Academic */}
            <Card
              icon={icons.academic}
              title="Academic"
              action={editingCard === 'academic'
                ? <CardActions onCancel={cancelEditing} onSave={() => saveCard('academic')} saving={saving} />
                : <EditButton onClick={() => startEditing('academic')} disabled={!!editingCard} />}
            >
              <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-3.5 py-3 mb-3">
                <div className="min-w-0">
                  <div className="text-[13px] text-slate-500">Class</div>
                  <div className="text-sm font-semibold text-navy truncate">{student.classroom_name || 'Unassigned'}</div>
                </div>
                <button
                  onClick={() => { setSelectedClassroom(student.current_class || ''); setShowClassModal(true) }}
                  disabled={!!editingCard}
                  className="text-[12px] font-semibold text-navy border border-gray-200 bg-white rounded-lg px-3 py-1.5 hover:bg-gray-50 transition disabled:opacity-30 flex-shrink-0"
                >
                  Move class
                </button>
              </div>

              {editingCard === 'academic' ? (
                <div>
                  <Field label="Previous school">
                    <input className={editInput} value={editForm.previous_school} onChange={(e) => updateField('previous_school', e.target.value)} />
                  </Field>
                  <Field label="Boarding status">
                    <select className={editInput} value={editForm.boarding_status} onChange={(e) => updateField('boarding_status', e.target.value)}>
                      {BOARDING_CHOICES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                  <Field label="House or dormitory">
                    <input className={editInput} value={editForm.house_dormitory} onChange={(e) => updateField('house_dormitory', e.target.value)} />
                  </Field>
                </div>
              ) : (
                <div>
                  <Row label="Enrolled" value={formatDate(student.enrollment_date)} />
                  <Row label="Status" value={student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : ''} />
                  <Row label="Previous school" value={student.previous_school} />
                  <Row label="Boarding" value={labelFor(BOARDING_CHOICES, student.boarding_status)} />
                  <Row label="House or dormitory" value={student.house_dormitory} />
                </div>
              )}
            </Card>

            {/* Address */}
            <Card
              icon={icons.address}
              title="Address"
              action={editingCard === 'address'
                ? <CardActions onCancel={cancelEditing} onSave={() => saveCard('address')} saving={saving} />
                : <EditButton onClick={() => startEditing('address')} disabled={!!editingCard} />}
            >
              {editingCard === 'address' ? (
                <div>
                  <Field label="Residential address">
                    <textarea rows={2} className={editInput} value={editForm.residential_address} onChange={(e) => updateField('residential_address', e.target.value)} />
                  </Field>
                  <Field label="City">
                    <input className={editInput} value={editForm.city} onChange={(e) => updateField('city', e.target.value)} />
                  </Field>
                  <Field label="Region">
                    <select className={editInput} value={editForm.region} onChange={(e) => updateField('region', e.target.value)}>
                      {REGION_CHOICES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                </div>
              ) : (
                <div>
                  <Row label="Residential address" value={student.residential_address} />
                  <Row label="City" value={student.city} />
                  <Row label="Region" value={labelFor(REGION_CHOICES, student.region)} />
                </div>
              )}
            </Card>

            {/* Guardians summary */}
            <Card
              icon={icons.guardians}
              title="Guardians"
              action={
                <button
                  onClick={() => setActiveTab('guardians')}
                  disabled={!!editingCard}
                  className="text-[12px] font-semibold text-navy border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition disabled:opacity-30 flex-shrink-0"
                >
                  View all
                </button>
              }
            >
              {primaryGuardian ? (
                <div>
                  <Row label="Primary guardian" value={`${primaryGuardian.guardian.first_name} ${primaryGuardian.guardian.last_name}`} />
                  <Row label="Relationship" value={primaryGuardian.guardian.relationship} />
                  <Row label="Phone" value={primaryGuardian.guardian.phone} />
                  <Row label="Email" value={primaryGuardian.guardian.email} />
                  <Row label="Other guardians" value={otherGuardianCount > 0 ? `${otherGuardianCount} more on record` : 'None'} />
                </div>
              ) : (
                <div className="text-[13px] text-gray-400">No guardians recorded. Add one from the Guardians tab.</div>
              )}
            </Card>
          </div>
        )}

        {/* Guardians & contacts */}
        {activeTab === 'guardians' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <Card icon={icons.guardians} title="Guardians">
              {!student.guardians || student.guardians.length === 0 ? (
                <div className="text-[13px] text-gray-400">No guardians recorded.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {student.guardians.map((g) => (
                    <div key={g.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="text-sm font-bold text-navy truncate">
                          {g.guardian.first_name} {g.guardian.last_name}
                        </div>
                        {g.is_primary && (
                          <span className="text-[11px] font-semibold bg-gold/10 text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0">Primary</span>
                        )}
                      </div>
                      <div className="text-[13px] text-slate-500 capitalize mb-2">{g.guardian.relationship}</div>
                      <Row label="Phone" value={g.guardian.phone} />
                      <Row label="Email" value={g.guardian.email} />
                      <Row
                        label="Occupation"
                        value={g.guardian.occupation
                          ? `${g.guardian.occupation}${g.guardian.employer ? ` \u00B7 ${g.guardian.employer}` : ''}`
                          : ''}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card icon={icons.emergency} title="Emergency contacts">
              {!student.emergency_contacts || student.emergency_contacts.length === 0 ? (
                <div className="text-[13px] text-gray-400">No emergency contacts recorded.</div>
              ) : (
                <div className="flex flex-col gap-4">
                  {student.emergency_contacts.map((ec) => (
                    <div key={ec.id} className="border border-gray-100 rounded-xl p-4">
                      <div className="text-sm font-bold text-navy mb-1">{ec.full_name}</div>
                      <div className="text-[13px] text-slate-500 capitalize mb-2">{ec.relationship}</div>
                      <Row label="Phone" value={ec.phone} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Health & safety */}
        {activeTab === 'health' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <Card icon={icons.medical} title="Medical">
              <Row label="Blood group" value={student.blood_group} />
              <Row label="Known allergies" value={student.known_allergies} />
              <Row label="Medical notes" value={student.medical_notes} />
              <Row label="Disability" value={student.disability_status ? 'Yes' : 'No'} />
              {student.disability_status && (
                <Row label="Disability details" value={student.disability_description} />
              )}
            </Card>

            <Card icon={icons.records} title="Records and notes">
              <Row label="Birth certificate no." value={student.birth_certificate_number} />
              <Row label="NHIS number" value={student.nhis_number} />
              <Row label="Talents and skills" value={student.talents_skills} />
              <Row label="Additional notes" value={student.additional_notes} />
            </Card>
          </div>
        )}

        {/* Documents */}
        {activeTab === 'documents' && (
          <div className="bg-white rounded-2xl border border-gray-200">
            <DocumentsTab studentId={studentId} />
          </div>
        )}
      </div>

      {/* Move class */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !changingClass && setShowClassModal(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg font-bold text-navy mb-1">Move class</div>
            <div className="text-[13px] text-slate-500 mb-4">
              Currently in <span className="font-semibold text-navy">{student.classroom_name || 'no class'}</span>.
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[13px] text-slate-500 mb-1.5 block">New class</label>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-navy outline-none focus:border-gold"
                >
                  <option value="">Select a class</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[13px] text-slate-500 mb-1.5 block">Remarks (optional)</label>
                <textarea
                  rows={2}
                  value={classChangeRemarks}
                  onChange={(e) => setClassChangeRemarks(e.target.value)}
                  placeholder="Promoted, transferred, corrected placement"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-navy outline-none focus:border-gold"
                />
              </div>

              {classChangeError && (
                <div className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
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
                  {changingClass ? 'Moving...' : 'Move class'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo */}
      {showPhotoPicker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={closePhotoPicker}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg font-bold text-navy mb-1">Change photo</div>
            <div className="text-[13px] text-slate-500 mb-4">The photo uploads as soon as you save it.</div>
            <PhotoCapture value={stagedPhoto} onChange={setStagedPhoto} allowCamera />

            {photoError && (
              <div className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">
                {photoError}
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={closePhotoPicker}
                disabled={photoSaving}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2.5 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={savePhoto}
                disabled={photoSaving || !stagedPhoto}
                className="flex-1 bg-navy text-white text-sm font-bold py-2.5 rounded-lg hover:bg-navy-light transition disabled:opacity-40"
              >
                {photoSaving ? 'Uploading...' : 'Save photo'}
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
