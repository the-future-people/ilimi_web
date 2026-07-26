import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { getGuardians, getGuardianDetail, updateGuardian } from '../../api/students'
import { API_BASE_URL } from '../../config'

const inputClass = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"

function initials(name) {
  return name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '—'
}

function GuardianSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [applied, setApplied] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['guardian-search', applied],
    queryFn: () => getGuardians({ search: applied }),
    enabled: applied.length > 1,
  })
  const results = data?.data?.guardians || []

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
      <div className="text-sm font-bold text-navy mb-1">Find a guardian</div>
      <p className="text-xs text-gray-400 mb-4">Search by name or phone number.</p>

      <div className="relative">
        <svg className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          autoFocus
          type="text"
          placeholder="e.g. Charity Boadu or 0554..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setApplied(e.target.value) }}
          className={`${inputClass} pl-9`}
        />
      </div>

      {isLoading && applied.length > 1 && <div className="text-center py-8 text-gray-400 text-sm">Searching...</div>}
      {!isLoading && applied.length > 1 && results.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">No guardians found.</div>
      )}

      {results.length > 0 && (
        <div className="mt-4 flex flex-col gap-1.5">
          {results.map((g) => (
            <button
              key={g.id}
              onClick={() => onSelect(g)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gold/50 hover:bg-gold/5 transition text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {initials(`${g.first_name} ${g.last_name}`)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-navy truncate">{g.first_name} {g.last_name}</div>
                <div className="text-xs text-gray-400 truncate">{g.phone}{g.relationship ? ` · ${g.relationship}` : ''}</div>
              </div>
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function GuardianDetail({ guardianId, onBack }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['guardian-detail', guardianId],
    queryFn: () => getGuardianDetail(guardianId),
  })
  const guardian = data?.data

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const startEditing = () => {
    setForm({
      phone: guardian.phone || '',
      whatsapp_number: guardian.whatsapp_number || '',
      email: guardian.email || '',
      residential_address: guardian.residential_address || '',
      employer: guardian.employer || '',
    })
    setError('')
    setSuccess('')
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await updateGuardian(guardianId, form)
      await queryClient.invalidateQueries({ queryKey: ['guardian-detail', guardianId] })
      setEditing(false)
      setSuccess(res.message || 'Updated.')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err) {
      const data = err.response?.data
      const fieldError = data?.errors && Object.values(data.errors)[0]?.[0]
      setError(fieldError || data?.message || 'Could not save changes.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
  }
  if (!guardian) {
    return <div className="text-center py-16 text-gray-400 text-sm">Guardian not found.</div>
  }

  const childCount = guardian.children?.length || 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition hover:opacity-90 flex-shrink-0"
          style={{ background: '#1a2b4a', color: '#c9a227' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Change guardian
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-navy text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
              {initials(`${guardian.first_name} ${guardian.last_name}`)}
            </div>
            <div>
              <div className="text-base font-bold text-navy">{guardian.first_name} {guardian.last_name}</div>
              <div className="text-xs text-gray-400">
                {childCount} linked child{childCount !== 1 ? 'ren' : ''}
                {guardian.relationship ? ` · ${guardian.relationship}` : ''}
              </div>
            </div>
          </div>
          {!editing && (
            <button
              onClick={startEditing}
              className="bg-navy text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-navy-light transition"
            >
              Edit Contact Details
            </button>
          )}
        </div>

        {success && (
          <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2.5 mb-4">{success}</div>
        )}

        {!editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            <InfoRow label="Phone" value={guardian.phone} />
            <InfoRow label="WhatsApp" value={guardian.whatsapp_number} />
            <InfoRow label="Email" value={guardian.email} />
            <InfoRow label="Employer" value={guardian.employer} />
            <InfoRow label="Address" value={guardian.residential_address} full />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              This person is linked to {childCount} child{childCount !== 1 ? 'ren' : ''}. Changes here update their contact details everywhere.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">WhatsApp Number</label>
                <input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Email</label>
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Employer</label>
                <input value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Residential Address</label>
                <textarea rows={2} value={form.residential_address} onChange={(e) => setForm({ ...form, residential_address: e.target.value })} className={inputClass} />
              </div>
            </div>

            {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">{error}</div>}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="bg-gray-100 text-gray-600 text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-gold text-navy text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-gold-light transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
        <div className="text-sm font-bold text-navy mb-3">Linked Children</div>
        {childCount === 0 ? (
          <div className="text-xs text-gray-400">No children linked to this guardian.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {guardian.children.map((child) => (
              <Link
                key={child.student_id}
                to={`/admin/students/${child.student_id}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gold/50 hover:bg-gold/5 transition"
              >
                <div className="w-9 h-9 rounded-lg bg-navy text-white text-[10px] font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                  {child.photo ? (
                    <img src={`${API_BASE_URL}${child.photo}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initials(child.full_name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-navy truncate">{child.full_name}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {child.student_number}{child.classroom_name ? ` · ${child.classroom_name}` : ''}
                  </div>
                </div>
                {child.is_primary && (
                  <span className="text-[10px] font-bold text-amber-700 bg-gold/15 px-2 py-0.5 rounded-full flex-shrink-0">Primary</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value, full }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm text-navy">{value || '—'}</div>
    </div>
  )
}

function GuardianManagement() {
  const [selectedId, setSelectedId] = useState(null)

  return (
    <div className="min-h-screen">
      <PortalHeader />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
          <Link to="/registrar" className="hover:text-navy transition">Dashboard</Link>
          <span className="text-gray-300">›</span>
          <span className="text-navy font-semibold">Guardian Management</span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mb-6">Guardian Management</h1>

        {!selectedId ? (
          <GuardianSearch onSelect={(g) => setSelectedId(g.id)} />
        ) : (
          <GuardianDetail guardianId={selectedId} onBack={() => setSelectedId(null)} />
        )}
      </div>
    </div>
  )
}

export default GuardianManagement