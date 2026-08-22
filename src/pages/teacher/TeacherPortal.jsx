import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import PortalHeader from '../../components/layout/PortalHeader'
import { getMyClassrooms } from '../../api/academics'

const crossCutting = [
  {
    key: 'students',
    title: 'My Students',
    desc: 'Behaviour records, at-risk flags and the parent communication log.',
    tags: ['Behaviour', 'At-Risk', 'Parent Log'],
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    available: false,
    gradient: 'from-rose-600 to-pink-800',
  },
  {
    key: 'timetable',
    title: 'My Timetable',
    desc: 'Where you are meant to be, today and across the week.',
    tags: ['Today', 'This Week', 'Periods'],
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    available: false,
    gradient: 'from-teal-600 to-emerald-800',
  },
  {
    key: 'cover',
    title: 'Cover & Duties',
    desc: 'Substitutions, cover lessons and the duty rota assigned to you.',
    tags: ['Cover', 'Duty Rota', 'Substitutions'],
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    available: false,
    gradient: 'from-amber-600 to-orange-800',
  },
  {
    key: 'admin',
    title: 'Professional & Admin',
    desc: 'NTC CPD hours, staff meetings, INSET days and textbook inventory.',
    tags: ['CPD / NTC', 'Meetings', 'Textbooks'],
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    available: false,
    gradient: 'from-purple-700 to-violet-900',
  },
]

const schoolIcon =
  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'

function ClassCard({ classroom }) {
  const isFormClass = classroom.is_form_teacher === true
  const subjectCount = classroom.subjects.length

  // Outstanding state — populated by the backend once wired.
  const attendanceDue = classroom.attendance_due === true
  const unmarkedCount = classroom.unmarked_count || 0

  return (
    <Link
      to={`/teacher/classroom/${classroom.id}`}
      className={`group bg-navy rounded-xl p-4 flex flex-col transition-all hover:shadow-xl hover:-translate-y-0.5 ${
        isFormClass ? 'ring-2 ring-gold' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
            isFormClass ? 'bg-gold' : 'bg-white/10'
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 ${isFormClass ? 'text-navy' : 'text-white/60'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={schoolIcon} />
          </svg>
        </div>
        <span
          className={`text-[9px] font-bold tracking-wide uppercase ${
            isFormClass ? 'text-gold' : 'text-white/40'
          }`}
        >
          {isFormClass ? 'Form Master' : 'Subject'}
        </span>
        <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/50 flex-shrink-0">
          {classroom.class_level}
        </span>
      </div>

      <div className="font-serif text-white font-bold text-sm mb-3 truncate">
        {classroom.full_name}
      </div>

      <div className="flex gap-5 mb-3.5">
        <div>
          <div className="text-white text-xl font-bold leading-none">{classroom.student_count}</div>
          <div className="text-[9px] text-white/40 tracking-wide uppercase mt-0.5">Students</div>
        </div>
        <div>
          <div className="text-white text-xl font-bold leading-none">{subjectCount}</div>
          <div className="text-[9px] text-white/40 tracking-wide uppercase mt-0.5">
            Subject{subjectCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="mt-auto">
        {attendanceDue ? (
          <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-md bg-gold text-navy">
            Attendance due
          </span>
        ) : unmarkedCount > 0 ? (
          <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-md bg-red-200 text-red-900">
            {unmarkedCount} unmarked
          </span>
        ) : (
          <span className="inline-block text-[10px] text-white/25 py-1">Nothing due</span>
        )}
      </div>
    </Link>
  )
}

function TeacherPortal() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-classrooms'],
    queryFn: getMyClassrooms,
  })

  const classrooms = data?.data?.classrooms || []
  const totalSubjects = classrooms.reduce((sum, c) => sum + c.subjects.length, 0)

  return (
    <div className="min-h-screen">
      <PortalHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-8">

        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-lg font-bold text-navy">My Teaching Load</h2>
          <span className="text-xs text-gray-400">
            {classrooms.length} class{classrooms.length !== 1 ? 'es' : ''} · {totalSubjects} subject{totalSubjects !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading && (
          <div className="text-center py-16 text-gray-400 text-sm">Loading your classes...</div>
        )}

        {isError && (
          <div className="text-center py-16 text-red-500 text-sm">
            Failed to load classes: {error?.response?.data?.message || error.message}
          </div>
        )}

        {!isLoading && !isError && classrooms.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">
            No classes assigned to you yet.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-10">
          {classrooms.map((classroom) => (
            <ClassCard key={classroom.id} classroom={classroom} />
          ))}
        </div>

        <h2 className="font-serif text-lg font-bold text-navy mb-3">Everything Else</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {crossCutting.map((tile) => (
            <div
              key={tile.key}
              className={`relative overflow-hidden bg-gradient-to-br ${tile.gradient} rounded-xl p-4 min-h-[165px] flex flex-col`}
            >
              <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tile.icon} />
                </svg>
              </div>

              <div className="font-serif text-sm font-bold text-white mb-1">{tile.title}</div>
              <div className="text-[11px] text-white/70 leading-relaxed mb-3 flex-1">{tile.desc}</div>

              <div className="flex flex-wrap gap-1 mb-2.5">
                {tile.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white/80 self-start">
                {tile.available ? 'Open' : 'Coming Soon'}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default TeacherPortal