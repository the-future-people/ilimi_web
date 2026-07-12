import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { getAllStudents, bulkChangeStudentClass } from '../../api/students'
import { getSchoolClassrooms } from '../../api/academics'
import { useAuth } from '../../context/AuthContext'

const statusStyles = {
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  graduated: 'bg-blue-50 text-blue-700',
  withdrawn: 'bg-red-50 text-red-700',
  suspended: 'bg-amber-50 text-amber-700',
}

function StudentList() {
  const { activeMember } = useAuth()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '', classroom: '' })

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

  // Unfiltered — for stat counts
  const { data: allData } = useQuery({
    queryKey: ['all-students-unfiltered'],
    queryFn: () => getAllStudents({}),
  })
  const allStudents = allData?.data?.students || []
  const activeCount = allStudents.filter((s) => s.status === 'active').length
  const totalCount = allStudents.length

  // Filtered — for the actual list shown
  const { data, isLoading, isError } = useQuery({
    queryKey: ['students', appliedFilters],
    queryFn: () => getAllStudents({
      search: appliedFilters.search || undefined,
      status: appliedFilters.status || undefined,
      classroom: appliedFilters.classroom || undefined,
    }),
  })
  const students = data?.data?.students || []

  const handleFilter = () => {
    setAppliedFilters({ search, status: statusFilter, classroom: classFilter })
  }

  const initials = (name) => name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
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

  return (
    <div className="min-h-screen">
      <PortalHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
          <Link to="/admin" className="hover:text-navy transition">Dashboard</Link>
          <span className="text-gray-300">›</span>
          <span className="text-navy font-semibold">Students &amp; Admissions</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">Students &amp; Admissions</h1>
            <p className="text-sm text-gray-400 mt-1">
              {activeMember?.school_name} · {totalCount} student{totalCount !== 1 ? 's' : ''} on record
            </p>
          </div>
          <Link to="/admin/students/enrol" className="flex items-center gap-2 bg-navy text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-navy-light transition whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Enrol New Student
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold text-navy">{activeCount}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Active Students</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold text-navy">{totalCount}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Total Enrolled</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold text-navy">{classrooms.length}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Active Classes</div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="text-lg font-bold text-navy">{students.length}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide">Showing</div>
            </div>
          </div>
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

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="text-sm font-bold text-navy">Student Records</div>
            <div className="text-xs text-gray-400">{students.length} results</div>
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
                      <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Student</th>
                      <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Class</th>
                      <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Gender</th>
                      <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Enrolled</th>
                      <th className="p-3 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Status</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition ${selectedIds.includes(student.id) ? 'bg-gold/5' : ''}`}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(student.id)}
                            onChange={() => toggleSelect(student.id)}
                            className="w-4 h-4 accent-navy cursor-pointer"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-navy text-white text-[11px] font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                              {student.photo ? (
                                <img src={student.photo} alt="" className="w-full h-full object-cover" />
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
                        <td className="p-3 text-sm text-blue-600 font-medium">{student.classroom_name || '—'}</td>
                        <td className="p-3 text-sm text-gray-500">{student.gender}</td>
                        <td className="p-3 text-sm text-gray-500">{formatDate(student.enrollment_date)}</td>
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile stacked cards */}
             <div className="md:hidden flex flex-col divide-y divide-gray-50">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={`flex items-center gap-3 p-3.5 transition ${selectedIds.includes(student.id) ? 'bg-gold/5' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={() => toggleSelect(student.id)}
                      className="w-4 h-4 accent-navy cursor-pointer flex-shrink-0"
                    />
                    <Link to={`/admin/students/${student.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-navy text-white text-xs font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                      {student.photo ? (
                        <img src={student.photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initials(student.full_name)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-navy truncate">{student.full_name}</div>
                      <div className="text-xs text-gray-400">{student.student_id}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {student.classroom_name && (
                          <span className="text-[11px] text-blue-600 font-medium">{student.classroom_name}</span>
                        )}
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
                ))}
              </div>
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