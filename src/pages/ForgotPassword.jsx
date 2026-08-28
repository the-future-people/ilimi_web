import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  requestPasswordReset,
  verifyPasswordResetCode,
  completePasswordReset,
} from '../api/auth'

const RESEND_SECONDS = 60

function ForgotPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  // 'phone' | 'code' | 'password'
  const [stage, setStage] = useState('phone')

  const [phone, setPhone] = useState(location.state?.phone || '')
  const [code, setCode] = useState('')
  const [ticket, setTicket] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Set when the password changed but signing in afterwards failed. The
  // new password works — she just needs to sign in with it.
  const [signInManually, setSignInManually] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const sendCode = async () => {
    setError('')
    if (!phone.trim()) return setError('Enter your phone number.')

    setBusy(true)
    try {
      const res = await requestPasswordReset(phone.trim())
      setNotice((res.data || res)?.message || 'If that number is registered, a code has been sent.')
      setStage('code')
      setCooldown(RESEND_SECONDS)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send a code. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const submitCode = async () => {
    setError('')
    if (code.trim().length < 4) return setError('Enter the code from the text message.')

    setBusy(true)
    try {
      const res = await verifyPasswordResetCode(phone.trim(), code.trim())
      setTicket((res.data || res)?.ticket || '')
      setNotice('')
      setStage('password')
    } catch (err) {
      setError(err.response?.data?.message || 'That code is not right, or it has expired.')
    } finally {
      setBusy(false)
    }
  }

  const submitPassword = async () => {
    setError('')
    if (password.length < 8) return setError('Your password needs at least 8 characters.')
    if (password !== confirm) return setError('The two passwords do not match.')

    setBusy(true)
    try {
      await completePasswordReset(ticket, password, confirm)

      // The password is changed from here on. A failure below is a
      // sign-in problem, not a reset problem.
      try {
        const { memberships } = await login(phone.trim(), password)
        if (memberships.length > 1) {
          navigate('/select-membership')
        } else {
          navigate('/redirect')
        }
      } catch {
        setSignInManually(true)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change your password. Please start again.')
    } finally {
      setBusy(false)
    }
  }

  const shell = (children) => (
    <div className="min-h-screen bg-[#1a2946] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-[#1a2946] mb-1">Ilimi</h1>
          <p className="text-xs text-gray-400 uppercase tracking-widest">School Management Platform</p>
        </div>
        {children}
      </div>
    </div>
  )

  const inputClass =
    'w-full mt-1 px-4 py-3 border border-gray-200 rounded-lg outline-none focus:border-[#e8a021] transition'

  if (signInManually) {
    return shell(
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="font-serif text-lg font-bold text-[#1a2946] mb-1.5">Password changed</div>
        <p className="text-sm text-gray-500 leading-relaxed mb-5">
          Sign in with your new password.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="text-xs font-bold text-white bg-[#1a2946] rounded-lg px-5 py-2.5 hover:opacity-90 transition"
        >
          Go to sign in
        </button>
      </div>
    )
  }

  return shell(
    <>
      <div className="mb-5">
        <h2 className="font-serif text-xl font-bold text-[#1a2946] mb-1">
          {stage === 'phone' && 'Forgot your password?'}
          {stage === 'code' && 'Check your messages'}
          {stage === 'password' && 'Choose a new password'}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          {stage === 'phone' && 'Enter the phone number your school has on record and we will text you a code.'}
          {stage === 'code' && `We sent a 6-digit code to ${phone}. It expires in 10 minutes.`}
          {stage === 'password' && 'Pick something you will remember. At least 8 characters.'}
        </p>
      </div>

      {stage === 'phone' && (
        <>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendCode()}
            placeholder="0244558389"
            autoComplete="tel"
            className={inputClass}
          />
        </>
      )}

      {stage === 'code' && (
        <>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">6-digit code</label>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && submitCode()}
            placeholder="000000"
            autoComplete="one-time-code"
            className={`${inputClass} tracking-[0.4em] text-center text-lg`}
          />
          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={() => { setStage('phone'); setCode(''); setError('') }}
              className="text-[11px] font-semibold text-gray-400 hover:text-[#1a2946] transition"
            >
              Wrong number?
            </button>
            <button
              type="button"
              onClick={sendCode}
              disabled={cooldown > 0 || busy}
              className="text-[11px] font-semibold text-[#1a2946] hover:underline disabled:text-gray-300 disabled:no-underline"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send a new code'}
            </button>
          </div>
        </>
      )}

      {stage === 'password' && (
        <>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">New password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 mt-0.5 text-gray-400 hover:text-[#1a2946] transition"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 block">
            Confirm password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitPassword()}
            placeholder="Type it again"
            autoComplete="new-password"
            className={inputClass}
          />
        </>
      )}

      {notice && !error && (
        <div className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 mt-4">
          {notice}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mt-4">
          {error}
        </div>
      )}

      <button
        onClick={stage === 'phone' ? sendCode : stage === 'code' ? submitCode : submitPassword}
        disabled={busy}
        className="mt-5 w-full py-3 bg-[#e8a021] text-[#1a2946] font-bold rounded-lg hover:bg-[#f5c05a] transition disabled:opacity-50"
      >
        {busy
          ? 'Please wait...'
          : stage === 'phone'
            ? 'Send code'
            : stage === 'code'
              ? 'Continue'
              : 'Change password'}
      </button>

      <p className="text-center text-xs text-gray-400 mt-4">
        Remembered it? <Link to="/login" className="text-[#1a2946] font-semibold hover:underline">Sign in</Link>
      </p>
    </>
  )
}

export default ForgotPassword