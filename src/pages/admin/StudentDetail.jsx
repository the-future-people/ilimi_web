import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { getStudentDetail, changeStudentClass } from '../../api/students'
import { getSchoolClassrooms } from '../../api/academics'
import DocumentsTab from './DocumentsTab'
import { API_BASE_URL } from '../../config'
import { STUDENTS_TAB } from '../../constants/nav'

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

function InfoRow({ label, value }) {
  return (
    <div className="py-2.5 border-b border-gray-50 last:border-0">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm text-navy">{value || '—'}</div>
    </div>
  )
}

function StudentDetail() {
  const { studentId } = useParams()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [isScrolled, setIsScrolled] = useState(false)
  const [showClassModal, setShowClassModal] = useState(false)
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [classChangeRemarks, setClassChangeRemarks] = useState('')
  const [changingClass, setChangingClass] = useState(false)
  const [classChangeError, setClassChangeError] = useState('')


  const tabScrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkTabScroll = () => {
  const el = tabScrollRef.current
  if (!el) return
  console.log('scrollWidth:', el.scrollWidth, 'clientWidth:', el.clientWidth)
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
        className={`sticky top-16 z-40 bg-gray-100/95 backdrop-blur-sm transition-shadow ${
          isScrolled ? 'shadow-sm border-b border-gray-200' : ''
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-gray-400 pt-3 sm:pt-4 pb-2.5 sm:pb-3 overflow-x-auto no-scrollbar whitespace-nowrap">
            <Link to="/admin" className="hover:text-navy transition">Dashboard</Link>
            <span className="text-gray-300">›</span>
            <Link to={STUDENTS_TAB} className="hover:text-navy transition">Students</Link>
            <span className="text-gray-300">›</span>
            <span className="text-navy font-semibold">{student.full_name}</span>
          </div>

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
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                    activeTab === tab.key
                      ? 'border-gold text-navy'
                      : 'border-transparent text-gray-400 hover:text-navy'
                  }`}
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 sm:p-6 border-b border-gray-100">
            <div className="w-16 h-16 rounded-2xl bg-navy text-white text-lg font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
              {student.photo ? (
                <img src={`${API_BASE_URL}${student.photo}`} alt="" className="w-full h-full object-cover" />
              ) : (
                initials(student.full_name)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy truncate">{student.full_name}</h1>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-xs text-gray-400">{student.student_id}</span>
                <span className="text-gray-200">·</span>
                <button
                  onClick={() => { setSelectedClassroom(student.current_class || ''); setShowClassModal(true); }}
                  className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
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
            <button className="flex items-center gap-2 bg-navy text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-navy-light transition whitespace-nowrap">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <div className="text-xs font-bold text-navy uppercase tracking-wide mb-2">Personal Information</div>
                <InfoRow label="Full Name" value={student.full_name} />
                <InfoRow label="Date of Birth" value={formatDate(student.date_of_birth)} />
                <InfoRow label="Gender" value={student.gender} />
                <InfoRow label="Place of Birth" value={student.place_of_birth} />
                <InfoRow label="Home Town" value={student.home_town} />
                <InfoRow label="Nationality" value={student.nationality} />
                <InfoRow label="Mother Tongue" value={student.mother_tongue} />
                <InfoRow label="Religion" value={student.religion} />
              </div>
              <div>
                <div className="text-xs font-bold text-navy uppercase tracking-wide mb-2 mt-6 md:mt-0">Academic & Address</div>
                <InfoRow label="Class" value={student.classroom_name} />
                <InfoRow label="Enrollment Date" value={formatDate(student.enrollment_date)} />
                <InfoRow label="Previous School" value={student.previous_school} />
                <InfoRow label="Boarding Status" value={student.boarding_status} />
                <InfoRow label="House / Dormitory" value={student.house_dormitory} />
                <InfoRow label="Residential Address" value={student.residential_address} />
                <InfoRow label="City" value={student.city} />
                <InfoRow label="Region" value={student.region} />
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
                      <div className="text-xs text-gray-400 mt-2">{g.guardian.occupation}{g.guardian.employer ? ` · ${g.guardian.employer}` : ''}</div>
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
    </div>
  )
}

export default StudentDetail