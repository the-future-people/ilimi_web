import { Link } from 'react-router-dom'
import PortalHeader from '../../components/layout/PortalHeader'
import { useAuth } from '../../context/AuthContext'

const modules = [
  {
    key: 'collect',
    title: 'Collect Payment',
    desc: 'Record a fee payment — pick the student, the fee, and the amount.',
    tags: ['MoMo', 'Cash', 'Bank'],
    gradient: 'from-[#7e22ce] to-[#a855f7]',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2m0-2c-1.11 0-2.08-.402-2.599-1M12 21a9 9 0 100-18 9 9 0 000 18z',
    href: '/accountant/collect',
    available: true,
  },
  {
    key: 'balances',
    title: 'Student Balances',
    desc: 'See who owes what, by class and by term, at a glance.',
    tags: ['Balances', 'By Class', 'Overdue'],
    gradient: 'from-[#1e40af] to-[#3b82f6]',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    href: '/accountant/balances',
    available: false,
  },
  {
    key: 'structures',
    title: 'Fee Structures',
    desc: 'Set what each class and term is charged — tuition, feeding, excursions.',
    tags: ['Tuition', 'Feeding', 'Excursions'],
    gradient: 'from-[#15803d] to-[#22c55e]',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    href: '/accountant/structures',
    available: false,
  },
  {
    key: 'history',
    title: 'Payment History',
    desc: 'Search and review every payment recorded, with receipts.',
    tags: ['Receipts', 'Search', 'Filters'],
    gradient: 'from-[#b45309] to-[#f59e0b]',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    href: '/accountant/history',
    available: false,
  },
  {
    key: 'installments',
    title: 'Installment Plans',
    desc: 'Set up and track fees paid in parts across a term.',
    tags: ['Plans', 'Schedules', 'Tracking'],
    gradient: 'from-[#c2410c] to-[#f97316]',
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z',
    href: '/accountant/installments',
    available: false,
  },
  {
    key: 'reconciliation',
    title: 'Reconciliation',
    desc: 'Daily and termly totals — confirm everything collected adds up.',
    tags: ['Daily', 'Termly', 'Totals'],
    gradient: 'from-[#0f766e] to-[#14b8a6]',
    icon: 'M9 17v-2a4 4 0 014-4h3m0 0l-3-3m3 3l-3 3M4 4h6l2 3h8a1 1 0 011 1v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z',
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
          @keyframes icon-pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.25); }
            50% { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
          }
          .animate-icon-pulse { animation: icon-pulse 2.2s ease-in-out infinite; }
        `}</style>
      )}
    </div>
  )
}

function AccountantPortal() {
  const { user, activeMember } = useAuth()

  return (
    <div className="min-h-screen">
      <PortalHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <div className="mb-7">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Good to see you, {user?.first_name}.
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {activeMember?.school_name} · {activeMember?.role_display}
            {activeMember?.is_lead ? ' · Main Accountant' : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          {modules.map((mod) => {
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

export default AccountantPortal