import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import PortalHeader from '../../components/layout/PortalHeader'
import { getStudentsByClassroom } from '../../api/students'
import { getMyClassrooms } from '../../api/academics'
import AttendancePanel from './AttendancePanel'
import CAScoresPanel from './CAScoresPanel'

const tabs = [
  { key: 'today', label: 'Today', available: true },
  { key: 'attendance', label: 'Attendance', available: true },
  { key: 'classwork', label: 'Classwork', available: true },
  { key: 'lesson-notes', label: 'Lesson Notes', available: false },
  { key: 'reports', label: 'Reports', available: false },
  { key: 'roster', label: 'Roster', available: true },
]

const chevron = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
)

function TodayPanel({ classroom, studentCount, onGo }) {
  const attendanceDue = classroom?.attendance_due === true
  const unmarkedCount = classroom?.unmarked_count || 0
  const isFormClass = classroom?.is_form_teacher === true

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const nothingDue = !attendanceDue && unmarkedCount === 0

  return (
    <div className="p-4 sm:p-6">
      <div className="text-xs text-gray-500 mb-5">
        {today} · {studentCount} student{studentCount !== 1 ? 's' : ''}
        {isFormClass && <span className="ml-2 text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full uppercase">Form Master</span>}
      </div>

      {attendanceDue && (
        <button
          onClick={() => onGo('attendance')}
          className="w-full flex items-center justify-between px-4 py-3.5 mb-2.5 bg-navy rounded-xl text-left hover:shadow-lg transition"
        >
          <div>
            <div className="text-sm font-semibold text-white">Attendance not taken</div>
            <div className="text-[11px] text-white/50 mt-0.5">Morning register still open</div>
          </div>
          <span className="text-[11px] font-bold bg-gold text-navy px-3.5 py-2 rounded-lg flex-shrink-0">
            Take register
          </span>
        </button>
      )}

      {unmarkedCount > 0 && (
        <button
          onClick={() => onGo('classwork')}
          className="w-full flex items-center justify-between px-4 py-3.5 mb-2.5 bg-red-50 rounded-xl text-left hover:shadow-md transition border border-red-200"
        >
          <div>
            <div className="text-sm font-semibold text-red-900">Work awaiting marks</div>
            <div className="text-[11px] text-red-700 mt-0.5">
              {unmarkedCount} student record{unmarkedCount !== 1 ? 's' : ''} still unmarked
            </div>
          </div>
          <span className="text-[11px] font-bold border border-red-700 text-red-900 px-3.5 py-2 rounded-lg flex-shrink-0">
            Mark
          </span>
        </button>
      )}

      {nothingDue && (
        <div className="text-center py-10 px-4 bg-gray-50 rounded-xl mb-2.5">
          <div className="text-sm font-semibold text-navy mb-1">Nothing outstanding</div>
          <div className="text-xs text-gray-400">
            Attendance is done and all work is marked.
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-gray-100">
        <button
          onClick={() => onGo('classwork')}
          className="flex items-center gap-1.5 text-xs font-semibold text-navy border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Set classwork
        </button>
        <button
          onClick={() => onGo('roster')}
          className="flex items-center gap-1.5 text-xs font-semibold text-navy border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          View roster
        </button>
      </div>
    </div>
  )
}

function ClassDetail() {
  const { classroomId } = useParams()
  const [activeTab, setActiveTab] = useState('today')
  const [search, setSearch] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['classroom-students', classroomId],
    queryFn: () => getStudentsByClassroom(classroomId),
  })

  const { data: classroomsData } = useQuery({
    queryKey: ['my-classrooms'],
    queryFn: getMyClassrooms,
  })
  const currentClassroom = (classroomsData?.data?.classrooms || []).find(
    (c) => c.id === parseInt(classroomId)
  )

  const students = data?.data?.students || []

  const filteredStudents = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const initials = (name) => name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  const className = currentClassroom?.full_name || students[0]?.classroom_name || `Class ${classroomId}`

  return (
    <div className="min-h-screen">
      <PortalHeader />

      <div
        className={`sticky top-16 z-40 bg-gray-100/95 backdrop-blur-sm transition-shadow ${
          isScrolled ? 'shadow-sm border-b border-gray-200' : ''
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-gray-400 pt-3 sm:pt-4 pb-2.5 sm:pb-3 overflow-x-auto no-scrollbar whitespace-nowrap">
            <Link to="/teacher" className="hover:text-navy transition">My Portal</Link>
            <span className="text-gray-300">›</span>
            <span className="text-navy font-semibold">{className}</span>
          </div>

          <div className="bg-white rounded-t-2xl shadow">
            <div className="flex items-center gap-1 px-3 sm:px-6 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => tab.available && setActiveTab(tab.key)}
                  disabled={!tab.available}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                    activeTab === tab.key
                      ? 'border-gold text-navy'
                      : tab.available
                      ? 'border-transparent text-gray-400 hover:text-navy'
                      : 'border-transparent text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {tab.label}
                  {!tab.available && (
                    <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">Soon</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 pb-10">
        <div className="bg-white rounded-b-2xl shadow-lg -mt-px">
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy px-4 sm:px-6 pt-5 sm:pt-6">
            {className}
          </h1>

          <AnimatePresence mode="wait">
          {activeTab === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            >
              <TodayPanel
                classroom={currentClassroom}
                studentCount={students.length}
                onGo={setActiveTab}
              />
            </motion.div>
          )}

          {activeTab === 'attendance' && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            >
              <AttendancePanel classroomId={classroomId} />
            </motion.div>
          )}

          {activeTab === 'classwork' && currentClassroom && (
            <motion.div
              key="classwork"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            >
              <CAScoresPanel classroomId={classroomId} subjects={currentClassroom.subjects} />
            </motion.div>
          )}

          {activeTab === 'roster' && (
            <motion.div
              key="roster"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              className="p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="text-sm text-gray-500">
                  {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                </div>
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold w-full sm:w-64"
                />
              </div>

              {isLoading && (
                <div className="text-center py-14 text-gray-400 text-sm">Loading students...</div>
              )}
              {isError && (
                <div className="text-center py-14 text-red-500 text-sm">Failed to load students.</div>
              )}
              {!isLoading && filteredStudents.length === 0 && (
                <div className="text-center py-14 text-gray-400 text-sm">No students found.</div>
              )}

              {!isLoading && filteredStudents.length > 0 && (
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-100">
                        <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Student</th>
                        <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">ID</th>
                        <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Gender</th>
                        <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Status</th>
                        <th className="pb-2 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Enrolled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-800 to-blue-600 text-white text-[11px] font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                                {student.photo ? (
                                  <img src={student.photo} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  initials(student.full_name)
                                )}
                              </div>
                              <span className="text-sm font-semibold text-navy">{student.full_name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-sm text-gray-500">{student.student_id}</td>
                          <td className="py-3">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
                              {student.gender}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 capitalize">
                              {student.status}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-500">{student.enrollment_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!isLoading && filteredStudents.length > 0 && (
                <div className="md:hidden flex flex-col gap-3">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="border border-gray-100 rounded-xl p-3.5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-800 to-blue-600 text-white text-[11px] font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                          {student.photo ? (
                            <img src={student.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            initials(student.full_name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-navy truncate">{student.full_name}</div>
                          <div className="text-xs text-gray-400">{student.student_id}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">
                          {student.gender}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 capitalize">
                          {student.status}
                        </span>
                        <span className="text-[11px] text-gray-400 ml-auto">{student.enrollment_date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default ClassDetail