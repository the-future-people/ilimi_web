import { Link } from 'react-router-dom'

const ACTIONS = [
  {
    to: '/admin/students/enrol',
    title: 'Enrol New Student',
    description: 'Register a student directly, with guardians, photo and biometrics captured in one flow.',
    iconBg: 'bg-navy',
    iconColor: 'text-white',
    primary: true,
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    ),
  },
  {
    to: '/admin/students/onboarding',
    title: 'Onboarding Center',
    description: 'Review parent submissions awaiting approval and students still missing fingerprint capture.',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    ),
  },
  {
    to: '/admin/students/documents',
    title: 'Student Documentation',
    description: 'Generate admission letters, transcripts and other documents from your school templates.',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
]

function AdmissionsTab() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {ACTIONS.map((action) => (
        <Link
          key={action.to}
          to={action.to}
          className="bg-white rounded-xl p-5 shadow-sm border border-transparent hover:border-gray-200 hover:shadow-md transition group"
        >
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${action.iconBg}`}>
            <svg className={`w-5 h-5 ${action.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {action.icon}
            </svg>
          </div>
          <div className="text-sm font-bold text-navy mb-1.5 flex items-center gap-1.5">
            {action.title}
            <svg
              className="w-3.5 h-3.5 text-gray-300 group-hover:text-navy group-hover:translate-x-0.5 transition"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{action.description}</p>
        </Link>
      ))}
    </div>
  )
}

export default AdmissionsTab