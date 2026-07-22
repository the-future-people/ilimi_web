import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { getSchoolClassrooms } from '../../api/academics'
import {
  getAllStudents, createEnrolmentInvite, getEnrolmentInvites,
  approveEnrolmentInvite, rejectEnrolmentInvite,
} from '../../api/students'
import { API_BASE_URL } from '../../config'
import { ADMISSIONS_TAB } from '../../constants/nav'

const inputClass = "px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function initials(name) {
  return name ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : '—'
}

export default function OnboardingCenter() {
  const queryClient = useQueryClient()

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteFirstName, setInviteFirstName] = useState('')
  const [inviteLastName, setInviteLastName] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteResult, setInviteResult] = useState(null)

  const [reviewInvite, setReviewInvite] = useState(null)
  const [reviewClassroom, setReviewClassroom] = useState('')
  const [reviewRemarks, setReviewRemarks] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')

  const { data: invitesData, isLoading: invitesLoading } = useQuery({
    queryKey: ['enrolment-invites', 'submitted'],
    queryFn: () => getEnrolmentInvites({ status: 'submitted' }),
  })
  const pendingInvites = invitesData?.data?.invites || []

  const { data: fingerprintData, isLoading: fingerprintLoading } = useQuery({
    queryKey: ['students-missing-fingerprint'],
    queryFn: () => getAllStudents({ missing_fingerprint: 'true', page_size: 50, status: 'active' }),
  })
  const awaitingFingerprint = fingerprintData?.data?.students || []
  const awaitingFingerprintTotal = fingerprintData?.data?.count || 0

  const { data: classroomsData } = useQuery({
    queryKey: ['school-classrooms'],
    queryFn: getSchoolClassrooms,
  })
  const classrooms = classroomsData?.data?.classrooms || []

  const resetInviteModal = () => {
    setInviteFirstName('')
    setInviteLastName('')
    setInvitePhone('')
    setInviteError('')
    setInviteResult(null)
  }

  const closeInviteModal = () => {
    setShowInviteModal(false)
    resetInviteModal()
  }

  const handleCreateInvite = async () => {
    if (!inviteFirstName.trim() || !inviteLastName.trim() || !invitePhone.trim()) {
      setInviteError('All fields are required.')
      return
    }
    setInviteLoading(true)
    setInviteError('')
    try {
      const res = await createEnrolmentInvite({
        prospective_first_name: inviteFirstName,
        prospective_last_name: inviteLastName,
        parent_phone: invitePhone,
      })
      setInviteResult(res.data || res)
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Failed to create invite.')
    } finally {
      setInviteLoading(false)
    }
  }

  const inviteLink = inviteResult ? `${window.location.origin}/enrol/${inviteResult.token}` : ''

  const openReview = (invite) => {
    setReviewInvite(invite)
    setReviewClassroom('')
    setReviewRemarks('')
    setReviewError('')
  }
  const closeReview = () => setReviewInvite(null)

  const handleApprove = async () => {
    setReviewLoading(true)
    setReviewError('')
    try {
      const overrides = reviewClassroom ? { current_class: reviewClassroom } : {}
      await approveEnrolmentInvite(reviewInvite.id, overrides)
      await queryClient.invalidateQueries({ queryKey: ['enrolment-invites'] })
      await queryClient.invalidateQueries({ queryKey: ['students-missing-fingerprint'] })
      await queryClient.invalidateQueries({ queryKey: ['all-students-unfiltered'] })
      closeReview()
    } catch (err) {
      setReviewError(err.response?.data?.message || JSON.stringify(err.response?.data?.errors || 'Failed to approve.'))
    } finally {
      setReviewLoading(false)
    }
  }

  const handleReject = async () => {
    setReviewLoading(true)
    setReviewError('')
    try {
      await rejectEnrolmentInvite(reviewInvite.id, reviewRemarks)
      await queryClient.invalidateQueries({ queryKey: ['enrolment-invites'] })
      closeReview()
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to reject.')
    } finally {
      setReviewLoading(false)
    }
  }

  const submittedData = reviewInvite?.submitted_data
    ? (typeof reviewInvite.submitted_data === 'string' ? JSON.parse(reviewInvite.submitted_data) : reviewInvite.submitted_data)
    : null

  return (
    <div className="min-h-screen">
      <PortalHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
          <Link to="/admin" className="hover:text-navy transition">Dashboard</Link>
          <span className="text-gray-300">›</span>
          <Link to={ADMISSIONS_TAB} className="hover:text-navy transition">Admissions</Link>
          <span className="text-gray-300">›</span>
          <span className="text-navy font-semibold">Onboarding Center</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">Onboarding Center</h1>
            <p className="text-sm text-gray-400 mt-1">
              Parent submissions awaiting review, and students still needing biometric setup.
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-navy text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-navy-light transition whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Invite Parent to Enrol
          </button>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-2xl shadow-sm mb-6">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="text-sm font-bold text-navy">Pending Review</div>
            <div className="text-xs text-gray-400">{pendingInvites.length} submission{pendingInvites.length !== 1 ? 's' : ''}</div>
          </div>
          {invitesLoading && <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>}
          {!invitesLoading && pendingInvites.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">No submissions waiting for review.</div>
          )}
          {!invitesLoading && pendingInvites.length > 0 && (
            <div className="flex flex-col divide-y divide-gray-50">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-lg bg-navy text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {initials(`${invite.prospective_first_name} ${invite.prospective_last_name}`)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-navy">{invite.prospective_first_name} {invite.prospective_last_name}</div>
                    <div className="text-xs text-gray-400">Submitted {formatDate(invite.submitted_at)} · Parent: {invite.parent_phone}</div>
                  </div>
                  <button
                    onClick={() => openReview(invite)}
                    className="text-xs font-semibold bg-navy text-white px-3.5 py-2 rounded-lg hover:bg-navy-light transition whitespace-nowrap"
                  >
                    Review
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Awaiting Fingerprint */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="text-sm font-bold text-navy">Awaiting Fingerprint</div>
            <div className="text-xs text-gray-400">{awaitingFingerprintTotal} student{awaitingFingerprintTotal !== 1 ? 's' : ''}</div>
          </div>
          {fingerprintLoading && <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>}
          {!fingerprintLoading && awaitingFingerprint.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">Everyone has a fingerprint on file.</div>
          )}
          {!fingerprintLoading && awaitingFingerprint.length > 0 && (
            <div className="flex flex-col divide-y divide-gray-50">
              {awaitingFingerprint.map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 rounded-lg bg-navy text-white text-[11px] font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                    {student.photo ? (
                      <img src={`${API_BASE_URL}${student.photo}`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initials(student.full_name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-navy">{student.full_name}</div>
                    <div className="text-xs text-gray-400">{student.student_id}{student.classroom_name ? ` · ${student.classroom_name}` : ''}</div>
                  </div>
                  <Link
                    to={`/admin/students/${student.id}`}
                    className="text-xs font-semibold text-gold hover:underline whitespace-nowrap"
                  >
                    Capture
                  </Link>
                </div>
              ))}
              {awaitingFingerprintTotal > awaitingFingerprint.length && (
                <div className="text-center py-3 text-xs text-gray-400">
                  Showing first {awaitingFingerprint.length} of {awaitingFingerprintTotal}.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !inviteLoading && closeInviteModal()}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            {!inviteResult ? (
              <>
                <div className="font-serif text-lg font-bold text-navy mb-1">Invite Parent to Enrol</div>
                <div className="text-xs text-gray-400 mb-4">We'll generate a secure link for the parent to fill in.</div>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">First Name</label>
                      <input className={inputClass + ' w-full'} value={inviteFirstName} onChange={(e) => setInviteFirstName(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Last Name</label>
                      <input className={inputClass + ' w-full'} value={inviteLastName} onChange={(e) => setInviteLastName(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Parent Phone Number</label>
                    <input className={inputClass + ' w-full'} value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)} />
                  </div>
                  {inviteError && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{inviteError}</div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={closeInviteModal} disabled={inviteLoading} className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2.5 rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
                      Cancel
                    </button>
                    <button onClick={handleCreateInvite} disabled={inviteLoading} className="flex-1 bg-navy text-white text-sm font-bold py-2.5 rounded-lg hover:bg-navy-light transition disabled:opacity-50">
                      {inviteLoading ? 'Sending...' : 'Send Invite'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="font-serif text-lg font-bold text-navy mb-1">Invite Sent</div>
                <div className="text-xs text-gray-400 mb-4">
                  An SMS was sent to {inviteResult.parent_phone}. You can also copy the link below directly.
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-600 break-all mb-3">
                  {inviteLink}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                  className="w-full text-sm font-semibold text-navy border border-gray-200 py-2.5 rounded-lg hover:bg-gray-50 transition mb-2"
                >
                  Copy Link
                </button>
                <button
                  onClick={closeInviteModal}
                  className="w-full bg-navy text-white text-sm font-bold py-2.5 rounded-lg hover:bg-navy-light transition"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewInvite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !reviewLoading && closeReview()}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg font-bold text-navy mb-1">
              Review — {reviewInvite.prospective_first_name} {reviewInvite.prospective_last_name}
            </div>
            <div className="text-xs text-gray-400 mb-4">Submitted {formatDate(reviewInvite.submitted_at)}</div>

            {submittedData && (
              <div className="flex flex-col gap-4 mb-5">
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Personal</div>
                  <div className="text-sm text-navy grid grid-cols-2 gap-1">
                    <div>Name: {submittedData.first_name} {submittedData.middle_name} {submittedData.last_name}</div>
                    <div>DOB: {submittedData.date_of_birth}</div>
                    <div>Gender: {submittedData.gender}</div>
                    <div>Nationality: {submittedData.nationality}</div>
                    <div>Home Town: {submittedData.home_town || '—'}</div>
                    <div>Religion: {submittedData.religion || '—'}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Guardians</div>
                  <div className="flex flex-col gap-1.5">
                    {(submittedData.guardians || []).map((g, i) => (
                      <div key={i} className="text-sm text-navy">
                        {g.first_name} {g.last_name} <span className="text-gray-400 capitalize">({g.relationship})</span> · {g.phone}
                        {g.is_primary && <span className="ml-1.5 text-[10px] font-semibold bg-gold/10 text-amber-700 px-1.5 py-0.5 rounded-full">Primary</span>}
                      </div>
                    ))}
                  </div>
                </div>
                {(submittedData.known_allergies || submittedData.medical_notes || submittedData.disability_status) && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1.5">Health</div>
                    <div className="text-sm text-navy">
                      {submittedData.known_allergies && <div>Allergies: {submittedData.known_allergies}</div>}
                      {submittedData.medical_notes && <div>Notes: {submittedData.medical_notes}</div>}
                      {submittedData.disability_status && <div>Disability: {submittedData.disability_description || 'Yes'}</div>}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Assign Class (optional now, can be set later)</label>
              <select className={inputClass + ' w-full mb-3'} value={reviewClassroom} onChange={(e) => setReviewClassroom(e.target.value)}>
                <option value="">Not yet assigned</option>
                {classrooms.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>

              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Remarks (used if rejecting)</label>
              <textarea rows={2} className={inputClass + ' w-full'} value={reviewRemarks} onChange={(e) => setReviewRemarks(e.target.value)} />

              {reviewError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-3">{reviewError}</div>
              )}

              <div className="flex items-center gap-2 mt-4">
                <button onClick={handleReject} disabled={reviewLoading} className="flex-1 text-sm font-semibold text-red-600 border border-red-200 py-2.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50">
                  Reject
                </button>
                <button onClick={handleApprove} disabled={reviewLoading} className="flex-1 bg-gold text-navy text-sm font-bold py-2.5 rounded-lg hover:bg-gold-light transition disabled:opacity-50">
                  {reviewLoading ? 'Processing...' : 'Approve & Enrol'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}