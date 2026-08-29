import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { getStaffDetail } from '../../api/staff'
import { inviteStaff } from '../../api/staffAccess'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config'
import { dashboardPath } from '../../constants/permissions'

// Temporary. These should come from the school's own roles, so a school
// that renames Administrator sees its own wording â€” needs a roles endpoint.
const ROLE_OPTIONS = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'academics', label: 'Head of Academics' },
  { value: 'administrator', label: 'Administrator' },
  { value: 'accounts', label: 'Accounts Office' },
  { value: 'assistant_head', label: 'Assistant Head Teacher' },
  { value: 'proprietor', label: 'Proprietor' },
]

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null

const initialsOf = (name) =>
  (name || '').split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase()

const titleCase = (s) =>
  s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : null

function Icon({ d }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={d} />
    </svg>
  )
}

const ICONS = {
  phone: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  briefcase: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  id: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2',
  school: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
  bank: 'M4 10h16M4 10l8-6 8 6M6 10v8m4-8v8m4-8v8m4-8v8M4 18h16',
  urgent: 'M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.33 16a2 2 0 001.74 3z',
  key: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
}

function Card({ icon, title, children, empty }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3.5">
      <div className="flex items-center gap-1.5 mb-2.5 text-gray-500">
        <Icon d={icon} />
        <span className="text-[13px] font-semibold text-navy">{title}</span>
      </div>
      {empty ? (
        <div className="text-xs text-gray-400 py-1.5">{empty}</div>
      ) : (
        <table className="w-full text-xs">
          <tbody>{children}</tbody>
        </table>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <tr>
      <td className="text-gray-500 py-1 pr-3 align-top whitespace-nowrap">{label}</td>
      <td className={`py-1 text-right align-top ${value ? 'text-navy' : 'text-gray-400'}`}>
        {value || 'Not set'}
      </td>
    </tr>
  )
}

function PortalAccessPanel({ staff, onInvited }) {
  const [role, setRole] = useState('teacher')
  const [link, setLink] = useState('')
  const [error, setError] = useState('')
  const access = staff.portal_access || { status: 'none' }

  const mutation = useMutation({
    mutationFn: () => inviteStaff(staff.id, { role }),
    onSuccess: (res) => {
      setError('')
      setLink(res.data?.invite_url || '')
      onInvited()
    },
    onError: (err) => setError(err.response?.data?.message || 'Could not send the invite.'),
  })

  if (access.status === 'active') {
    return (
      <div className="bg-green-50 border-l-[3px] border-green-600 px-3.5 py-3 mb-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="text-green-700"><Icon d={ICONS.key} /></span>
          <div>
            <div className="text-[13px] font-semibold text-green-900">
              Portal access active Â· {access.role_display}
            </div>
            <div className="text-[11px] text-green-700 mt-0.5">Signs in with {access.email}</div>
          </div>
        </div>
      </div>
    )
  }

  const invited = access.status === 'invited'
  const expired = access.status === 'expired'

  return (
    <div className={`border-l-[3px] px-3.5 py-3 mb-2.5 ${
      invited ? 'bg-blue-50 border-blue-500' : 'bg-amber-50 border-amber-600'
    }`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className={invited ? 'text-blue-700' : 'text-amber-700'}><Icon d={ICONS.key} /></span>
          <div>
            <div className={`text-[13px] font-semibold ${invited ? 'text-blue-900' : 'text-amber-950'}`}>
              {invited
                ? 'Invite sent, waiting on them'
                : expired
                  ? 'Invite expired'
                  : 'No portal access'}
            </div>
            <div className={`text-[11px] mt-0.5 ${invited ? 'text-blue-700' : 'text-amber-800'}`}>
              {invited
                ? `Link expires ${fmtDate(access.expires_at)}`
                : expired
                  ? 'Send a new link to let them set up their account'
                  : 'They cannot log in or be assigned to classes yet'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!invited && (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="px-2.5 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-gold bg-white"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className={`text-[11px] font-bold text-white px-3.5 py-2 rounded-lg transition disabled:opacity-50 ${
              invited ? 'bg-blue-600 hover:bg-blue-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {mutation.isPending ? 'Sending...' : invited ? 'Resend link' : 'Give access'}
          </button>
        </div>
      </div>

      {error && <div className="text-[11px] text-red-700 mt-2">{error}</div>}

      {link && (
        <div className="mt-2.5 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Setup link â€” send this to them
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.target.select()}
              className="flex-1 text-[11px] text-navy bg-gray-50 border border-gray-200 rounded px-2 py-1.5 outline-none"
            />
            <button
              onClick={() => navigator.clipboard?.writeText(link)}
              className="text-[11px] font-semibold text-navy border border-gray-300 rounded px-2.5 py-1.5 hover:bg-gray-50 transition flex-shrink-0"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StaffDetail() {
  const { staffId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { activeMember } = useAuth()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['staff-detail', staffId],
    queryFn: () => getStaffDetail(staffId),
  })

  const staff = data?.data

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['staff-detail', staffId] })

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <PortalHeader />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8 text-center text-sm text-gray-400">
          Loading staff record...
        </div>
      </div>
    )
  }

  if (isError || !staff) {
    return (
      <div className="min-h-screen">
        <PortalHeader />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8 text-center">
          <div className="text-sm font-semibold text-navy mb-1">Staff member not found</div>
          <button
            onClick={() => navigate('/admin/staff')}
            className="text-xs font-semibold text-navy underline mt-2"
          >
            Back to staff
          </button>
        </div>
      </div>
    )
  }

  const subjects = staff.subject_specializations_display || []
  const hasBank = staff.bank_name || staff.bank_account_number || staff.momo_number
  const hasKin = staff.next_of_kin_name || (staff.emergency_contacts || []).length > 0

  return (
    <div className="min-h-screen">
      <PortalHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: dashboardPath(activeMember) },
            { label: 'Teachers & Staff', href: '/admin/staff' },
            { label: staff.full_name },
          ]}
        />

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-2.5 mt-4">
          <div className="flex items-start gap-3.5 flex-wrap">
            <div className="w-16 h-16 rounded-xl bg-navy flex items-center justify-center text-xl font-bold text-gold overflow-hidden flex-shrink-0">
            {staff.photo
                ? <img src={`${API_BASE_URL}${staff.photo}`} alt="" className="w-full h-full object-cover" />
                : initialsOf(staff.full_name)}
            </div>

            <div className="flex-1 min-w-[180px]">
              <div className="text-lg font-semibold text-navy">
                {titleCase(staff.title)} {staff.full_name}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {[staff.staff_id, titleCase(staff.staff_category), titleCase(staff.time_commitment)]
                  .filter(Boolean).join(' Â· ')}
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                  staff.status === 'active' ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {staff.status}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {titleCase(staff.employment_type)}
                </span>
                {subjects.map((s) => (
                  <span key={s.id} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <PortalAccessPanel staff={staff} onInvited={refresh} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          <Card icon={ICONS.phone} title="Contact">
            <Row label="Phone" value={staff.phone} />
            <Row label="WhatsApp" value={staff.whatsapp_number} />
            <Row label="Other phone" value={staff.secondary_phone} />
            <Row label="Email" value={staff.email} />
            <Row label="Address" value={staff.residential_address} />
            <Row label="Digital address" value={staff.digital_address} />
            <Row label="City" value={staff.city} />
            <Row label="Region" value={titleCase(staff.region)} />
          </Card>

          <Card icon={ICONS.briefcase} title="Employment">
            <Row label="Joined school" value={fmtDate(staff.date_joined_school)} />
            <Row label="First appointed" value={fmtDate(staff.date_of_first_appointment)} />
            <Row label="Position" value={staff.position_name} />
            <Row label="Salary grade" value={staff.salary_grade} />
            <Row label="Branch" value={staff.branch_name} />
            <Row label="On probation" value={staff.is_on_probation ? 'Yes' : 'No'} />
            <Row
              label="Leave remaining"
              value={`${staff.leave_days_remaining} of ${staff.leave_entitlement_days} days`}
            />
          </Card>

          <Card icon={ICONS.id} title="Identity">
            <Row label="Date of birth" value={fmtDate(staff.date_of_birth)} />
            <Row label="Gender" value={titleCase(staff.gender)} />
            <Row label="Nationality" value={staff.nationality} />
            <Row label="Marital status" value={titleCase(staff.marital_status)} />
            <Row label="Ghana Card" value={staff.ghana_card_number} />
            <Row label="SSNIT" value={staff.ssnit_number} />
            <Row label="NTC licence" value={staff.ntc_license_number} />
            <Row label="Blood group" value={staff.blood_group} />
          </Card>

          <Card icon={ICONS.school} title="Qualifications">
            <Row label="Highest" value={titleCase(staff.highest_qualification)} />
            <Row label="Institution" value={staff.institution_attended} />
            <Row label="Experience" value={`${staff.years_of_experience || 0} years`} />
            <Row
              label="Subjects"
              value={subjects.length ? subjects.map((s) => s.name).join(', ') : null}
            />
          </Card>

          <Card
            icon={ICONS.bank}
            title="Payment"
            empty={!hasBank ? 'No bank or mobile money details recorded.' : null}
          >
            <Row label="Bank" value={titleCase(staff.bank_name)} />
            <Row label="Branch" value={staff.bank_branch} />
            <Row label="Account number" value={staff.bank_account_number} />
            <Row label="Mobile money" value={staff.momo_number} />
          </Card>

          <Card
            icon={ICONS.urgent}
            title="Next of kin and emergency"
            empty={!hasKin ? 'No next of kin or emergency contact recorded.' : null}
          >
            <Row label="Next of kin" value={staff.next_of_kin_name} />
            <Row label="Relationship" value={staff.next_of_kin_relationship} />
            <Row label="Phone" value={staff.next_of_kin_phone} />
            <Row label="Address" value={staff.next_of_kin_address} />
            {(staff.emergency_contacts || []).map((c) => (
              <Row
                key={c.id}
                label={`${c.full_name}${c.is_primary ? ' (primary)' : ''}`}
                value={`${c.relationship} Â· ${c.phone}`}
              />
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default StaffDetail
