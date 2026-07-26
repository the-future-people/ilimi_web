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

  // â”€â”€ Edit mode (Overview) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [stagedPhoto, setStagedPhoto] = useState(null)
  const [showPhotoPicker, setShowPhotoPicker] = useState(false)

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

  const handleChangeClass = async () => {
    if (!selectedClassroom) {
      setClassChangeError('Please select a class.')
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
    } catch (err) {
      setClassChangeError(err.response?.data?.message || 'Failed to change class.')
    } finally {
      setChangingClass(false)
    }
  }

  // â”€â”€ Edit handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const startEditing = () => {
    // Seed the form from the current student, editable fields only.
    const seed = {}
    for (const field of EDITABLE_FIELDS) {
      seed[field] = student[field] ?? ''
    }
    setEditForm(seed)
    setSaveError('')
    setStagedPhoto(null)
    setEditing(true)
    setActiveTab('overview')
  }

  const cancelEditing = () => {
    setEditing(false)
    setEditForm({})
    setSaveError('')
    setStagedPhoto(null)
  }

  const updateField = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

 const handleSave = async () => {
    setSaving(true)
    setSaveError('')

    // Fields and photo go to different endpoints (JSON PATCH vs multipart
    // upload), so this is two calls behind one button. PATCH first, then
    // photo, each reported independently so a failure in one doesn't hide
    // success in the other.
    const payload = {}
    for (const field of EDITABLE_FIELDS) {
      const current = student[field] ?? ''
      if (editForm[field] !== current) {
        payload[field] = editForm[field]
      }
    }

    const hasFieldChanges = Object.keys(payload).length > 0
    const hasPhoto = !!stagedPhoto

    if (!hasFieldChanges && !hasPhoto) {
      setEditing(false)
      setSaving(false)
      return
    }

    try {
      if (hasFieldChanges) {
        await updateStudent(studentId, payload)
      }
      if (hasPhoto) {
        await uploadStudentFile(studentId, 'photo', stagedPhoto)
      }
      await queryClient.invalidateQueries({ queryKey: ['student-detail', studentId] })
      await queryClient.invalidateQueries({ queryKey: ['all-students-unfiltered'] })
      await queryClient.invalidateQueries({ queryKey: ['students'] })
      setEditing(false)
      setStagedPhoto(null)
      setSaveSuccess('Profile updated.')
      setTimeout(() => setSaveSuccess(''), 3500)
    } catch (err) {
      const dataErr = err.response?.data
      const fieldError = dataErr?.errors && Object.values(dataErr.errors)[0]?.[0]
      setSaveError(fieldError || dataErr?.message || 'Failed to save changes.')
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
                  disabled={editing && tab.key !== 'overview'}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                    activeTab === tab.key
                      ? 'border-gold text-navy'
                      : 'border-transparent text-gray-400 hover:text-navy'
                  } ${editing && tab.key !== 'overview' ? 'opacity-40 cursor-not-allowed' : ''}`}
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
              {editing && (
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
              <div className="flex items-center gap-2">
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
          {activeTab === 'overview' && !editing && (
            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <div className="text-xs font-bold text-navy uppercase tracking-wide mb-2">Personal Information</div>
                <InfoRow label="Full Name" value={student.full_name} />
                <InfoRow label="Date of Birth" value={formatDate(student.date_of_birth)} />
                <InfoRow label="Gender" value={labelFor(GENDER_CHOICES, student.gender)} />
                <InfoRow label="Place of Birth" value={student.place_of_birth} />
                <InfoRow label="Home Town" value={student.home_town} />
                <InfoRow label="Nationality" value={student.nationality} />
                <InfoRow label="Mother Tongue" value={student.mother_tongue} />
                <InfoRow label="Religion" value={labelFor(RELIGION_CHOICES, student.religion)} />
              </div>
              <div>
                <div className="text-xs font-bold text-navy uppercase tracking-wide mb-2 mt-6 md:mt-0">Academic &amp; Address</div>
                <InfoRow label="Class" value={student.classroom_name} />
                <InfoRow label="Enrollment Date" value={formatDate(student.enrollment_date)} />
                <InfoRow label="Previous School" value={student.previous_school} />
                <InfoRow label="Boarding Status" value={labelFor(BOARDING_CHOICES, student.boarding_status)} />
                <InfoRow label="House / Dormitory" value={student.house_dormitory} />
                <InfoRow label="Residential Address" value={student.residential_address} />
                <InfoRow label="City" value={student.city} />
                <InfoRow label="Region" value={labelFor(REGION_CHOICES, student.region)} />
              </div>
            </div>
          )}

          {/* Overview Tab — edit mode */}
          {activeTab === 'overview' && editing && (
            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <div className="text-xs font-bold text-navy uppercase tracking-wide mb-2">Personal Information</div>
                <EditRow label="First Name">
                  <input className={editInput} value={editForm.first_name} onChange={(e) => updateField('first_name', e.target.value)} />
                </EditRow>
                <EditRow label="Middle Name">
                  <input className={editInput} value={editForm.middle_name} onChange={(e) => updateField('middle_name', e.target.value)} />
                </EditRow>
                <EditRow label="Last Name">
                  <input className={editInput} value={editForm.last_name} onChange={(e) => updateField('last_name', e.target.value)} />
                </EditRow>
                <EditRow label="Date of Birth">
                  <input type="date" className={editInput} value={editForm.date_of_birth || ''} onChange={(e) => updateField('date_of_birth', e.target.value)} />
                </EditRow>
                <EditRow label="Gender">
                  <select className={editInput} value={editForm.gender} onChange={(e) => updateField('gender', e.target.value)}>
                    {GENDER_CHOICES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </EditRow>
                <EditRow label="Place of Birth">
                  <input className={editInput} value={editForm.place_of_birth} onChange={(e) => updateField('place_of_birth', e.target.value)} />
                </EditRow>
                <EditRow label="Home Town">
                  <input className={editInput} value={editForm.home_town} onChange={(e) => updateField('home_town', e.target.value)} />
                </EditRow>
                <EditRow label="Nationality">
                  <input className={editInput} value={editForm.nationality} onChange={(e) => updateField('nationality', e.target.value)} />
                </EditRow>
                <EditRow label="Mother Tongue">
                  <input className={editInput} value={editForm.mother_tongue} onChange={(e) => updateField('mother_tongue', e.target.value)} />
                </EditRow>
                <EditRow label="Religion">
                  <select className={editInput} value={editForm.religion} onChange={(e) => updateField('religion', e.target.value)}>
                    {RELIGION_CHOICES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </EditRow>
              </div>
              <div>
                <div className="text-xs font-bold text-navy uppercase tracking-wide mb-2 mt-6 md:mt-0">Academic &amp; Address</div>
                <div className="py-2 border-b border-gray-50">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Class</div>
                  <div className="text-sm text-gray-400">{student.classroom_name || 'Unassigned'} <span className="text-gray-300">Â· edit via the class link above</span></div>
                </div>
                <EditRow label="Previous School">
                  <input className={editInput} value={editForm.previous_school} onChange={(e) => updateField('previous_school', e.target.value)} />
                </EditRow>
                <EditRow label="Boarding Status">
                  <select className={editInput} value={editForm.boarding_status} onChange={(e) => updateField('boarding_status', e.target.value)}>
                    {BOARDING_CHOICES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </EditRow>
                <EditRow label="House / Dormitory">
                  <input className={editInput} value={editForm.house_dormitory} onChange={(e) => updateField('house_dormitory', e.target.value)} />
                </EditRow>
                <EditRow label="Residential Address">
                  <textarea rows={2} className={editInput} value={editForm.residential_address} onChange={(e) => updateField('residential_address', e.target.value)} />
                </EditRow>
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
          )}

          {/* Guardians Tab */}
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