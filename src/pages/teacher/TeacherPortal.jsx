import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PortalHeader from '../../components/layout/PortalHeader'
import { getMyClassrooms } from '../../api/academics'
import { getMyStaffProfile } from '../../api/staff'

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

const AVATAR_COLORS = ['#378ADD', '#D4537E', '#1D9E75', '#7F77DD', '#BA7517']
const colorFor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length]
const initialsOf = (name) =>
  name.split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase()

const schoolIcon =
  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'

const chevron = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
)

function ClassCard({ classroom }) {
  const isFormClass = classroom.is_form_teacher === true
  const attendanceDue = classroom.attendance_due === true
  const unmarkedCount = classroom.unmarked_count || 0
  const preview = classroom.student_preview || []
  const remaining = classroom.student_count - preview.length
  const subjectNames = classroom.subjects.map((s) => s.name).join(', ')

  return (
    <Link
      to={`/teacher/classroom/${classroom.id}`}
      className={`bg-white rounded-xl p-3 flex flex-col transition-all hover:shadow-lg border-2 ${
        isFormClass ? 'border-gold' : 'border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className={`w-[26px] h-[26px] rounded-lg border-[1.5px] flex items-center justify-center ${
            isFormClass ? 'border-gold' : 'border-gray-400'
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 ${isFormClass ? 'text-gold' : 'text-gray-500'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={schoolIcon} />
          </svg>
        </div>
        <span
          className={`text-[8px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full ${
            isFormClass ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isFormClass ? 'Form Master' : classroom.class_level}
        </span>
      </div>

      <div className="text-[13px] font-semibold text-navy truncate">{classroom.full_name}</div>
      <div className="text-[11px] text-gray-500 leading-snug mb-2">{subjectNames}</div>

      {attendanceDue ? (
        <div className="flex items-center justify-between px-2.5 py-1.5 mb-2 bg-amber-50 border-l-[3px] border-gold">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-navy truncate">Morning register</div>
            <div className="text-[10px] text-gray-500">Not taken today</div>
          </div>
          <span className="text-gray-400 flex-shrink-0">{chevron}</span>
        </div>
      ) : unmarkedCount > 0 ? (
        <div className="flex items-center justify-between px-2.5 py-1.5 mb-2 bg-red-50 border-l-[3px] border-red-700">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-red-900 truncate">Work awaiting marks</div>
            <div className="text-[10px] text-red-700">{unmarkedCount} unmarked</div>
          </div>
          <span className="text-red-700 flex-shrink-0">{chevron}</span>
        </div>
      ) : (
        <div className="flex items-center justify-between px-2.5 py-1.5 mb-2 bg-gray-50 border-l-[3px] border-gray-300">
          <div className="text-[11px] text-gray-400">Nothing outstanding</div>
          <span className="text-gray-300 flex-shrink-0">{chevron}</span>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-200 pt-2 mt-auto">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] text-gray-500 flex-shrink-0">
            {classroom.student_count} student{classroom.student_count !== 1 ? 's' : ''}
          </span>
          <div className="flex">
            {preview.map((s, i) => (
              <div
                key={s.id}
                className="w-[19px] h-[19px] rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white"
                style={{ backgroundColor: colorFor(s.id), marginLeft: i === 0 ? 0 : '-6px' }}
                title={s.name}
              >
                {initialsOf(s.name)}
              </div>
            ))}
            {remaining > 0 && (
              <div
                className="w-[19px] h-[19px] rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500"
                style={{ marginLeft: '-6px' }}
              >
                +{remaining}
              </div>
            )}
          </div>
        </div>
        <span className="text-gray-300 flex-shrink-0">{chevron}</span>
      </div>
    </Link>
  )
}

function UnassignedState({ firstName }) {
  const { data } = useQuery({
    queryKey: ['my-staff-profile'],
    queryFn: getMyStaffProfile,
    retry: false,
  })

  const profile = data?.data || null
  const subjects = profile?.subject_specializations || []

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-10 text-center mb-4">
        <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-lg font-semibold text-navy mb-1.5">
          You&rsquo;re all set up{firstName ? `, ${firstName}` : ''}
        </div>
        <div className="text-[13px] text-gray-500 leading-relaxed max-w-md mx-auto">
          Your classes and subjects haven&rsquo;t been assigned yet. Your school administrator
          does that, and this page fills in as soon as they do.
        </div>
      </div>

      {profile && (
        <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
          <div className="text-sm font-semibold text-navy">While you wait, check your details</div>
          <div className="text-[12px] text-gray-400 mb-3">
            These were entered during your registration. Tell the office if anything is wrong.
          </div>

          <ProfileRow label="Phone" value={profile.phone} />
          <ProfileRow label="NTC license" value={profile.ntc_license_number} />
          <ProfileRow label="SSNIT" value={profile.ssnit_number} />
          <ProfileRow
            label="Subjects"
            value={subjects.length ? subjects.map((s) => s.name || s).join(', ') : ''}
          />
        </div>
      )}
    </div>
  )
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-t border-gray-100">
      <span className="text-[13px] text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-[13px] text-navy text-right min-w-0 break-words">
        {value || <span className="text-gray-300">Not set</span>}
      </span>
    </div>
  )
}

function ViewToggle({ view, setView }) {
  const options = [
    { key: 'load', label: 'My teaching load' },
    { key: 'extras', label: 'Extras' },
  ]

  return (
    <div className="inline-flex bg-gray-200/70 rounded-full p-[3px] relative">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => setView(opt.key)}
          className="relative px-4 py-1.5 text-xs font-semibold rounded-full transition-colors z-10"
        >
          {view === opt.key && (
            <motion.div
              layoutId="portal-toggle-thumb"
              className="absolute inset-0 bg-navy rounded-full -z-10"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <span className={view === opt.key ? 'text-white' : 'text-gray-500'}>{opt.label}</span>
        </button>
      ))}
    </div>
  )
}

function TeacherPortal() {
  const [view, setView] = useState('load')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-classrooms'],
    queryFn: getMyClassrooms,
  })

  const classrooms = data?.data?.classrooms || []
  const totalSubjects = classrooms.reduce((sum, c) => sum + c.subjects.length, 0)
  const unassigned = !isLoading && !isError && classrooms.length === 0
  const firstName = ''

  return (
    <div className="min-h-screen">
      <PortalHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8">

        {!unassigned && (
          <div className="flex items-center justify-between mb-4 gap-3">
            <ViewToggle view={view} setView={setView} />
            {view === 'load' && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {classrooms.length} class{classrooms.length !== 1 ? 'es' : ''} &middot; {totalSubjects} subject{totalSubjects !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {view === 'load' ? (
            <motion.div
              key="load"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {isLoading && (
                <div className="text-center py-16 text-gray-400 text-sm">Loading your classes...</div>
              )}

              {isError && (
                <div className="text-center py-16 text-red-500 text-sm">
                  Failed to load classes: {error?.response?.data?.message || error.message}
                </div>
              )}

              {!isLoading && !isError && classrooms.length === 0 && (
                <UnassignedState firstName={firstName} />
              )}

              {classrooms.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {classrooms.map((classroom) => (
                    <ClassCard key={classroom.id} classroom={classroom} />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="extras"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
            >
              {crossCutting.map((tile) => (
                <div
                  key={tile.key}
                  className={`relative overflow-hidden bg-gradient-to-br ${tile.gradient} rounded-xl p-3.5 min-h-[128px] flex flex-col`}
                >
                  <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center mb-2">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tile.icon} />
                    </svg>
                  </div>

                  <div className="font-serif text-sm font-bold text-white mb-1">{tile.title}</div>
                  <div className="text-[10px] text-white/70 leading-snug mb-2 flex-1">{tile.desc}</div>

                  <div className="flex flex-wrap gap-1">
                    {tile.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}

export default TeacherPortal