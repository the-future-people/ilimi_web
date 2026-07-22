import { Link, useSearchParams } from 'react-router-dom'
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
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
          <Link to="/admin" className="hover:text-navy transition">Dashboard</Link>
          <span className="text-gray-300">›</span>
          <span className="text-navy font-semibold">Students, Classes &amp; Admissions</span>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Students, Classes &amp; Admissions
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {activeMember?.school_name} · {totalCount} student{totalCount !== 1 ? 's' : ''} on record
          </p>
        </div>

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