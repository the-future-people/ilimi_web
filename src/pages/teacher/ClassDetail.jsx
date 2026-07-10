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
  { key: 'roster', label: 'Student Roster', available: true },
  { key: 'attendance', label: 'Attendance', available: true },
  { key: 'ca-scores', label: 'CA Scores', available: true },
]

function ClassDetail() {
  const { classroomId } = useParams()
  const [activeTab, setActiveTab] = useState('roster')
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

  return (
    <div className="min-h-screen">
      <PortalHeader />

      {/* Sticky breadcrumb + tabs */}
      <div
        className={`sticky top-16 z-40 bg-gray-100/95 backdrop-blur-sm transition-shadow ${
          isScrolled ? 'shadow-sm border-b border-gray-200' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-gray-400 pt-3 sm:pt-4 pb-2.5 sm:pb-3 overflow-x-auto no-scrollbar whitespace-nowrap">
            <Link to="/teacher" className="hover:text-navy transition">My Portal</Link>
            <span className="text-gray-300">›</span>
            <Link to="/teacher/classroom" className="hover:text-navy transition">Classroom</Link>
            <span className="text-gray-300">›</span>
            <span className="text-navy font-semibold">
              {students[0]?.classroom_name || `Class ${classroomId}`}
            </span>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pb-10">
        <div className="bg-white rounded-b-2xl shadow-lg -mt-px">
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy px-4 sm:px-6 pt-5 sm:pt-6">
            {students[0]?.classroom_name || 'Classroom'}
          </h1>

          <AnimatePresence mode="wait">
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

              {/* Desktop table — hidden below md */}
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

              {/* Mobile stacked cards — shown below md */}
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

          {activeTab === 'ca-scores' && currentClassroom && (
            <motion.div
              key="ca-scores"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            >
              <CAScoresPanel classroomId={classroomId} subjects={currentClassroom.subjects} />
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default ClassDetail