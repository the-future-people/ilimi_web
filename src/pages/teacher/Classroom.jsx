import { useRef, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import PortalHeader from '../../components/layout/PortalHeader'
import { getMyClassrooms } from '../../api/academics'
import { useAuth } from '../../context/AuthContext'

const tabs = [
  { label: 'My Classes', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', active: true },
  { label: 'Daily Attendance', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { label: 'Cover Lessons', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { label: 'Extracurricular', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { label: 'Competitions', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Substitutions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
]

function Classroom() {
  const { activeMember } = useAuth()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-classrooms'],
    queryFn: getMyClassrooms,
  })

  const classrooms = data?.data?.classrooms || []

  const tabScrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const checkScroll = () => {
    const el = tabScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    checkScroll()
    const el = tabScrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [])

  useEffect(() => {
    const onPageScroll = () => setIsScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onPageScroll)
    return () => window.removeEventListener('scroll', onPageScroll)
  }, [])

  const scrollTabs = (direction) => {
    const el = tabScrollRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' })
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex items-center gap-2 text-xs text-gray-400 pt-4 pb-3">
            <Link to="/teacher" className="hover:text-navy transition">My Portal</Link>
            <span className="text-gray-300">›</span>
            <span className="text-navy font-semibold">Classroom</span>
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
                  key={tab.label}
                  disabled={!tab.active}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-3.5 sm:py-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition ${
                    tab.active
                      ? 'border-gold text-navy'
                      : 'border-transparent text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                  </svg>
                  {tab.label}
                  {!tab.active && (
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
          <div className="p-4 sm:p-6">
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy mb-2">Classroom</h1>
            <div className="flex items-center gap-6 mb-6">
              <div>
                <div className="text-sm font-bold text-navy">{classrooms.length}</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wide">Assigned Classes</div>
              </div>
              <div className="w-px h-7 bg-gray-200" />
              <div>
                <div className="text-sm font-bold text-navy">{activeMember?.school_name}</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wide">School</div>
              </div>
            </div>

            {isLoading && (
              <div className="text-center py-20 text-gray-400 text-sm">Loading your classes...</div>
            )}

            {isError && (
              <div className="text-center py-20 text-red-500 text-sm">
                Failed to load classes: {error?.response?.data?.message || error.message}
              </div>
            )}

            {!isLoading && !isError && classrooms.length === 0 && (
              <div className="text-center py-20 text-gray-400 text-sm">
                No classes assigned to you yet.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {classrooms.map((classroom) => (
                <div
                  key={classroom.id}
                  className="bg-navy rounded-xl p-3.5 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="font-serif text-white font-bold text-[13px] truncate">
                        {classroom.full_name}
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                      {classroom.class_level}
                    </span>
                  </div>

                  <div className="mb-3.5">
                    <div className="text-white/40 text-[10px] mb-0.5">Students Enrolled</div>
                    <div className="text-white text-xl font-bold">{classroom.student_count}</div>
                  </div>

                  <div className="flex items-center gap-1.5 mb-3">
                    <Link
                      to={`/teacher/classroom/${classroom.id}`}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full bg-white/10 hover:bg-gold hover:text-navy text-white text-[11px] font-semibold transition-all"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </Link>
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full bg-white/5 text-white/30 text-[11px] font-semibold cursor-not-allowed"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Attend
                    </button>
                  </div>

                  <div className="pt-2 border-t border-white/10 text-center">
                    <span className="text-[9px] text-white/30 tracking-wide uppercase">
                      {classroom.academic_year} · {classroom.subjects.length} subject{classroom.subjects.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Classroom