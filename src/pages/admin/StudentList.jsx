import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { getAllStudents, bulkChangeStudentClass } from '../../api/students'
import { getSchoolClassrooms } from '../../api/academics'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config'

const statusStyles = {
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  graduated: 'bg-blue-50 text-blue-700',
  withdrawn: 'bg-red-50 text-red-700',
  suspended: 'bg-amber-50 text-amber-700',
}

const PAGE_SIZE = 15

function StatCard({ icon, iconBg, iconColor, value, label, onClick, active }) {
  const clickable = typeof onClick === 'function'
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border transition ${
        clickable ? 'cursor-pointer hover:shadow-md hover:border-gray-200' : ''
      } ${active ? 'border-gold ring-1 ring-gold/30' : 'border-transparent'}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <div>
        <div className="text-xl font-bold text-navy leading-tight">{value}</div>
        <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">{label}</div>
      </div>
    </div>
  )
}

function StudentRow({ student, selected, onToggle }) {
  const initials = (name) => name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '—'

  return (
    <tr className={`border-b border-gray-50 hover:bg-gray-50/50 transition ${selected ? 'bg-gold/5' : ''}`}>
      <td className="p-3">
        <input type="checkbox" checked={selected} onChange={onToggle} className="w-4 h-4 accent-navy cursor-pointer" />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-navy text-white text-[11px] font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
            {student.photo ? (
              <img src={`${API_BASE_URL}${student.photo}`} alt="" className="w-full h-full object-cover" />
            ) : (
              initials(student.full_name)
            )}
          </div>
          <div>
            <div className="text-sm font-semibold text-navy">{student.full_name}</div>
            <div className="text-xs text-gray-400">{student.student_id}</div>
          </div>
        </div>
      </td>
      <td className="p-3">
        {student.primary_guardian_name ? (
          <div>
            <div className="text-sm text-navy font-medium">{student.primary_guardian_name}</div>
            <div className="text-xs text-gray-400">{student.primary_guardian_phone || '—'}</div>
          </div>
        ) : (
          <span className="text-sm text-gray-300">No guardian on file</span>
        )}
      </td>
      <td className="p-3 text-sm text-gray-500">{student.gender}</td>
      <td className="p-3">
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusStyles[student.status] || 'bg-gray-100 text-gray-500'}`}>
          {student.status}
        </span>
      </td>
      <td className="p-3 text-right">
        <Link
          to={`/admin/students/${student.id}`}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </Link>
      </td>
    </tr>
  )
}

function StudentMobileCard({ student, selected, onToggle }) {
  const initials = (name) => name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '—'

  return (
    <div className={`flex items-center gap-3 p-3.5 transition ${selected ? 'bg-gold/5' : ''}`}>
      <input type="checkbox" checked={selected} onChange={onToggle} className="w-4 h-4 accent-navy cursor-pointer flex-shrink-0" />
      <Link to={`/admin/students/${student.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-navy text-white text-xs font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
          {student.photo ? (
            <img src={`${API_BASE_URL}${student.photo}`} alt="" className="w-full h-full object-cover" />
          ) : (
            initials(student.full_name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-navy truncate">{student.full_name}</div>
          <div className="text-xs text-gray-400">{student.student_id}</div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {student.primary_guardian_name && (
              <span className="text-[11px] text-gray-500">{student.primary_guardian_name} Â· {student.primary_guardian_phone}</span>
            )}
          </div>
          <div className="mt-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyles[student.status] || 'bg-gray-100 text-gray-500'}`}>
              {student.status}
            </span>
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}

function GroupHeader({ label, count }) {
  return (
    <tr>
      <td colSpan={6} className="px-3 pt-5 pb-2 bg-gray-50/80 border-y-2 border-navy/10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-navy">{label}</span>
          <span className="text-[11px] text-gray-400 font-semibold">{count} student{count !== 1 ? 's' : ''}</span>
        </div>
      </td>
    </tr>
  )
}

function GroupHeaderMobile({ label, count }) {
  return (
    <div className="px-3.5 pt-4 pb-2 bg-gray-50/80 border-y-2 border-navy/10">
      <span className="text-sm font-bold text-navy">{label}</span>
      <span className="text-[11px] text-gray-400 font-semibold ml-2">{count} student{count !== 1 ? 's' : ''}</span>
    </div>
  )
}

function StudentList({ embedded = false }) {
  const { activeMember } = useAuth()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '', classroom: '' })
  const [viewMode, setViewMode] = useState('all') // 'all' | 'unassigned'
  const [page, setPage] = useState(1)
  const [sortDir, setSortDir] = useState('asc')

  const [selectedIds, setSelectedIds] = useState([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkClassroom, setBulkClassroom] = useState('')
  const [bulkRemarks, setBulkRemarks] = useState('')
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkError, setBulkError] = useState('')
  const [bulkSuccess, setBulkSuccess] = useState('')

  const { data: classroomsData } = useQuery({
    queryKey: ['school-classrooms'],
    queryFn: getSchoolClassrooms,
  })
  const classrooms = classroomsData?.data?.classrooms || []

  // Unfiltered — for stat counts (also gives us the unassigned count for free)
  const { data: allData } = useQuery({
    queryKey: ['all-students-unfiltered'],
    queryFn: () => getAllStudents({}),
  })
  const allStudents = allData?.data?.students || []
  const activeCount = allStudents.filter((s) => s.status === 'active').length
  const totalCount = allStudents.length
  const unassignedCount = allStudents.filter((s) => !s.current_class_id).length

  const isGrouped = viewMode === 'all' && !appliedFilters.search

  // Main paginated/filtered list
  const { data, isLoading, isError } = useQuery({
    queryKey: ['students', appliedFilters, viewMode, page, sortDir],
    queryFn: () => getAllStudents({
      search: appliedFilters.search || undefined,
      status: appliedFilters.status || undefined,
      classroom: appliedFilters.classroom || undefined,
      unassigned: viewMode === 'unassigned' ? 'true' : undefined,
      exclude_unassigned: viewMode === 'all' ? 'true' : undefined,
      page,
      page_size: PAGE_SIZE,
      sort_dir: sortDir,
    }),
  })
  const students = data?.data?.students || []
  const totalPages = data?.data?.total_pages || 0
  const hasNext = data?.data?.has_next || false
  const hasPrevious = data?.data?.has_previous || false
  const resultCount = data?.data?.count || 0

  // Build grouped segments from the current page's rows, in order.
  // Groups can repeat across page boundaries by design — no cross-page stitching.
  const groups = useMemo(() => {
    if (!isGrouped) return null
    const segments = []
    let current = null
    for (const student of students) {
      const key = student.current_class_id
      if (!current || current.key !== key) {
        current = { key, label: student.classroom_name, students: [] }
        segments.push(current)
      }
      current.students.push(student)
    }
    return segments
  }, [students, isGrouped])

  const handleFilter = () => {
    setPage(1)
    setAppliedFilters({ search, status: statusFilter, classroom: classFilter })
  }

  const toggleSort = () => {
    setPage(1)
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
  }

  const goToUnassigned = () => {
    setViewMode('unassigned')
    setPage(1)
    setSelectedIds([])
  }

  const goToAll = () => {
    setViewMode('all')
    setPage(1)
    setSelectedIds([])
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(students.map((s) => s.id))
    }
  }

  const clearSelection = () => setSelectedIds([])

  const handleBulkAssign = async () => {
    if (!bulkClassroom) {
      setBulkError('Please select a class.')
      return
    }
    setBulkSubmitting(true)
    setBulkError('')
    try {
      const res = await bulkChangeStudentClass({
        student_ids: selectedIds,
        classroom_id: bulkClassroom,
        remarks: bulkRemarks,
      })
      setBulkSuccess(res.data?.message || res.message || 'Students reassigned successfully.')
      await queryClient.invalidateQueries({ queryKey: ['students'] })
      await queryClient.invalidateQueries({ queryKey: ['all-students-unfiltered'] })
      setSelectedIds([])
      setShowBulkModal(false)
      setBulkClassroom('')
      setBulkRemarks('')
      setTimeout(() => setBulkSuccess(''), 4000)
    } catch (err) {
      setBulkError(err.response?.data?.message || 'Failed to reassign students.')
    } finally {
      setBulkSubmitting(false)
    }
  }

  // Build a compact page-number list with ellipsis for large page counts
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const nums = new Set([1, totalPages, page, page - 1, page + 1])
    return Array.from(nums).filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
  }, [totalPages, page])

  return (
    <div className={embedded ? '' : 'min-h-screen'}>
      {!embedded && <PortalHeader />}

      <div className={embedded ? '' : 'max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8'}>
        {!embedded && (
          <>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
              <Link to="/admin" className="hover:text-navy transition">Dashboard</Link>
              <span className="text-gray-300">—º</span>
              <span className="text-navy font-semibold">Students &amp; Admissions</span>
            </div>

            {/* Header */}
            <div className="mb-6">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">Students &amp; Admissions</h1>
              <p className="text-sm text-gray-400 mt-1">
                {activeMember?.school_name} Â· {totalCount} student{totalCount !== 1 ? 's' : ''} on record
              </p>
            </div>
          </>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            value={activeCount}
            label="Active Students"
            iconBg="bg-blue-50" iconColor="text-blue-600"
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
          />
          <StatCard
            value={totalCount}
            label="Total Enrolled"
            iconBg="bg-green-50" iconColor="text-green-600"
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
          />
          <StatCard
            value={classrooms.length}
            label="Active Classes"
            iconBg="bg-purple-50" iconColor="text-purple-600"
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />}
          />
          <StatCard
            value={unassignedCount}
            label="Unassigned Students"
            iconBg="bg-amber-50" iconColor="text-amber-600"
            active={viewMode === 'unassigned'}
            onClick={viewMode === 'unassigned' ? goToAll : goToUnassigned}
            icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />}
          />
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-xl p-3 sm:p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <svg className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or student ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold bg-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="suspended">Suspended</option>
            </select>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold bg-white"
            >
              <option value="">All Classes</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
            <button
              onClick={handleFilter}
              className="bg-navy text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-navy-light transition whitespace-nowrap"
            >
              Filter
            </button>
          </div>
        </div>

        {viewMode === 'unassigned' && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
            <div className="text-sm text-amber-800 font-semibold">
              Showing students admitted but not yet placed in a class.
            </div>
            <button onClick={goToAll} className="text-xs font-bold text-amber-700 hover:underline whitespace-nowrap">
              Back to all students
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="text-sm font-bold text-navy">Student Records</div>
            <div className="text-xs text-gray-400">{resultCount} results</div>
          </div>

          {isLoading && <div className="text-center py-14 text-gray-400 text-sm">Loading students...</div>}
          {isError && <div className="text-center py-14 text-red-500 text-sm">Failed to load students.</div>}
          {!isLoading && students.length === 0 && (
            <div className="text-center py-14 text-gray-400 text-sm">No students found.</div>
          )}

          {!isLoading && students.length > 0 && (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-100">
                      <th className="p-3 w-10">
                        <input
                          type="checkbox"
                          checked={students.length > 0 && selectedIds.length === students.length}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 accent-navy cursor-pointer"
                        />
                      </th>
                      <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        <button onClick={toggleSort} className="flex items-center gap-1 hover:text-navy transition">
                          Student
                          <svg className={`w-3 h-3 transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </th>
                      <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Guardian Contact</th>
                      <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Gender</th>
                      <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Status</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {isGrouped ? (
                      groups.map((group) => (
                        <>
                          <GroupHeader key={`h-${group.key}-${group.students[0].id}`} label={group.label} count={group.students.length} />
                          {group.students.map((student) => (
                            <StudentRow
                              key={student.id}
                              student={student}
                              selected={selectedIds.includes(student.id)}
                              onToggle={() => toggleSelect(student.id)}
                            />
                          ))}
                        </>
                      ))
                    ) : (
                      students.map((student) => (
                        <StudentRow
                          key={student.id}
                          student={student}
                          selected={selectedIds.includes(student.id)}
                          onToggle={() => toggleSelect(student.id)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile stacked cards */}
              <div className="md:hidden flex flex-col divide-y divide-gray-50">
                {isGrouped ? (
                  groups.map((group) => (
                    <div key={`m-${group.key}-${group.students[0].id}`}>
                      <GroupHeaderMobile label={group.label} count={group.students.length} />
                      <div className="flex flex-col divide-y divide-gray-50">
                        {group.students.map((student) => (
                          <StudentMobileCard
                            key={student.id}
                            student={student}
                            selected={selectedIds.includes(student.id)}
                            onToggle={() => toggleSelect(student.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  students.map((student) => (
                    <StudentMobileCard
                      key={student.id}
                      student={student}
                      selected={selectedIds.includes(student.id)}
                      onToggle={() => toggleSelect(student.id)}
                    />
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 p-4 border-t border-gray-100">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!hasPrevious}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>

                  {pageNumbers.map((n, i) => (
                    <span key={n} className="flex items-center">
                      {i > 0 && pageNumbers[i - 1] !== n - 1 && (
                        <span className="text-xs text-gray-300 px-1">Â·Â·Â·</span>
                      )}
                      <button
                        onClick={() => setPage(n)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                          n === page ? 'bg-navy text-white' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {n}
                      </button>
                    </span>
                  ))}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={!hasNext}
                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    Next
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating bulk action bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-navy rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-4 z-50 max-w-[90vw]">
          <span className="text-sm text-white font-semibold whitespace-nowrap">
            {selectedIds.length} student{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="w-px h-5 bg-white/15 flex-shrink-0" />
          <button
            onClick={() => setShowBulkModal(true)}
            className="text-sm font-bold text-navy bg-gold px-4 py-2 rounded-lg hover:bg-gold-light transition whitespace-nowrap"
          >
            Assign to Class
          </button>
          <button
            onClick={clearSelection}
            className="text-white/50 hover:text-white transition flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Bulk assign modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !bulkSubmitting && setShowBulkModal(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg font-bold text-navy mb-1">Assign to Class</div>
            <div className="text-xs text-gray-400 mb-4">
              Moving {selectedIds.length} student{selectedIds.length !== 1 ? 's' : ''} to a new class
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Class</label>
                <select
                  value={bulkClassroom}
                  onChange={(e) => setBulkClassroom(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
                >
                  <option value="">Select a class...</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Remarks (optional)</label>
                <textarea
                  rows={2}
                  value={bulkRemarks}
                  onChange={(e) => setBulkRemarks(e.target.value)}
                  placeholder="e.g. End of term promotion..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
                />
              </div>

              {bulkError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {bulkError}
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setShowBulkModal(false)}
                  disabled={bulkSubmitting}
                  className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2.5 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAssign}
                  disabled={bulkSubmitting}
                  className="flex-1 bg-navy text-white text-sm font-bold py-2.5 rounded-lg hover:bg-navy-light transition disabled:opacity-50"
                >
                  {bulkSubmitting ? 'Assigning...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {bulkSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg z-50">
          {bulkSuccess}
        </div>
      )}
    </div>
  )
}

export default StudentList