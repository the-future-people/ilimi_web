import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  registerStep1, sendInitialOtp, verifyOtp, resendOtp,
  registerSchool, getMyMemberships,
} from '../api/auth'

const SCHOOL_TYPE_CHOICES = [
  { value: '', label: 'Select...' },
  { value: 'basic', label: 'Basic / JHS' },
  { value: 'shs', label: 'Senior High School' },
  { value: 'international', label: 'International School' },
  { value: 'group', label: 'Multi-branch Group' },
]

const STUDENT_COUNT_CHOICES = [
  { value: '', label: 'Select...' },
  { value: 'under_100', label: 'Under 100' },
  { value: '100_300', label: '100 – 300' },
  { value: '300_600', label: '300 – 600' },
  { value: '600_plus', label: '600+' },
]

const POSITION_CHOICES = [
  { value: '', label: 'Select...' },
  { value: 'proprietor', label: 'Proprietor / Owner' },
  { value: 'head_teacher', label: 'Head Teacher / Principal' },
  { value: 'administrator', label: 'Administrator' },
  { value: 'other', label: 'Other' },
]

const inputClass = "w-full px-3.5 py-2.5 sm:py-3 border border-gray-200 rounded-lg outline-none focus:border-gold transition text-sm"
const inputErrorClass = "w-full px-3.5 py-2.5 sm:py-3 border border-red-300 rounded-lg outline-none focus:border-red-400 transition text-sm"
const labelClass = "text-[11px] font-semibold text-gray-400 uppercase tracking-wide"

const stepDefs = [
  { key: 'details', index: 1, title: 'Your Details', subtitle: 'Tell us about yourself' },
  { key: 'verify', index: 2, title: 'Verify Phone', subtitle: 'Confirm your number' },
  { key: 'school', index: 3, title: 'School Info', subtitle: 'About your school' },
]

function StepIndicator({ status, index, size = 'md' }) {
  const dim = size === 'sm' ? 'w-6 h-6 text-[11px]' : 'w-8 h-8 text-xs'
  return (
    <div className={`${dim} rounded-full flex items-center justify-center flex-shrink-0 font-bold transition relative z-10 ${
      status === 'completed' ? 'bg-gold text-navy' : status === 'active' ? 'bg-navy text-white' : 'bg-gray-100 text-gray-400'
    }`}>
      {status === 'completed' ? (
        <svg className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
        </svg>
      ) : index}
    </div>
  )
}

function FormFields({
  section, form, errors, loading, otp, setOtp, resendCooldown, otpSending,
  update, handleStep1Submit, handleOtpSubmit, handleSchoolSubmit, handleResend,
}) {
  if (section === 'details') {
    return (
      <form onSubmit={handleStep1Submit} className="flex flex-col gap-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>First Name</label>
            <input className={errors.first_name ? inputErrorClass : inputClass} value={form.first_name} onChange={(e) => update('first_name', e.target.value)} required />
            {errors.first_name && <span className="text-[11px] text-red-500">{errors.first_name[0] || errors.first_name}</span>}
          </div>
          <div>
            <label className={labelClass}>Last Name</label>
            <input className={errors.last_name ? inputErrorClass : inputClass} value={form.last_name} onChange={(e) => update('last_name', e.target.value)} required />
            {errors.last_name && <span className="text-[11px] text-red-500">{errors.last_name[0] || errors.last_name}</span>}
          </div>
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" className={errors.email ? inputErrorClass : inputClass} value={form.email} onChange={(e) => update('email', e.target.value)} required />
          {errors.email && <span className="text-[11px] text-red-500">{errors.email[0] || errors.email}</span>}
        </div>
        <div>
          <label className={labelClass}>Phone Number</label>
          <input placeholder="+233XXXXXXXXX" className={errors.phone_number ? inputErrorClass : inputClass} value={form.phone_number} onChange={(e) => update('phone_number', e.target.value)} required />
          {errors.phone_number && <span className="text-[11px] text-red-500">{errors.phone_number[0] || errors.phone_number}</span>}
        </div>
        <div>
          <label className={labelClass}>Your Role</label>
          <select className={inputClass} value={form.position_title} onChange={(e) => update('position_title', e.target.value)}>
            {POSITION_CHOICES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Password</label>
            <input type="password" className={errors.password ? inputErrorClass : inputClass} value={form.password} onChange={(e) => update('password', e.target.value)} required />
            {errors.password && <span className="text-[11px] text-red-500">{errors.password[0] || errors.password}</span>}
          </div>
          <div>
            <label className={labelClass}>Confirm</label>
            <input type="password" className={errors.confirm_password ? inputErrorClass : inputClass} value={form.confirm_password} onChange={(e) => update('confirm_password', e.target.value)} required />
            {errors.confirm_password && <span className="text-[11px] text-red-500">{errors.confirm_password}</span>}
          </div>
        </div>
        <label className="flex items-start gap-2 mt-1">
          <input type="checkbox" checked={form.terms} onChange={(e) => update('terms', e.target.checked)} className="w-4 h-4 mt-0.5 accent-navy flex-shrink-0" />
          <span className="text-xs text-gray-500">I agree to the Terms and Conditions</span>
        </label>
        {errors.terms && <span className="text-[11px] text-red-500 -mt-2">{errors.terms}</span>}
        <button type="submit" disabled={loading} className="mt-1 w-full py-2.5 sm:py-3 bg-gold text-navy font-bold rounded-lg hover:bg-gold-light transition disabled:opacity-50 text-sm">
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>
    )
  }

  if (section === 'verify') {
    return (
      <form onSubmit={handleOtpSubmit} className="flex flex-col gap-3.5">
        <p className="text-xs text-gray-400">
          {otpSending
            ? 'Sending a code to your phone...'
            : <>We sent a 6-digit code to <span className="font-semibold text-navy">{form.phone_number}</span></>}
        </p>
        <input
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          disabled={otpSending}
          className={`${inputClass} text-center text-xl sm:text-2xl font-bold tracking-[0.4em] sm:tracking-[0.5em] py-3 sm:py-4 disabled:opacity-50`}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          required
        />
        <button type="submit" disabled={loading || otpSending || otp.length !== 6} className="w-full py-2.5 sm:py-3 bg-gold text-navy font-bold rounded-lg hover:bg-gold-light transition disabled:opacity-50 text-sm">
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </button>
        <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || otpSending} className="text-center text-xs text-gray-400 hover:text-navy transition disabled:opacity-50">
          {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't get a code? Resend"}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSchoolSubmit} className="flex flex-col gap-3.5">
      <div>
        <label className={labelClass}>School Name</label>
        <input className={errors.school_name ? inputErrorClass : inputClass} value={form.school_name} onChange={(e) => update('school_name', e.target.value)} required />
        {errors.school_name && <span className="text-[11px] text-red-500">{errors.school_name[0] || errors.school_name}</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>School Email <span className="text-gray-300 normal-case">(optional)</span></label>
          <input type="email" className={inputClass} value={form.school_email} onChange={(e) => update('school_email', e.target.value)} placeholder="Uses your email if left blank" />
        </div>
        <div>
          <label className={labelClass}>School Phone <span className="text-gray-300 normal-case">(optional)</span></label>
          <input className={inputClass} value={form.school_phone} onChange={(e) => update('school_phone', e.target.value)} placeholder="Uses your phone if left blank" />
        </div>
      </div>
      <div>
        <label className={labelClass}>City</label>
        <input className={inputClass} value={form.city} onChange={(e) => update('city', e.target.value)} required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>School Type</label>
          <select className={inputClass} value={form.school_type} onChange={(e) => update('school_type', e.target.value)}>
            {SCHOOL_TYPE_CHOICES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Student Count</label>
          <select className={inputClass} value={form.expected_student_count} onChange={(e) => update('expected_student_count', e.target.value)}>
            {STUDENT_COUNT_CHOICES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <button type="submit" disabled={loading} className="mt-1 w-full py-2.5 sm:py-3 bg-gold text-navy font-bold rounded-lg hover:bg-gold-light transition disabled:opacity-50 text-sm">
        {loading ? 'Setting up...' : 'Complete Setup'}
      </button>
    </form>
  )
}

function Register() {
  const [activeSection, setActiveSection] = useState('details')
  const [detailsStatus, setDetailsStatus] = useState('active')
  const [verifyStatus, setVerifyStatus] = useState('pending')
  const [schoolStatus, setSchoolStatus] = useState('pending')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [otpSending, setOtpSending] = useState(false)
  const otpSentRef = useRef(false)

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone_number: '',
    password: '', confirm_password: '', terms: false, position_title: '',
    school_name: '', school_email: '', school_phone: '', city: '',
    school_type: '', expected_student_count: '',
  })

  const [otp, setOtp] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const [phase, setPhase] = useState('form')
  const [processStep, setProcessStep] = useState(0)
  const apiDoneRef = useRef(false)
  const apiResultRef = useRef(null)

  const processSteps = [
    'Processing your details...',
    `Integrating ${form.school_name || 'your school'} into Ilimi...`,
    'Setting up your environment...',
    'All clear!',
  ]

  const statusFor = { details: detailsStatus, verify: verifyStatus, school: schoolStatus }

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleStep1Submit = async (e) => {
    e.preventDefault()
    setError('')
    setErrors({})

    if (!form.terms) {
      setErrors({ terms: 'You must accept the terms to continue.' })
      return
    }
    if (form.password !== form.confirm_password) {
      setErrors({ confirm_password: 'Passwords do not match.' })
      return
    }

    if (detailsStatus === 'completed') {
      setActiveSection('verify')
      return
    }

    setLoading(true)
    try {
      await registerStep1({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone_number: form.phone_number,
        password: form.password,
        confirm_password: form.confirm_password,
      })
      setDetailsStatus('completed')
      setVerifyStatus('active')
      setActiveSection('verify')
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setErrors(data.errors)
      else setError(data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Trigger the actual OTP send once the verify step becomes active — not before
  useEffect(() => {
    if (activeSection !== 'verify' || otpSentRef.current) return
    otpSentRef.current = true
    setOtpSending(true)
    sendInitialOtp(form.phone_number)
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to send verification code.')
      })
      .finally(() => setOtpSending(false))
  }, [activeSection])

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await verifyOtp(form.phone_number, otp)
      const payload = result.data || result

      localStorage.setItem('access_token', payload.tokens.access)
      localStorage.setItem('refresh_token', payload.tokens.refresh)
      localStorage.setItem('user', JSON.stringify(payload.user))

      setVerifyStatus('completed')
      setSchoolStatus('active')
      setActiveSection('school')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError('')
    try {
      await resendOtp(form.phone_number)
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(interval); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.')
    }
  }

  const handleSchoolSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setErrors({})
    setPhase('processing')
    setProcessStep(0)
    apiDoneRef.current = false
    apiResultRef.current = null

    registerSchool({
      school_name: form.school_name,
      school_email: form.school_email,
      school_phone: form.school_phone,
      city: form.city,
      school_type: form.school_type,
      expected_student_count: form.expected_student_count,
      position_title: form.position_title,
    })
      .then(async () => {
        const membershipData = await getMyMemberships()
        const membershipList = membershipData.data?.memberships || membershipData.memberships || []

        if (membershipList.length === 1) {
          localStorage.setItem('active_member_id', membershipList[0].id)
          localStorage.setItem('active_member', JSON.stringify(membershipList[0]))
        }

        apiResultRef.current = { success: true }
        apiDoneRef.current = true
      })
      .catch((err) => {
        const data = err.response?.data
        apiResultRef.current = {
          success: false,
          message: data?.message || 'Something went wrong setting up your school.',
          fieldErrors: data?.errors,
        }
        apiDoneRef.current = true
      })
  }

  useEffect(() => {
    if (phase !== 'processing') return
    const totalDurationMs = 12000
    const stepCount = processSteps.length - 1
    const stepDuration = totalDurationMs / stepCount

    const interval = setInterval(() => {
      setProcessStep((prev) => {
        const next = prev + 1
        if (next >= processSteps.length - 1) {
          clearInterval(interval)
          return processSteps.length - 1
        }
        return next
      })
    }, stepDuration)

    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => {
    if (phase !== 'processing') return
    if (processStep < processSteps.length - 1) return

    const checkDone = setInterval(() => {
      if (apiDoneRef.current) {
        clearInterval(checkDone)
        const result = apiResultRef.current
        setTimeout(() => {
          if (result.success) {
            setSchoolStatus('completed')
            setPhase('success')
          } else {
            if (result.fieldErrors) setErrors(result.fieldErrors)
            setError(result.message)
            setPhase('error')
          }
        }, 400)
      }
    }, 150)

    return () => clearInterval(checkDone)
  }, [phase, processStep])

  const editSection = (key) => {
    if (key === 'details' && detailsStatus === 'completed') {
      setDetailsStatus('active')
      if (verifyStatus === 'active') setVerifyStatus('pending')
      setActiveSection('details')
    }
  }

  const [displaySection, setDisplaySection] = useState('details')
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    if (activeSection === displaySection) return
    setTransitioning(true)
    const timer = setTimeout(() => {
      setDisplaySection(activeSection)
      setTransitioning(false)
    }, 220)
    return () => clearTimeout(timer)
  }, [activeSection])

  const activeDef = stepDefs.find((s) => s.key === displaySection)

  return (
    <div className="min-h-screen bg-[#1a2946] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-xl md:max-w-3xl overflow-hidden md:flex">

        {/* Sidebar — md and up */}
        <div className="hidden md:flex md:w-64 lg:w-72 bg-[#f8f9fb] border-r border-gray-100 flex-col p-6 flex-shrink-0">
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-bold text-navy mb-1">Ilimi</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">School Management Platform</p>
          </div>
          <div className="flex flex-col">
            {stepDefs.map((s, i) => {
              const status = statusFor[s.key]
              const clickable = status === 'completed' && s.key === 'details'
              const isLast = i === stepDefs.length - 1
              const lineActive = status === 'completed'
              return (
                <div key={s.key} className="flex gap-3">
                  <div className="flex flex-col items-center pt-3">
                    <StepIndicator status={status} index={s.index} />
                    {!isLast && (
                      <div className={`w-0.5 flex-1 my-1 min-h-[28px] rounded transition ${lineActive ? 'bg-gold' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <button
                    onClick={() => clickable && editSection(s.key)}
                    disabled={!clickable}
                    className={`flex-1 text-left p-3 pl-0 rounded-xl transition ${
                      status === 'active' ? '' : clickable ? 'hover:opacity-70 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className={`text-sm font-bold ${status === 'pending' ? 'text-gray-400' : 'text-navy'}`}>{s.title}</div>
                    <div className="text-xs text-gray-400">{s.subtitle}</div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile horizontal stepper */}
        <div className="md:hidden p-5 pb-0">
          <div className="text-center mb-5">
            <h1 className="font-serif text-2xl font-bold text-navy mb-1">Ilimi</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">School Management Platform</p>
          </div>
          <div className="flex items-center gap-1 mb-5">
            {stepDefs.map((s, i) => (
              <div key={s.key} className="flex items-center flex-1">
                <button
                  onClick={() => statusFor[s.key] === 'completed' && s.key === 'details' && editSection(s.key)}
                  disabled={!(statusFor[s.key] === 'completed' && s.key === 'details')}
                  className="flex-shrink-0"
                >
                  <StepIndicator status={statusFor[s.key]} index={s.index} size="sm" />
                </button>
                {i < stepDefs.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 transition ${statusFor[s.key] === 'completed' ? 'bg-gold' : 'bg-gray-100'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content panel */}
        <div className="flex-1 p-5 sm:p-7 md:p-8 min-h-[480px] sm:min-h-[460px] flex flex-col">
          <div
            className="flex-1 transition-all duration-200 ease-out"
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'translateY(-10px) scaleY(0.98)' : 'translateY(0) scaleY(1)',
              transformOrigin: 'top',
            }}
          >
            <div className="mb-5 hidden md:block">
              <h2 className="font-serif text-xl font-bold text-navy">{activeDef.title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{activeDef.subtitle}</p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <FormFields
              section={displaySection}
            form={form}
            errors={errors}
            loading={loading}
            otp={otp}
            setOtp={setOtp}
            resendCooldown={resendCooldown}
            otpSending={otpSending}
            update={update}
            handleStep1Submit={handleStep1Submit}
            handleOtpSubmit={handleOtpSubmit}
            handleSchoolSubmit={handleSchoolSubmit}
            handleResend={handleResend}
            />
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Already have an account? <Link to="/login" className="text-navy font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Processing overlay */}
      {phase === 'processing' && (
        <div className="fixed inset-0 bg-navy/95 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
          <div className="flex flex-col items-center text-center w-full max-w-xs">
            <div className="w-14 h-14 rounded-full border-4 border-white/10 border-t-gold animate-spin mb-8" />
            <div className="flex flex-col gap-3 w-full">
              {processSteps.map((label, i) => (
                <div key={label} className="flex items-center gap-3 text-left">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                    i < processStep ? 'bg-gold' : i === processStep ? 'bg-white/15' : 'bg-white/5'
                  }`}>
                    {i < processStep ? (
                      <svg className="w-3 h-3 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i === processStep ? (
                      <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                    ) : null}
                  </div>
                  <span className={`text-sm transition ${i <= processStep ? 'text-white' : 'text-white/30'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success overlay */}
      {phase === 'success' && (
        <div className="fixed inset-0 bg-navy/95 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
          <div className="flex flex-col items-center text-center animate-success-pop max-w-sm">
            <div className="w-20 h-20 rounded-full bg-gold flex items-center justify-center mb-6 animate-success-ring">
              <svg className="w-10 h-10 text-navy animate-success-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">Welcome to Ilimi!</h2>
            <p className="text-white/60 text-sm mb-8">{form.school_name} is all set up and ready to go.</p>
            <RedirectOnSuccess />
          </div>
        </div>
      )}

      {/* Error overlay */}
      {phase === 'error' && (
        <div className="fixed inset-0 bg-navy/95 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
          <div className="flex flex-col items-center text-center max-w-sm">
            <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="font-serif text-xl font-bold text-white mb-2">Setup Failed</h2>
            <p className="text-white/60 text-sm mb-6">{error}</p>
            <button onClick={() => setPhase('form')} className="bg-gold text-navy text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-gold-light transition">
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RedirectOnSuccess() {
  useEffect(() => {
    const timer = setTimeout(() => { window.location.href = '/redirect' }, 1800)
    return () => clearTimeout(timer)
  }, [])
  return null
}

export default Register