import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { getStaffInvite, acceptStaffInvite, checkUsername } from '../api/staffAccess'

function StaffSetup() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Set when the account is created but signing in afterwards failed. She
  // is not stuck — she has a username and a password, just needs to log in.
  const [manualSignIn, setManualSignIn] = useState(null)

  // Live availability. 'idle' | 'checking' | 'available' | 'taken'
  const [availability, setAvailability] = useState('idle')
  const [availabilityMessage, setAvailabilityMessage] = useState('')
  const checkTimer = useRef(null)

  const { data, isLoading, isError, error: loadError } = useQuery({
    queryKey: ['staff-invite', token],
    queryFn: () => getStaffInvite(token),
    retry: false,
  })

  const invite = data?.data
  const suggestions = invite?.suggested_usernames || []

  // Seed the field with the first suggestion so most people never have to
  // think about it. They can still change it.
  useEffect(() => {
    if (invite && !username && suggestions.length > 0) {
      setUsername(suggestions[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite])

  // Debounced availability check.
  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current)

    const value = username.trim()
    if (!value) {
      setAvailability('idle')
      setAvailabilityMessage('')
      return
    }

    setAvailability('checking')
    checkTimer.current = setTimeout(async () => {
      try {
        const res = await checkUsername(value)
        const body = res.data || res
        setAvailability(body.available ? 'available' : 'taken')
        setAvailabilityMessage(body.message || '')
      } catch {
        setAvailability('idle')
        setAvailabilityMessage('')
      }
    }, 400)

    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current)
    }
  }, [username])

  const submit = async () => {
    setError('')

    if (!username.trim()) return setError('Choose a username.')
    if (availability === 'taken') return setError('That username is taken. Choose another.')
    if (password.length < 8) return setError('Your password needs at least 8 characters.')
    if (password !== confirm) return setError('The two passwords do not match.')

    setSaving(true)
    try {
      const res = await acceptStaffInvite(token, {
        username: username.trim(),
        password,
        confirm_password: confirm,
      })

      const chosen = (res.data || res)?.username || username.trim()

      // The account exists from here on. Anything that fails below is a
      // sign-in problem, not a setup problem, so she is shown her username
      // rather than an error.
      try {
        const { memberships } = await login(chosen, password)
        if (memberships.length > 1) {
          navigate('/select-membership')
        } else {
          navigate('/redirect')
        }
      } catch {
        setManualSignIn(chosen)
      }
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
    const alreadyUsed = msg.toLowerCase().includes('already been used')

    return shell(
      <div className="text-center py-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
          alreadyUsed ? 'bg-green-50' : 'bg-red-50'
        }`}>
          {alreadyUsed ? (
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <div className="font-serif text-lg font-bold text-navy mb-1.5">
          {alreadyUsed ? 'Your account is ready' : 'Link not valid'}
        </div>
        <p className="text-sm text-gray-500 leading-relaxed mb-5">
          {alreadyUsed
            ? 'This link has already been used, which means your account is set up. Sign in with the username and password you chose.'
            : msg}
        </p>
        <Link
          to="/login"
          className="inline-block text-xs font-bold text-white bg-navy rounded-lg px-5 py-2.5 hover:bg-navy-light transition"
        >
          Go to sign in
        </Link>
      </div>
    )
  }

  if (manualSignIn) {
    return shell(
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="font-serif text-lg font-bold text-navy mb-1.5">Your account is ready</div>
        <p className="text-sm text-gray-500 leading-relaxed mb-2">
          Sign in with this username and the password you just chose.
        </p>
        <p className="font-serif text-xl font-bold text-navy mb-5">@{manualSignIn}</p>
        <button
          onClick={() => navigate('/login')}
          className="text-xs font-bold text-white bg-navy rounded-lg px-5 py-2.5 hover:bg-navy-light transition"
        >
          Go to sign in
        </button>
      </div>
    )
  }

  const availabilityColour = {
    checking: 'text-gray-400',
    available: 'text-green-600',
    taken: 'text-red-600',
    idle: 'text-gray-400',
  }[availability]

  return shell(
    <>
      <div className="font-serif text-xl font-bold text-navy mb-1">
        Welcome, {invite.full_name?.split(' ')[0]}
      </div>
      <p className="text-sm text-gray-500 leading-relaxed mb-5">
        You have been given access to the <span className="font-semibold text-navy">{invite.school_name}</span> staff
        portal. Choose a username and a password to finish setting up.
      </p>

      <div className="mb-1">
        <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Username</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">@</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            spellCheck="false"
            placeholder="kwame"
            className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
          />
        </div>
        <div className={`text-[11px] mt-1 h-4 ${availabilityColour}`}>
          {availability === 'checking' ? 'Checking...' : availabilityMessage}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {suggestions.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setUsername(s)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition ${
                username === s
                  ? 'bg-navy text-white border-navy'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              @{s}
            </button>
          ))}
        </div>
      )}

      <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
        This is how you sign in. You can also sign in with your phone number.
      </p>

      <div className="mb-3">
        <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="w-full px-3 py-2.5 pr-11 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy transition"
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-[11px] font-semibold text-gray-500 mb-1.5 block">Confirm password</label>
        <input
          type={showPassword ? 'text' : 'password'}
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
        disabled={saving || availability === 'taken'}
        className="w-full text-sm font-bold text-white bg-navy rounded-lg py-3 hover:bg-navy-light transition disabled:opacity-50"
      >
        {saving ? 'Setting up...' : 'Finish setup'}
      </button>

      <p className="text-[11px] text-gray-400 text-center mt-4">
        This link expires 48 hours after it was sent.
      </p>
    </>
  )
}

export default StaffSetup