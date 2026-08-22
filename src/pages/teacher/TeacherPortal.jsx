import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import PortalHeader from '../../components/layout/PortalHeader'
import { getMyClassrooms } from '../../api/academics'
import { useAuth } from '../../context/AuthContext'

const crossCutting = [
  {
    key: 'students',
    title: 'My Students',
    desc: 'Behaviour records, at-risk flags and the parent communication log.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    available: false,
  },
  {
    key: 'timetable',
    title: 'My Timetable',
    desc: 'Where you are meant to be, today and across the week.',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    available: false,
  },
  {
    key: 'cover',
    title: 'Cover & Duties',
    desc: 'Substitutions, cover lessons and the duty rota assigned to you.',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    available: false,
  },
  {
    key: 'admin',
    title: 'Professional & Admin',
    desc: 'NTC CPD hours, staff meetings, INSET days and textbook inventory.',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    available: false,
  },
]

function TeacherPortal() {
  const { activeMember } = useAuth()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-classrooms'],
    queryFn: getMyClassrooms,
  })

  const classrooms = data?.data?.classrooms || []
  const subjectIds = new Set()
  classrooms.forEach((c) => c.subjects.forEach((s) => subjectIds.add(s.id)))

  return (
    <div className="min-h-screen">
      <PortalHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-8">

        {/* My Teaching Load */}
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-lg font-bold text-navy">My Teaching Load</h2>
          <span className="text-xs text-gray-400">
            {classrooms.length} class{classrooms.length !== 1 ? 'es' : ''} · {subjectIds.size} subject{subjectIds.size !== 1 ? 's' : ''}
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
          {classrooms.map((classroom) => {
            const isFormClass = classroom.is_form_teacher === true

            return (
              <Link
                key={classroom.id}
                to={`/teacher/classroom/${classroom.id}`}
                className={`group bg-navy rounded-xl p-4 flex flex-col transition-all hover:shadow-xl hover:-translate-y-0.5 ${
                  isFormClass ? 'ring-2 ring-gold ring-offset-2 ring-offset-gray-100' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[9px] font-bold tracking-wide uppercase ${isFormClass ? 'text-gold' : 'text-white/40'}`}>
                    {isFormClass ? 'Form Master' : 'Subject'}
                  </span>
                  <span className="flex-shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                    {classroom.class_level}
                  </span>
                </div>

                <div className="font-serif text-white font-bold text-sm mb-1 truncate">
                  {classroom.full_name}
                </div>

                <div className="text-[11px] text-white/50 mb-4">
                  {classroom.student_count} student{classroom.student_count !== 1 ? 's' : ''} · {classroom.subjects.length} subject{classroom.subjects.length !== 1 ? 's' : ''}
                </div>

                <div className="mt-auto">
                  <span className="inline-block text-[10px] text-white/30">
                    Nothing due
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Everything else */}
        <h2 className="font-serif text-lg font-bold text-navy mb-3">Everything Else</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {crossCutting.map((tile) => (
            <div
              key={tile.key}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col"
            >
              <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center mb-3">
                <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tile.icon} />
                </svg>
              </div>

              <div className="font-serif text-sm font-bold text-navy mb-1">{tile.title}</div>
              <div className="text-[11px] text-gray-500 leading-relaxed mb-3 flex-1">{tile.desc}</div>

              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 self-start">
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