import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getStaffInvite, acceptStaffInvite } from '../api/staffAccess'

function StaffSetup() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(null)

  const { data, isLoading, isError, error: loadError } = useQuery({
    queryKey: ['staff-invite', token],
    queryFn: () => getStaffInvite(token),
    retry: false,
  })

  const invite = data?.data

  const submit = async () => {
    setError('')
    if (password.length < 8) return setError('Your password needs at least 8 characters.')
    if (password !== confirm) return setError('The two passwords do not match.')

    setSaving(true)
    try {
      const res = await acceptStaffInvite(token, {
        password,
        confirm_password: confirm,
      })
      setDone(res.data?.email || '')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not set up your account. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const shell = (children) => (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-6 justify-center">
          <div className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center">
            <span className="text-gold font-serif font-bold text-lg">I</span>
          </div>
          <div>
            <div className="font-serif text-lg font-bold text-navy leading-none">Ilimi</div>
            <div className="text-[9px] text-gray-400 tracking-wider uppercase mt-0.5">
              School Management Platform
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">{children}</div>
      </div>
    </div>
  )

  if (isLoading) {
    return shell(<div className="text-center py-8 text-sm text-gray-400">Checking your link...</div>)
  }

  if (isError) {
    const msg = loadError?.response?.data?.message || 'This link is not valid.'
    return shell(
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="font-serif text-lg font-bold text-navy mb-1.5">Link not valid</div>
        <p className="text-sm text-gray-500 leading-relaxed mb-5">{msg}</p>
        <Link
          to="/login"
          className="inline-block text-xs font-bold text-white bg-navy rounded-lg px-5 py-2.5 hover:bg-navy-light transition"
        >
          Go to login
        </Link>
      </div>
    )
  }

  if (done !== null) {
    return shell(
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="font-serif text-lg font-bold text-navy mb-1.5">You are all set</div>
        <p className="text-sm text-gray-500 leading-relaxed mb-1">
          Your account is ready. Sign in with:
        </p>
        <p className="text-sm font-semibold text-navy mb-5">{done}</p>
        <button
          onClick={() => navigate('/login')}
          className="text-xs font-bold text-white bg-navy rounded-lg px-5 py-2.5 hover:bg-navy-light transition"
        >
          Go to login
        </button>
      </div>
    )
  }

  return shell(
    <>
      <div className="font-serif text-xl font-bold text-navy mb-1">
        Welcome, {invite.full_name?.split(' ')[0]}
      </div>
      <p className="text-sm text-gray-500 leading-relaxed mb-5">
        You have been given access to the <span className="font-semibold text-navy">{invite.school_name}</span> staff
        portal. Choose a password to finish setting up your account.
      </p>

      <div className="mb-3">
        <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
        />
      </div>

      <div className="mb-4">
        <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Type it again"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
        />
      </div>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={saving}
        className="w-full text-sm font-bold text-white bg-navy rounded-lg py-3 hover:bg-navy-light transition disabled:opacity-50"
      >
        {saving ? 'Setting up...' : 'Set my password'}
      </button>

      <p className="text-[11px] text-gray-400 text-center mt-4">
        This link expires 48 hours after it was sent.
      </p>
    </>
  )
}

export default StaffSetup