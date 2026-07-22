import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { useAuth } from '../../context/AuthContext'
import { getAllStaff } from '../../api/staff'
import StaffList from './StaffList'
import StaffRegisterTab from './StaffRegisterTab'

const TABS = [
  { key: 'directory', label: 'Directory' },
  { key: 'register', label: 'Register' },
  { key: 'assignment', label: 'Staff Assignment' },
]

function AssignmentComingSoon() {
  return (
    <div className="bg-white rounded-xl shadow-sm py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      </div>
      <div className="text-sm font-bold text-navy mb-1">Staff Assignment — coming soon</div>
      <p className="text-xs text-gray-400 max-w-sm mx-auto">
        Assign form teachers to classes and teachers to subjects, all in one place.
        This is next on the roadmap for the staff module.
      </p>
    </div>
  )
}

function StaffTabs() {
  const { activeMember } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.some((t) => t.key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'directory'
  const setTab = (key) => setSearchParams(key === 'directory' ? {} : { tab: key })

  const { data } = useQuery({
    queryKey: ['all-staff-unfiltered'],
    queryFn: () => getAllStaff({}),
  })
  const totalCount = data?.data?.staff?.length || 0

  return (
    <div className="min-h-screen">
      <PortalHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
          <Link to="/admin" className="hover:text-navy transition">Dashboard</Link>
          <span className="text-gray-300">›</span>
          <span className="text-navy font-semibold">Teachers &amp; Staff</span>
        </div>

        <div className="mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">Teachers &amp; Staff</h1>
          <p className="text-sm text-gray-400 mt-1">
            {activeMember?.school_name} · {totalCount} staff member{totalCount !== 1 ? 's' : ''} on record
          </p>
        </div>

        <div className="flex items-center gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 sm:px-5 py-3 text-sm font-bold whitespace-nowrap border-b-2 -mb-px transition ${
                tab === t.key
                  ? 'text-navy border-navy'
                  : 'text-gray-400 border-transparent hover:text-navy'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'directory' && <StaffList embedded />}
        {tab === 'register' && <StaffRegisterTab />}
        {tab === 'assignment' && <AssignmentComingSoon />}
      </div>
    </div>
  )
}

export default StaffTabs