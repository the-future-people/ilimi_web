import { Link, useSearchParams } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { useQuery } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { useAuth } from '../../context/AuthContext'
import { getAllStaff } from '../../api/staff'
import StaffList from './StaffList'
import StaffRegisterTab from './StaffRegisterTab'
import AssignmentTab from './AssignmentTab'

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
        <Breadcrumb items={[
          {
            label: 'Dashboard',
            href: activeMember?.role === 'registrar' ? '/registrar' : activeMember?.role === 'accountant' ? '/accountant' : '/admin',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )
          },
          {
            label: 'Teachers & Staff', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )
          },
        ]} />

        

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
        {tab === 'assignment' && <AssignmentTab />}
      </div>
    </div>
  )
}

export default StaffTabs