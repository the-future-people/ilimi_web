import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Joyride, STATUS } from 'react-joyride'
import PortalHeader from '../../components/layout/PortalHeader'
import { useAuth } from '../../context/AuthContext'
import { markTourSeen } from '../../api/auth'

import admissionsImg from '../../assets/domains/admissions.png'
import classroomImg from '../../assets/domains/classroom.png'
import assessmentImg from '../../assets/domains/assessment.png'
import reportingImg from '../../assets/domains/reporting.png'
import communicationsImg from '../../assets/domains/communications.png'
import libraryImg from '../../assets/domains/library.png'

const modules = [
  {
    key: 'students',
    title: 'Students & Admissions',
    desc: 'Enrol new students and manage existing records.',
    tags: ['Enrolment', 'Profiles', 'Classes'],
    gradient: 'from-[#1e40af] to-[#3b82f6]',
    image: admissionsImg,
    href: '/admin/students',
    available: true,
  },
  {
    key: 'staff',
    title: 'Teachers & Staff',
    desc: 'Manage teacher profiles, assignments and schedules.',
    tags: ['Profiles', 'Subjects', 'Timetable'],
    gradient: 'from-[#15803d] to-[#22c55e]',
    image: classroomImg,
    href: '/admin/staff',
    available: false,
  },
  {
    key: 'attendance',
    title: 'Attendance',
    desc: 'Take daily attendance and view historical records.',
    tags: ['Daily Roll', 'Reports', 'Alerts'],
    gradient: 'from-[#c2410c] to-[#f97316]',
    image: assessmentImg,
    available: false,
  },
  {
    key: 'fees',
    title: 'Fees & Finance',
    desc: 'Collect fees via Mobile Money and track payments.',
    tags: ['MoMo', 'Invoices', 'Reports'],
    gradient: 'from-[#7e22ce] to-[#a855f7]',
    image: reportingImg,
    available: false,
  },
  {
    key: 'communications',
    title: 'Communications',
    desc: 'Send SMS alerts to parents and broadcast announcements.',
    tags: ['SMS', 'Parents', 'Notices'],
    gradient: 'from-[#b45309] to-[#f59e0b]',
    image: communicationsImg,
    available: false,
  },
  {
    key: 'reports',
    title: 'Reports & Analytics',
    desc: 'Generate academic and financial reports across branches.',
    tags: ['Analytics', 'Exports', 'Branches'],
    gradient: 'from-[#0f766e] to-[#14b8a6]',
    image: libraryImg,
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
    content: "Start here to enrol your first students and manage existing records.",
    title: 'Students & Admissions',
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
    content: "Send SMS alerts to parents and broadcast announcements from here.",
    title: 'Communications',
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
    console.log('Joyride callback:', data)
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
        {/* Greeting */}
        <div className="mb-7">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Good to see you, {user?.first_name}.
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {activeMember?.school_name} · {activeMember?.role_display}
            {activeMember?.branch_name ? ` · ${activeMember.branch_name}` : ''}
          </p>
        </div>

        {/* Module grid */}
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

                <img
                  src={mod.image}
                  alt=""
                  className="absolute right-[-10px] bottom-[-10px] w-40 h-40 object-contain opacity-90 z-[2] pointer-events-none transition-transform duration-300 group-hover:scale-105 group-hover:translate-x-[-4px] group-hover:translate-y-[-4px]"
                />
              </>
            )

            const cardClass = `relative rounded-[20px] p-6 overflow-hidden min-h-[200px] flex flex-col justify-between bg-gradient-to-br ${mod.gradient} shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all duration-200`
            const cardStyle = { outline: '2px dashed rgba(150,7,7,0.3)', outlineOffset: '6px' }
            return mod.available ? (
              <Link key={mod.key} to={mod.href} data-tour={tourKey} className={`${cardClass} hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)]`} style={cardStyle}>
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