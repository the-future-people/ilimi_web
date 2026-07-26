import { Link } from 'react-router-dom'
import PortalHeader from '../../components/layout/PortalHeader'
import { useAuth } from '../../context/AuthContext'

const modules = [
  {
    key: 'students',
    title: 'Students, Classes & Admissions',
    desc: 'Enrol students, manage records, and review admissions.',
    tags: ['Enrolment', 'Records', 'Classes'],
    gradient: 'from-[#1e40af] to-[#3b82f6]',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
    href: '/admin/students',
    available: true,
  },
  {
    key: 'staff',
    title: 'Teachers & Staff',
    desc: 'Manage staff records and onboarding paperwork.',
    tags: ['Directory', 'Register', 'Records'],
    gradient: 'from-[#15803d] to-[#22c55e]',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    href: '/admin/staff',
    available: true,
  },
  {
    key: 'parents',
    title: 'Guardian Management',
    desc: 'Search parents and guardians, view linked children, update contact details.',
    tags: ['Search', 'Contacts', 'Siblings'],
    gradient: 'from-[#7e22ce] to-[#a855f7]',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    href: '/registrar/guardians',
    available: true,
  },
  {
    key: 'exams',
    title: 'Student & Exam Registration',
    desc: 'Build BECE and external exam candidate lists ready for submission.',
    tags: ['BECE', 'Candidates', 'Export'],
    gradient: 'from-[#b45309] to-[#f59e0b]',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    href: '/registrar/exam-registration',
    available: false,
  },
  {
    key: 'communications',
    title: 'Legal & Communications',
    desc: 'Compose messages and letters for admin approval before sending.',
    tags: ['Compose', 'Approval', 'Legal'],
    gradient: 'from-[#0f766e] to-[#14b8a6]',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    available: false,
  },
  {
    key: 'records',
    title: 'Records & Transfers',
    desc: 'Transfer and leaving certificates, incoming student records.',
    tags: ['Transfers', 'Certificates', 'Archive'],
    gradient: 'from-[#c2410c] to-[#f97316]',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    available: false,
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

function RegistrarPortal() {
  const { user, activeMember } = useAuth()

  return (
    <div className="min-h-screen">
      <PortalHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <div className="mb-7">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">Good to see you, {user?.first_name}.</h1>
          <p className="text-sm text-gray-400 mt-1">
            {activeMember?.school_name} · {activeMember?.role_display}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {modules.map((mod) => {
            const cardClass = `relative rounded-[20px] p-6 overflow-hidden min-h-[200px] flex flex-col justify-between bg-gradient-to-br ${mod.gradient} shadow-[0_4px_16px_rgba(0,0,0,0.1)] transition-all duration-200`
            const cardStyle = { outline: '2px dashed rgba(201,162,39,0.4)', outlineOffset: '6px' }
            const CardInner = (
              <>
                <div className="absolute right-[-20px] bottom-[-20px] w-[120px] h-[120px] rounded-full bg-white/[0.08]" />
                <div className="absolute right-10 bottom-[-40px] w-20 h-20 rounded-full bg-white/5" />
                <div className="relative z-10">
                  <div className="text-base sm:text-lg font-bold text-white leading-snug mb-2">{mod.title}</div>
                  <div className="text-xs text-white/75 leading-relaxed italic max-w-[65%] sm:max-w-[60%]">{mod.desc}</div>
                </div>
                <div className="relative z-10 flex flex-wrap gap-1.5 mt-4">
                  {mod.tags.map((tag) => (
                    <span key={tag} className="text-[11px] font-medium px-2.5 py-[3px] rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/15">{tag}</span>
                  ))}
                </div>
                <ModuleIcon path={mod.icon} active={mod.available} />
              </>
            )
            return mod.available ? (
              <Link key={mod.key} to={mod.href} className={`${cardClass} group hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.15)]`} style={cardStyle}>
                {CardInner}
              </Link>
            ) : (
              <div key={mod.key} className={cardClass} style={cardStyle}>
                {CardInner}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default RegistrarPortal