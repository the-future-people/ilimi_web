import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Joyride, STATUS } from 'react-joyride'
import PortalHeader from '../../components/layout/PortalHeader'
import { useAuth } from '../../context/AuthContext'
import { markTourSeen } from '../../api/auth'
import Breadcrumb from '../../components/layout/Breadcrumb'

const modules = [
  {
    key: 'students',
    title: 'Students, Classes & Admissions',
    desc: 'Enrol students, set up classes, and manage records.',
    tags: ['Enrolment', 'Profiles', 'Classes'],
    gradient: 'from-[#1e40af] to-[#3b82f6]',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
    href: '/admin/students',
    available: true,
  },
  {
    key: 'staff',
    title: 'Teachers & Staff',
    desc: 'Manage staff profiles and assign teachers to classes.',
    tags: ['Directory', 'Register', 'Assignment'],
    gradient: 'from-[#15803d] to-[#22c55e]',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    href: '/admin/staff',
    available: true,
  },
  {
    key: 'attendance',
    title: 'Attendance',
    desc: 'Take daily attendance and view historical records.',
    tags: ['Daily Roll', 'Reports', 'Alerts'],
    gradient: 'from-[#c2410c] to-[#f97316]',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    available: false,
  },
  {
    key: 'fees',
    title: 'Fees & Finance',
    desc: 'Collect fees via Mobile Money and track payments.',
    tags: ['MoMo', 'Invoices', 'Reports'],
    gradient: 'from-[#7e22ce] to-[#a855f7]',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2m0-2c-1.11 0-2.08-.402-2.599-1M12 21a9 9 0 100-18 9 9 0 000 18z',
    available: false,
  },
  {
    key: 'communications',
    title: 'Communications, Legal & Consents',
    desc: 'Manage parental consent for excursions, first aid, and media use.',
    tags: ['Consent', 'Excursions', 'Legal'],
    gradient: 'from-[#b45309] to-[#f59e0b]',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    href: '/admin/communications',
    available: true,
  },
  {
    key: 'reports',
    title: 'Reports & Analytics',
    desc: 'Generate academic and financial reports across branches.',
    tags: ['Analytics', 'Exports', 'Branches'],
    gradient: 'from-[#0f766e] to-[#14b8a6]',
    icon: 'M9 17v-2a4 4 0 014-4h3m0 0l-3-3m3 3l-3 3M4 4h6l2 3h8a1 1 0 011 1v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z',
    available: false,
  },
]

const tourSteps = [
  {
    target: 'body',
    placement: 'center',
    content: "Let's take a quick look around your new dashboard.",
    title: 'Welcome to Ilimi!',
  },
  {
    target: '[data-tour="students"]',
    content: "Enrol students, create your classes, and manage records — all here.",
    title: 'Students, Classes & Admissions',
  },
  {
    target: '[data-tour="staff"]',
    content: "Manage teacher profiles, subject assignments, and timetables here.",
    title: 'Teachers & Staff',
  },
  {
    target: '[data-tour="attendance"]',
    content: "Once it's live, you'll take daily attendance and view historical records here.",
    title: 'Attendance',
  },
  {
    target: '[data-tour="fees"]',
    content: "Collect fees via Mobile Money and track payments from here.",
    title: 'Fees & Finance',
  },
  {
    target: '[data-tour="communications"]',
    content: "Manage parental consent for excursions, first aid administration, and media use here.",
    title: 'Communications, Legal & Consents',
  },
  {
    target: '[data-tour="reports"]',
    content: "Generate academic and financial reports across your branches here.",
    title: 'Reports & Analytics',
  },
  {
    target: 'body',
    placement: 'center',
    content: "That's it! You can restart this tour anytime from Settings.",
    title: "You're all set",
  },
]

function ModuleIcon({ path, active }) {
  return (
    <div
      className={`absolute right-4 bottom-4 w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center z-[2] transition-shadow duration-300 ${
        active ? 'animate-icon-pulse group-hover:shadow-[0_0_0_10px_rgba(255,255,255,0.3)]' : ''
      }`}
    >
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d={path} />
      </svg>
      {active && (
        <style>{`
          @keyframes icon-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.25); } 50% { box-shadow: 0 0 0 10px rgba(255,255,255,0); } }
          .animate-icon-pulse { animation: icon-pulse 2.2s ease-in-out infinite; }
        `}</style>
      )}
    </div>
  )
}

function AdminPortal() {
  const { user, activeMember, updateActiveMember } = useAuth()
  const [runTour, setRunTour] = useState(false)

  useEffect(() => {
    if (activeMember && activeMember.has_seen_tour === false) {
      const timer = setTimeout(() => setRunTour(true), 600)
      return () => clearTimeout(timer)
    }
  }, [activeMember])

  const handleJoyrideCallback = (data) => {
    const { status } = data
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false)
      if (activeMember?.id) {
        markTourSeen(activeMember.id).catch((err) => {
          console.error('Failed to mark tour as seen:', err.response?.data || err.message)
        })
        updateActiveMember({ has_seen_tour: true })
      }
    }
  }

  return (
    <div className="min-h-screen">
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        onEvent={handleJoyrideCallback}
        options={{
          primaryColor: '#e8a021',
          textColor: '#1a2946',
          zIndex: 1000,
          showSkipButton: true,
          showProgress: true,
        }}
      />
      <PortalHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <div className="mb-7">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Good to see you, {user?.first_name}.
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {activeMember?.school_name} · {activeMember?.role_display}
            {activeMember?.branch_name ? ` · ${activeMember.branch_name}` : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {modules.map((mod) => {
            const tourKey = mod.key === 'students' ? 'students'
              : mod.key === 'staff' ? 'staff'
              : mod.key === 'attendance' ? 'attendance'
              : mod.key === 'fees' ? 'fees'
              : mod.key === 'communications' ? 'communications'
              : mod.key === 'reports' ? 'reports'
              : null

            const CardInner = (
              <>
                <div className="absolute right-[-20px] bottom-[-20px] w-[120px] h-[120px] rounded-full bg-white/[0.08]" />
                <div className="absolute right-10 bottom-[-40px] w-20 h-20 rounded-full bg-white/5" />
                <div className="relative z-10">
                  <div className="text-base sm:text-lg font-bold text-white leading-snug mb-2">
                    {mod.title}
                  </div>
                  <div className="text-xs text-white/75 leading-relaxed italic max-w-[65%] sm:max-w-[60%]">
                    {mod.desc}
                  </div>
                </div>
                <div className="relative z-10 flex flex-wrap gap-1.5 mt-4">
                  {mod.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-medium px-2.5 py-[3px] rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/15"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <ModuleIcon path={mod.icon} active={mod.available} />
              </>
            )

            const cardClass = `relative rounded-[20px] p-6 overflow-hidden min-h-[200px] flex flex-col justify-between bg-gradient-to-br ${mod.gradient} shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all duration-200`
            const cardStyle = { outline: '2px dashed rgba(150,7,7,0.3)', outlineOffset: '6px' }

            return mod.available ? (
              <Link key={mod.key} to={mod.href} data-tour={tourKey} className={`${cardClass} group hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)]`} style={cardStyle}>
                {CardInner}
              </Link>
            ) : (
              <div key={mod.key} data-tour={tourKey} className={cardClass} style={cardStyle}>
                {CardInner}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AdminPortal