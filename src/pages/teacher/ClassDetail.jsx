import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import PortalHeader from '../../components/layout/PortalHeader'
import { getStudentsByClassroom } from '../../api/students'
import { getMyClassrooms, getClassroomOverview } from '../../api/academics'
import AttendancePanel from './AttendancePanel'
import CAScoresPanel from './CAScoresPanel'
import ClassworkPanel from './ClassworkPanel'
import LessonNotesPanel from './LessonNotesPanel'

const tabs = [
  {
    key: 'today',
    label: 'Overview',
    available: true,
    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    available: true,
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  {
    key: 'classwork',
    label: 'Classwork',
    available: true,
    icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  },
  {
    key: 'lesson-notes',
    label: 'Lesson Notes',
    available: true,
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    key: 'reports',
    label: 'Reports',
    available: false,
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    key: 'roster',
    label: 'Roster',
    available: true,
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  },
]

const chevron = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
)

const AVATAR_COLORS = ['#378ADD', '#D4537E', '#1D9E75', '#7F77DD', '#BA7517']
const colorFor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length]
const initialsOf = (name) =>
  name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase()

function PersonRow({ id, name, right, rightClass = 'text-gray-400' }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
        style={{ backgroundColor: colorFor(id) }}
      >
        {initialsOf(name)}
      </div>
      <span className="text-xs text-navy truncate">{name}</span>
      <span className={`text-[11px] ml-auto flex-shrink-0 ${rightClass}`}>{right}</span>
    </div>
  )
}

function PendingPanel({ icon, title, value, unit, note }) {
  return (
    <div className="bg-white border border-dashed border-gray-300 rounded-xl p-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
        </svg>
        <span className="text-[13px] font-semibold text-gray-500">{title}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-2xl font-bold text-gray-300">{value}</span>
        <span className="text-xs text-gray-400">{unit}</span>
      </div>
      <div className="text-[11px] text-gray-400 leading-relaxed">{note}</div>
    </div>
  )
}

function TodayPanel({ classroom, classroomId, studentCount, onGo }) {
  const attendanceDue = classroom?.attendance_due === true
  const unmarkedCount = classroom?.unmarked_count || 0
  const isFormClass = classroom?.is_form_teacher === true
  const subjectNames = (classroom?.subjects || []).map((s) => s.name).join(', ')

  const { data } = useQuery({
    queryKey: ['classroom-overview', classroomId],
    queryFn: () => getClassroomOverview(classroomId),
    enabled: !!classroomId,
  })

  const overview = data?.data
  const away = overview?.away || []
  const missing = overview?.missing_work || []
  const registerTaken = overview?.register_taken

  const todayLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 mb-4">
        <span>{todayLabel}</span>
        <span className="text-gray-300">·</span>
        <span>{studentCount} student{studentCount !== 1 ? 's' : ''}</span>
        {subjectNames && (
          <>
            <span className="text-gray-300">·</span>
            <span>{subjectNames}</span>
          </>
        )}
        {isFormClass && (
          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full uppercase">
            Form Master
          </span>
        )}
      </div>

      {attendanceDue && (
        <button
          onClick={() => onGo('attendance')}
          className="w-full flex items-center justify-between gap-3 px-3.5 py-3 mb-2 bg-navy rounded-lg text-left hover:shadow-lg transition"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <svg className="w-5 h-5 text-gold flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-white">Attendance not taken</div>
              <div className="text-[11px] text-white/50">Morning register still open</div>
            </div>
          </div>
          <span className="text-[11px] font-bold bg-gold text-navy px-3 py-1.5 rounded-lg flex-shrink-0">
            Take register
          </span>
        </button>
      )}

      {unmarkedCount > 0 && (
        <button
          onClick={() => onGo('classwork')}
          className="w-full flex items-center justify-between gap-3 px-3.5 py-3 mb-2 bg-amber-50 border border-amber-200 rounded-lg text-left hover:shadow-md transition"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <svg className="w-5 h-5 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-amber-950">
                {unmarkedCount} record{unmarkedCount !== 1 ? 's' : ''} awaiting marks
              </div>
              <div className="text-[11px] text-amber-800">Work is past its due date</div>
            </div>
          </div>
          <span className="text-[11px] font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg flex-shrink-0">
            Go to classwork
          </span>
        </button>
      )}

      {!attendanceDue && unmarkedCount === 0 && (
        <div className="text-center py-6 px-4 bg-gray-50 rounded-lg mb-2">
          <div className="text-sm font-semibold text-navy mb-0.5">Nothing outstanding</div>
          <div className="text-xs text-gray-400">Attendance is done and all work is marked.</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mt-4">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 mb-2.5">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span className="text-[13px] font-semibold text-navy">Away today</span>
            {registerTaken && (
              <span className="text-[11px] text-gray-400 ml-auto">{away.length} of {studentCount}</span>
            )}
          </div>
          {!registerTaken ? (
            <div className="text-[11px] text-gray-400 py-2">
              Take the register to see who is away.
            </div>
          ) : away.length === 0 ? (
            <div className="text-[11px] text-green-700 py-2">Everyone is present today.</div>
          ) : (
            away.map((s) => (
              <PersonRow
                key={s.id}
                id={s.id}
                name={s.name}
                right={s.status_display}
                rightClass={s.status === 'late' ? 'text-amber-700' : 'text-gray-400'}
              />
            ))
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 mb-2.5">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.33 16a2 2 0 001.74 3z" />
            </svg>
            <span className="text-[13px] font-semibold text-navy">Missing work</span>
            {missing.length > 0 && (
              <span className="text-[11px] text-gray-400 ml-auto">
                Last {overview?.tasks_considered} tasks
              </span>
            )}
          </div>
          {missing.length === 0 ? (
            <div className="text-[11px] text-gray-400 py-2">
              {(overview?.tasks_considered || 0) < 2
                ? 'Not enough work marked yet to spot a pattern.'
                : 'Everyone is keeping up with their work.'}
            </div>
          ) : (
            missing.map((s) => (
              <PersonRow
                key={s.id}
                id={s.id}
                name={s.name}
                right={`${s.missed} of ${s.of} missed`}
                rightClass={s.missed >= s.of - 1 ? 'text-red-700 font-semibold' : 'text-amber-700'}
              />
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mt-2.5">
        <PendingPanel
          icon="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          title="Class average"
          value="—"
          unit="/ 100"
          note="Appears once the term closes, with the change against the term before."
        />
        <PendingPanel
          icon="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
          title="Falling behind"
          value="—"
          unit="students"
          note="Flags pupils whose scores drop against their own earlier work. Needs one full term of marks."
        />
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
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 pt-3 sm:pt-4 pb-2.5 sm:pb-3 overflow-x-auto no-scrollbar whitespace-nowrap">
                        <Link to="/teacher" className="flex items-center gap-1.5 hover:text-navy transition font-medium">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              My Portal
            </Link>
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
            <span className="flex items-center gap-1.5 text-navy font-semibold">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {className}
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
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                  </svg>
                  <span className="hidden sm:inline">{tab.label}</span>
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
                classroomId={classroomId}
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
            <ClassworkPanel classroomId={classroomId} subjects={currentClassroom.subjects} />
            </motion.div>
          )}

          {activeTab === 'lesson-notes' && currentClassroom && (
            <motion.div
              key="lesson-notes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            >
              <LessonNotesPanel classroomId={classroomId} subjects={currentClassroom.subjects} />
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