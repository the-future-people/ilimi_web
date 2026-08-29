import { Link, useSearchParams } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { useQuery } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { useAuth } from '../../context/AuthContext'
import { getAllStudents } from '../../api/students'
import StudentList from './StudentList'
import ClassesTab from './ClassesTab'
import AdmissionsTab from './AdmissionsTab'

const TABS = [
  { key: 'students', label: 'Students' },
  { key: 'classes', label: 'Classes' },
  { key: 'admissions', label: 'Admissions' },
]

function StudentsClassesAdmissions() {
  const { activeMember } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.some((t) => t.key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'students'
  const setTab = (key) => setSearchParams(key === 'students' ? {} : { tab: key })

  const { data } = useQuery({
    queryKey: ['all-students-unfiltered'],
    queryFn: () => getAllStudents({}),
  })
  const totalCount = data?.data?.students?.length || 0

  return (
    <div className="min-h-screen">
      <PortalHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <Breadcrumb items={[
          {
            label: 'Dashboard',
            href: dashboardPath(activeMember),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )
          },
          {
            label: 'Students, Classes & Admissions', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            )
          },
        ]} />

        {/* Header */}
     

        {/* Tabs */}
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

        {tab === 'classes' && <ClassesTab />}
        {tab === 'admissions' && <AdmissionsTab />}
      {tab === 'students' && <StudentList embedded />}
      </div>
    </div>
  )
}

export default StudentsClassesAdmissions