import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { useQuery } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { getAllStaff } from '../../api/staff'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config'

const STATUS_STYLES = {
  active: 'bg-green-50 text-green-700',
  on_leave: 'bg-amber-50 text-amber-700',
  suspended: 'bg-red-50 text-red-700',
  terminated: 'bg-gray-100 text-gray-500',
  resigned: 'bg-gray-100 text-gray-500',
  retired: 'bg-blue-50 text-blue-700',
  deceased: 'bg-gray-100 text-gray-500',
}

const CATEGORY_LABELS = {
  teaching: 'Teaching',
  non_teaching: 'Non-Teaching',
  support: 'Support',
  management: 'Management',
}

const BADGE_LABELS = {
  award: 'Award',
  commendation: 'Commendation',
}

const CATEGORY_ORDER = ['teaching', 'non_teaching', 'support', 'management', 'unspecified']

const PAGE_SIZE = 20

function titleLabel(title) {
  const map = { mr: 'Mr. ', mrs: 'Mrs. ', miss: 'Miss ', madam: 'Madam ', dr: 'Dr. ', prof: 'Prof. ', rev: 'Rev. ', pastor: 'Pastor ', alhaji: 'Alhaji ', hajia: 'Hajia ', hon: 'Hon. ' }
  return map[title] || ''
}

function StaffCard({ member }) {
  const initials = (name) => name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '—'
  const waNumber = (member.whatsapp_number || member.phone || '').replace(/[^\d]/g, '')

  return (
    <Link
      to={`/admin/staff/${member.id}`}
      className="relative flex flex-col gap-3 p-4 rounded-2xl border-2 border-dashed border-gold/40 bg-white hover:shadow-md hover:border-gold/70 transition"
    >
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-xl bg-navy text-white text-base font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
          {member.photo ? (
            <img src={`${API_BASE_URL}${member.photo}`} alt="" className="w-full h-full object-cover" />
          ) : (
            initials(member.full_name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            to={`/admin/staff/${member.id}`}
            className="text-sm font-bold text-navy truncate hover:text-gold transition block"
          >
            {titleLabel(member.title)}{member.full_name}
          </Link>
          <div className="text-xs text-gray-400">
            {member.years_of_experience ? `${member.years_of_experience} yr${member.years_of_experience !== 1 ? 's' : ''} experience` : 'Experience not set'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            {member.position_name || 'No position set'}{member.branch_name ? ` Â· ${member.branch_name}` : ''}
          </div>
          <div className="text-xs text-gray-500 mt-0.5 truncate">{member.phone}</div>
          {member.email && (
            <div className="text-xs text-gray-400 truncate">{member.email}</div>
          )}
        </div>
        {waNumber && (
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 hover:bg-green-100 transition"
            title="Message on WhatsApp"
          >
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12.001 2C6.478 2 2 6.478 2 12c0 1.85.505 3.583 1.383 5.07L2 22l5.056-1.362A9.955 9.955 0 0012.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.176a8.157 8.157 0 01-4.15-1.135l-.298-.177-3.007.81.81-2.938-.194-.303A8.15 8.15 0 013.826 12c0-4.508 3.667-8.176 8.175-8.176 4.508 0 8.175 3.668 8.175 8.176 0 4.508-3.667 8.176-8.175 8.176z" />
            </svg>
          </a>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {member.staff_category && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-navy/5 text-navy capitalize">
            {CATEGORY_LABELS[member.staff_category] || member.staff_category}
          </span>
        )}
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          member.time_commitment === 'part_time' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {member.time_commitment === 'part_time' ? 'Part-Time' : 'Full-Time'}
        </span>
        {member.employment_type && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
            {member.employment_type.replace('_', ' ')}
          </span>
        )}
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[member.status] || 'bg-gray-100 text-gray-500'}`}>
          {member.status?.replace('_', ' ')}
        </span>
      </div>

      {member.badges?.length > 0 && (
        <div className="pt-3 border-t border-dashed border-indigo-200 bg-indigo-50 -mx-4 -mb-4 px-4 pb-4 rounded-b-2xl">
          <div className="flex flex-wrap gap-2 pt-1">
            {member.badges.map((badgeType) => (
              <div
                key={badgeType}
                className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-lg px-2 py-1.5"
                title={BADGE_LABELS[badgeType]}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-navy" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l2.4 6.6L21 9l-5 4.4L17.4 21 12 17.3 6.6 21 8 13.4 3 9l6.6-.4L12 2z" />
                  </svg>
                </div>
                <span className="text-[10px] font-semibold text-navy">{BADGE_LABELS[badgeType]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Link>
  )
}

function StaffList({ embedded = false }) {
  const { activeMember } = useAuth()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [appliedFilters, setAppliedFilters] = useState({ search: '', status: '', staff_category: '' })
  const [page, setPage] = useState(1)

  const { data: allData } = useQuery({
    queryKey: ['all-staff-unfiltered'],
    queryFn: () => getAllStaff({}),
  })
  const allStaff = allData?.data?.staff || []
  const activeCount = allStaff.filter((s) => s.status === 'active').length
  const totalCount = allStaff.length
  const onLeaveCount = allStaff.filter((s) => s.status === 'on_leave').length

  const { data, isLoading, isError } = useQuery({
    queryKey: ['staff', appliedFilters, page],
    queryFn: () => getAllStaff({
      search: appliedFilters.search || undefined,
      status: appliedFilters.status || undefined,
      staff_category: appliedFilters.staff_category || undefined,
      page,
      page_size: PAGE_SIZE,
    }),
  })
  const staff = data?.data?.staff || []
  const totalPages = data?.data?.total_pages || 0
  const hasNext = data?.data?.has_next || false
  const hasPrevious = data?.data?.has_previous || false

  const groups = useMemo(() => {
    const byCategory = {}
    for (const member of staff) {
      const key = member.staff_category || 'unspecified'
      if (!byCategory[key]) byCategory[key] = []
      byCategory[key].push(member)
    }
    return CATEGORY_ORDER
      .filter((key) => byCategory[key]?.length)
      .map((key) => ({
        key,
        label: key === 'unspecified' ? 'Unspecified' : CATEGORY_LABELS[key],
        members: byCategory[key],
      }))
  }, [staff])

  const handleFilter = () => {
    setPage(1)
    setAppliedFilters({ search, status: statusFilter, staff_category: categoryFilter })
  }

  const pageNumbers = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const nums = new Set([1, totalPages, page, page - 1, page + 1])
    return Array.from(nums).filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
  })()

  return (
    <div className={embedded ? '' : 'min-h-screen'}>
      {!embedded && <PortalHeader />}

      <div className={embedded ? '' : 'max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8'}>
        {!embedded && (
          <>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
              <Link to="/admin" className="hover:text-navy transition">Dashboard</Link>
              <span className="text-gray-300">—º</span>
              <span className="text-navy font-semibold">Teachers &amp; Staff</span>
            </div>

            <div className="mb-6">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">Teachers &amp; Staff</h1>
              <p className="text-sm text-gray-400 mt-1">
                {activeMember?.school_name} Â· {totalCount} staff member{totalCount !== 1 ? 's' : ''} on record
              </p>
            </div>
          </>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-navy">{activeCount}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Active Staff</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-navy">{totalCount}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Total Staff</div>
            </div>
          </div>
          <div
            onClick={() => { setStatusFilter('on_leave'); setAppliedFilters((f) => ({ ...f, status: 'on_leave' })); setPage(1) }}
            className={`bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm cursor-pointer border transition hover:shadow-md ${
              appliedFilters.status === 'on_leave' ? 'border-gold ring-1 ring-gold/30' : 'border-transparent'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-navy">{onLeaveCount}</div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">On Leave</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <svg className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, staff ID, or phone..."
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
              <option value="on_leave">On Leave</option>
              <option value="suspended">Suspended</option>
              <option value="terminated">Terminated</option>
              <option value="resigned">Resigned</option>
              <option value="retired">Retired</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold bg-white"
            >
              <option value="">All Categories</option>
              <option value="teaching">Teaching</option>
              <option value="non_teaching">Non-Teaching</option>
              <option value="support">Support</option>
              <option value="management">Management</option>
            </select>
            <button
              onClick={handleFilter}
              className="bg-navy text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-navy-light transition whitespace-nowrap"
            >
              Filter
            </button>
          </div>
        </div>

        {isLoading && <div className="text-center py-14 text-gray-400 text-sm">Loading staff...</div>}
        {isError && <div className="text-center py-14 text-red-500 text-sm">Failed to load staff.</div>}
        {!isLoading && staff.length === 0 && (
          <div className="text-center py-14 text-gray-400 text-sm bg-white rounded-xl shadow-sm">No staff found.</div>
        )}

        {!isLoading && groups.length > 0 && (
          <div className="flex flex-col gap-8">
            {groups.map((group) => (
              <div key={group.key}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-sm font-bold text-navy">{group.label}</div>
                  <div className="text-xs text-gray-400">{group.members.length} staff</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.members.map((member) => (
                    <StaffCard key={member.id} member={member} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 p-4 mt-4 bg-white rounded-xl shadow-sm">
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
      </div>
    </div>
  )
}

export default StaffList