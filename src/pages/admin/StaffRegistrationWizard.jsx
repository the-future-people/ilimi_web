import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { getSubjects } from '../../api/academics'
import { registerStaff } from '../../api/staff'
import PhotoCapture from '../../components/PhotoCapture'
import FingerprintUpload from '../../components/FingerprintUpload'
import PositionTypeahead from '../../components/PositionTypeahead'
import StaffEmergencyContactSection from '../../components/StaffEmergencyContactSection'
import { STAFF_REGISTER_TAB } from '../../constants/nav'

const TITLE_CHOICES = [
  { value: '', label: 'Select...' },
  { value: 'mr', label: 'Mr.' },
  { value: 'mrs', label: 'Mrs.' },
  { value: 'miss', label: 'Miss' },
  { value: 'madam', label: 'Madam' },
  { value: 'dr', label: 'Dr.' },
  { value: 'prof', label: 'Prof.' },
  { value: 'rev', label: 'Rev.' },
  { value: 'pastor', label: 'Pastor' },
  { value: 'alhaji', label: 'Alhaji' },
  { value: 'hajia', label: 'Hajia' },
  { value: 'hon', label: 'Hon.' },
  { value: 'other', label: 'Other' },
]

const GENDER_CHOICES = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const MARITAL_STATUS_CHOICES = [
  { value: '', label: 'Select...' },
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
]

const BLOOD_GROUP_CHOICES = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
]

const GHANA_REGIONS = [
  { value: '', label: 'Select...' },
  { value: 'greater_accra', label: 'Greater Accra' },
  { value: 'ashanti', label: 'Ashanti' },
  { value: 'western', label: 'Western' },
  { value: 'western_north', label: 'Western North' },
  { value: 'central', label: 'Central' },
  { value: 'eastern', label: 'Eastern' },
  { value: 'volta', label: 'Volta' },
  { value: 'oti', label: 'Oti' },
  { value: 'northern', label: 'Northern' },
  { value: 'savannah', label: 'Savannah' },
  { value: 'north_east', label: 'North East' },
  { value: 'upper_east', label: 'Upper East' },
  { value: 'upper_west', label: 'Upper West' },
  { value: 'bono', label: 'Bono' },
  { value: 'bono_east', label: 'Bono East' },
  { value: 'ahafo', label: 'Ahafo' },
  { value: 'other', label: 'Other / Outside Ghana' },
]

const EMPLOYMENT_TYPE_CHOICES = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'contract', label: 'Contract' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'national_service', label: 'National Service' },
  { value: 'volunteer', label: 'Volunteer' },
]

const TIME_COMMITMENT_CHOICES = [
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
]

const STAFF_CATEGORY_CHOICES = [
  { value: '', label: 'Select...' },
  { value: 'teaching', label: 'Teaching' },
  { value: 'non_teaching', label: 'Non-Teaching' },
  { value: 'support', label: 'Support' },
  { value: 'management', label: 'Management' },
]

const QUALIFICATION_CHOICES = [
  { value: '', label: 'Select...' },
  { value: 'wassce', label: 'WASSCE' },
  { value: 'hnd', label: 'HND' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'pgde', label: 'PGDE' },
  { value: 'masters', label: "Master's Degree" },
  { value: 'phd', label: 'PhD' },
  { value: 'other', label: 'Other' },
]

const BANK_CHOICES = [
  { value: '', label: 'Select...' },
  { value: 'gcb', label: 'GCB Bank' },
  { value: 'ecobank', label: 'Ecobank' },
  { value: 'absa', label: 'Absa Bank' },
  { value: 'stanbic', label: 'Stanbic Bank' },
  { value: 'zenith', label: 'Zenith Bank' },
  { value: 'uba', label: 'UBA Ghana' },
  { value: 'fidelity', label: 'Fidelity Bank' },
  { value: 'calbank', label: 'CalBank' },
  { value: 'agricultural', label: 'Agricultural Development Bank' },
  { value: 'prudential', label: 'Prudential Bank' },
  { value: 'republic', label: 'Republic Bank' },
  { value: 'societe', label: 'Societe Generale' },
  { value: 'access', label: 'Access Bank' },
  { value: 'other', label: 'Other' },
]

const steps = [
  { num: 1, label: 'Personal' },
  { num: 2, label: 'Identity' },
  { num: 3, label: 'Contact & Emergency' },
  { num: 4, label: 'Employment' },
  { num: 5, label: 'Pay & Qualifications' },
  { num: 6, label: 'Review' },
]

const labelFor = (choices, value) => {
  const found = choices.find((c) => c.value === value)
  return found && found.value ? found.label : ''
}

const formatDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </div>
  )
}

const inputClass = "px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
const inputErrorClass = "px-3 py-2.5 border border-red-300 rounded-lg text-sm outline-none focus:border-red-400"

// ── Review cards ──────────────────────────────────────────────────────────
// Deliberately mirrors the staff detail page, so what an administrator
// confirms here is what they will see on the record afterwards.

function ReviewCard({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-navy flex-shrink-0">{icon}</span>
        <h3 className="text-[15px] font-bold text-navy">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-[7px]">
      <span className="text-[13px] text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-[13px] text-navy text-right min-w-0 break-words">
        {value || <span className="text-gray-300">Not set</span>}
      </span>
    </div>
  )
}

const icons = {
  contact: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  employment: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  identity: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0h4M9 14a2 2 0 100-4 2 2 0 000 4zm0 0c-1.3 0-2.4.8-2.8 2M15 12h3m-3 3h2" />
    </svg>
  ),
  qualifications: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
    </svg>
  ),
  pay: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" />
    </svg>
  ),
  emergency: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-2.99l-6.93-12a2 2 0 00-3.48 0l-6.93 12A2 2 0 005.07 19z" />
    </svg>
  ),
}

function StaffRegistrationWizard() {
  const { activeMember } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [transitioning, setTransitioning] = useState(false)
  const [errors, setErrors] = useState({})
  const [phase, setPhase] = useState('form') // 'form' | 'submitting' | 'success' | 'error'
  const [submitError, setSubmitError] = useState('')
  const [successData, setSuccessData] = useState(null)

  const { data: subjectsData } = useQuery({
    queryKey: ['all-subjects'],
    queryFn: getSubjects,
  })
  const subjects = subjectsData?.data?.subjects || subjectsData?.data || []

  const [form, setForm] = useState({
    // Step 1 — Personal
    photo: null,
    title: '', first_name: '', middle_name: '', last_name: '', date_of_birth: '',
    gender: '', nationality: 'Ghanaian', marital_status: '', number_of_dependants: 0,
    blood_group: 'unknown',
    // Step 2 — Identity
    ghana_card_number: '', ssnit_number: '', ntc_license_number: '',
    fingerprint_data: null,
    // Step 3 — Contact & Emergency
    phone: '', whatsapp_number: '', secondary_phone: '', email: '',
    residential_address: '', digital_address: '', city: '', region: '',
    emergency_contacts: [{ full_name: '', relationship: '', phone: '', whatsapp_number: '' }],
    // Step 4 — Employment
    employment_type: 'permanent', time_commitment: 'full_time', staff_category: '', teaches: false,
    position_name: '', branch: '', date_of_first_appointment: '', date_joined_school: '',
    is_on_probation: false, probation_end_date: '', is_head_of_department: false,
    leave_entitlement_days: 21, subject_specializations: [],
    // Step 5 — Pay & Qualifications
    salary_grade: '', bank_name: '', bank_branch: '', bank_account_number: '', momo_number: '',
    highest_qualification: '', institution_attended: '', years_of_experience: 0,
  })

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const toggleSubject = (subjectId) => {
    setForm((prev) => {
      const has = prev.subject_specializations.includes(subjectId)
      return {
        ...prev,
        subject_specializations: has
          ? prev.subject_specializations.filter((id) => id !== subjectId)
          : [...prev.subject_specializations, subjectId],
      }
    })
  }

  const handleCategoryChange = (value) => {
    // Teaching staff always teach. For anyone else it becomes a deliberate
    // choice, so the tick is cleared rather than carried over from a
    // previous selection.
    setForm((prev) => ({
      ...prev,
      staff_category: value,
      teaches: value === 'teaching',
    }))
  }

  const validateStep = (s) => {
    const errs = {}

    if (s === 1) {
      if (!form.first_name.trim()) errs.first_name = 'First name is required.'
      if (!form.last_name.trim()) errs.last_name = 'Last name is required.'
      if (!form.gender) errs.gender = 'Gender is required.'
    }

    if (s === 2) {
      if (!form.ghana_card_number.trim()) errs.ghana_card_number = 'Ghana Card number is required.'
    }

    if (s === 3) {
      if (!form.phone.trim()) errs.phone = 'Phone number is required.'

      // At least one reachable emergency contact. The first row always
      // exists, so this cannot be skipped by leaving the list empty.
      const contacts = form.emergency_contacts.length
        ? form.emergency_contacts
        : [{}]
      const contactErrors = contacts.map((c, i) => {
        if (i !== 0) return {}
        const ce = {}
        if (!c.full_name?.trim()) ce.full_name = 'Required.'
        if (!c.relationship) ce.relationship = 'Required.'
        if (!c.phone?.trim()) ce.phone = 'Required.'
        return ce
      })
      if (contactErrors.some((e) => Object.keys(e).length > 0)) {
        errs.emergency_contacts = contactErrors
      }
    }

    if (s === 4) {
      if (!form.employment_type) errs.employment_type = 'Employment type is required.'
      if (!form.staff_category) errs.staff_category = 'Staff category is required.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const changeStep = (nextStep) => {
    setTransitioning(true)
    setTimeout(() => {
      setStep(nextStep)
      setTransitioning(false)
    }, 220)
  }

  const goNext = () => {
    if (validateStep(step)) {
      changeStep(Math.min(step + 1, 6))
    }
  }
  const goBack = () => changeStep(Math.max(step - 1, 1))

  const handleSubmit = async () => {
    if (phase !== 'form') return
    setSubmitError('')
    setPhase('submitting')

    const payload = {
      title: form.title,
      first_name: form.first_name,
      middle_name: form.middle_name,
      last_name: form.last_name,
      date_of_birth: form.date_of_birth || undefined,
      gender: form.gender,
      nationality: form.nationality,
      marital_status: form.marital_status,
      number_of_dependants: form.number_of_dependants,
      blood_group: form.blood_group,
      ghana_card_number: form.ghana_card_number,
      ssnit_number: form.ssnit_number,
      ntc_license_number: form.ntc_license_number,
      photo: form.photo || undefined,
      fingerprint_data: form.fingerprint_data || undefined,
      phone: form.phone,
      whatsapp_number: form.whatsapp_number,
      secondary_phone: form.secondary_phone,
      email: form.email,
      residential_address: form.residential_address,
      digital_address: form.digital_address,
      city: form.city,
      region: form.region,
      employment_type: form.employment_type,
      time_commitment: form.time_commitment,
      staff_category: form.staff_category,
      teaches: form.teaches,
      position_name: form.position_name,
      salary_grade: form.salary_grade,
      date_of_first_appointment: form.date_of_first_appointment || undefined,
      date_joined_school: form.date_joined_school || undefined,
      is_on_probation: form.is_on_probation,
      probation_end_date: form.probation_end_date || undefined,
      is_head_of_department: form.is_head_of_department,
      leave_entitlement_days: form.leave_entitlement_days,
      highest_qualification: form.highest_qualification,
      institution_attended: form.institution_attended,
      years_of_experience: form.years_of_experience,
      subject_specializations: form.subject_specializations,
      bank_name: form.bank_name,
      bank_branch: form.bank_branch,
      bank_account_number: form.bank_account_number,
      momo_number: form.momo_number,
      emergency_contacts: form.emergency_contacts,
    }

    try {
      const res = await registerStaff(payload)
      setSuccessData(res.data || res)
      setPhase('success')
    } catch (err) {
      const data = err.response?.data
      const fieldError =
        data?.errors && typeof data.errors === 'object'
          ? Object.entries(data.errors)
              .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs[0] : msgs}`)
              .join(' \u00B7 ')
          : null
      const msg =
        (typeof data?.message === 'string' && data.message)
        || fieldError
        || (err.response?.status >= 500
          ? 'Something went wrong on our side. Please try again.'
          : 'Could not register this staff member. Please check the details and try again.')
      setSubmitError(msg)
      setPhase('form')
    }
  }

  const selectedSubjectNames = subjects
    .filter((s) => form.subject_specializations.includes(s.id))
    .map((s) => s.name)

  const primaryContact = form.emergency_contacts[0] || {}
  const fullName = [
    labelFor(TITLE_CHOICES, form.title),
    form.first_name,
    form.middle_name,
    form.last_name,
  ].filter(Boolean).join(' ')

  return (
    <div className="min-h-screen bg-[#f0ece1]">
      <PortalHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <Breadcrumb items={[
          {
            label: 'Dashboard',
            href: activeMember?.role === 'registrar' ? '/registrar' : activeMember?.role === 'accountant' ? '/accountant' : '/admin',
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )
          },
          {
            label: 'Register', href: STAFF_REGISTER_TAB, icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            )
          },
          {
            label: 'Register Staff', icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )
          },
        ]} />

          <div className="flex items-center gap-1 mt-6 mb-6 overflow-x-auto no-scrollbar">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    step === s.num ? 'bg-navy text-white' : step > s.num ? 'bg-gold text-navy' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step > s.num ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s.num}
                </div>
                <span className={`text-[10px] font-semibold text-center ${step === s.num ? 'text-navy' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 sm:w-14 h-0.5 mx-1 mb-4 ${step > s.num ? 'bg-gold' : 'bg-gray-100'}`} />
              )}
            </div>
          ))}
        </div>

        <div className={step === 6 ? '' : 'bg-[#faf8f4] rounded-2xl shadow-lg p-5 sm:p-8'}>
          <div
            className="transition-all duration-200 ease-out"
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'translateY(-8px)' : 'translateY(0)',
            }}
          >

            {/* STEP 1 — Personal */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                                <div className="text-sm font-bold text-navy">Personal Information</div>

                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Title">
                        <select className={inputClass} value={form.title} onChange={(e) => update('title', e.target.value)}>
                          {TITLE_CHOICES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </Field>
                      <Field label="First Name" required error={errors.first_name}>
                        <input className={errors.first_name ? inputErrorClass : inputClass} value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Middle Name">
                        <input className={inputClass} value={form.middle_name} onChange={(e) => update('middle_name', e.target.value)} />
                      </Field>
                      <Field label="Last Name" required error={errors.last_name}>
                        <input className={errors.last_name ? inputErrorClass : inputClass} value={form.last_name} onChange={(e) => update('last_name', e.target.value)} />
                      </Field>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <PhotoCapture
                      value={form.photo}
                      onChange={(file) => update('photo', file)}
                      allowCamera
                      variant="square"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100" />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Date of Birth">
                    <input type="date" className={inputClass} value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} />
                  </Field>
                  <Field label="Gender" required error={errors.gender}>
                    <select className={errors.gender ? inputErrorClass : inputClass} value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                      <option value="">Select...</option>
                      {GENDER_CHOICES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Marital Status">
                    <select className={inputClass} value={form.marital_status} onChange={(e) => update('marital_status', e.target.value)}>
                      {MARITAL_STATUS_CHOICES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Nationality">
                    <input className={inputClass} value={form.nationality} onChange={(e) => update('nationality', e.target.value)} />
                  </Field>
                  <Field label="Number of Dependants">
                    <input type="number" min="0" className={inputClass} value={form.number_of_dependants} onChange={(e) => update('number_of_dependants', Number(e.target.value))} />
                  </Field>
                  <Field label="Blood Group">
                    <select className={inputClass} value={form.blood_group} onChange={(e) => update('blood_group', e.target.value)}>
                      {BLOOD_GROUP_CHOICES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {/* STEP 2 — Identity */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <div className="text-sm font-bold text-navy mb-1">Identity &amp; Registration Numbers</div>
                  <div className="text-xs text-gray-400 mb-4">
                    The Ghana Card is required. SSNIT and NTC apply only to some staff.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Ghana Card Number" required error={errors.ghana_card_number}>
                      <input className={errors.ghana_card_number ? inputErrorClass : inputClass} placeholder="e.g. GHA-123456789-0" value={form.ghana_card_number} onChange={(e) => update('ghana_card_number', e.target.value)} />
                    </Field>
                    <Field label="SSNIT Number">
                      <input className={inputClass} value={form.ssnit_number} onChange={(e) => update('ssnit_number', e.target.value)} />
                    </Field>
                    <Field label="NTC License Number">
                      <input className={inputClass} value={form.ntc_license_number} onChange={(e) => update('ntc_license_number', e.target.value)} />
                    </Field>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="text-sm font-bold text-navy mb-1">Fingerprint Scan</div>
                  <div className="text-xs text-gray-400 mb-4">
                    Optional for now — upload a scan if you have compatible hardware.
                  </div>
                  <FingerprintUpload value={form.fingerprint_data} onChange={(file) => update('fingerprint_data', file)} />
                </div>
              </div>
            )}

            {/* STEP 3 — Contact & Emergency */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div className="text-sm font-bold text-navy">Contact &amp; Address</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Phone" required error={errors.phone}>
                    <input className={errors.phone ? inputErrorClass : inputClass} value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                  </Field>
                  <Field label="WhatsApp Number">
                    <input className={inputClass} value={form.whatsapp_number} onChange={(e) => update('whatsapp_number', e.target.value)} />
                  </Field>
                  <Field label="Secondary Phone">
                    <input className={inputClass} value={form.secondary_phone} onChange={(e) => update('secondary_phone', e.target.value)} />
                  </Field>
                </div>
                <Field label="Email">
                  <input type="email" className={inputClass} value={form.email} onChange={(e) => update('email', e.target.value)} />
                </Field>
                <Field label="Residential Address">
                  <textarea rows={2} className={inputClass} value={form.residential_address} onChange={(e) => update('residential_address', e.target.value)} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Digital Address (GhanaPost GPS)">
                    <input className={inputClass} placeholder="e.g. GA-183-9820" value={form.digital_address} onChange={(e) => update('digital_address', e.target.value)} />
                  </Field>
                  <Field label="City">
                    <input className={inputClass} value={form.city} onChange={(e) => update('city', e.target.value)} />
                  </Field>
                  <Field label="Region">
                    <select className={inputClass} value={form.region} onChange={(e) => update('region', e.target.value)}>
                      {GHANA_REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </Field>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <StaffEmergencyContactSection
                    contacts={form.emergency_contacts}
                    onChange={(next) => update('emergency_contacts', next)}
                    errors={errors.emergency_contacts || []}
                  />
                </div>
              </div>
            )}

            {/* STEP 4 — Employment */}
            {step === 4 && (
              <div className="flex flex-col gap-5">
                <div className="text-sm font-bold text-navy">Employment</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Employment Type" required error={errors.employment_type}>
                    <select className={errors.employment_type ? inputErrorClass : inputClass} value={form.employment_type} onChange={(e) => update('employment_type', e.target.value)}>
                      {EMPLOYMENT_TYPE_CHOICES.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Time Commitment">
                    <select className={inputClass} value={form.time_commitment} onChange={(e) => update('time_commitment', e.target.value)}>
                      {TIME_COMMITMENT_CHOICES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Staff Category" required error={errors.staff_category}>
                    <select className={errors.staff_category ? inputErrorClass : inputClass} value={form.staff_category} onChange={(e) => handleCategoryChange(e.target.value)}>
                      {STAFF_CATEGORY_CHOICES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                </div>

                <PositionTypeahead value={form.position_name} onChange={(text) => update('position_name', text)} />

                {form.staff_category && form.staff_category !== 'teaching' && (
                  <div className="bg-gray-50 rounded-lg p-3.5 flex gap-3 items-start">
                    <input
                      type="checkbox"
                      id="teaches"
                      checked={form.teaches}
                      onChange={(e) => update('teaches', e.target.checked)}
                      className="mt-0.5 flex-shrink-0 w-4 h-4 accent-navy"
                    />
                    <label htmlFor="teaches" className="cursor-pointer">
                      <div className="text-sm font-semibold text-navy">This person also teaches classes</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Tick this for a bursar, head of academics or anyone outside teaching staff
                        who still takes a class. They will appear on the assignment screen.
                      </div>
                    </label>
                  </div>
                )}

                {(form.staff_category === 'teaching' || form.teaches) && (
                  <Field label="Subject Specializations">
                    <div className="flex flex-wrap gap-2 border border-gray-200 rounded-lg p-3">
                      {subjects.length === 0 && (
                        <span className="text-xs text-gray-400">No subjects found for this school yet.</span>
                      )}
                      {subjects.map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => toggleSubject(s.id)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                            form.subject_specializations.includes(s.id)
                              ? 'bg-navy text-white border-navy'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </Field>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Date of First Appointment">
                    <input type="date" className={inputClass} value={form.date_of_first_appointment} onChange={(e) => update('date_of_first_appointment', e.target.value)} />
                  </Field>
                  <Field label="Date Joined This School">
                    <input type="date" className={inputClass} value={form.date_joined_school} onChange={(e) => update('date_joined_school', e.target.value)} />
                  </Field>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.is_on_probation} onChange={(e) => update('is_on_probation', e.target.checked)} className="w-4 h-4 accent-navy" />
                    <span className="text-sm text-gray-600">On Probation</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.is_head_of_department} onChange={(e) => update('is_head_of_department', e.target.checked)} className="w-4 h-4 accent-navy" />
                    <span className="text-sm text-gray-600">Head of Department</span>
                  </label>
                </div>
                {form.is_on_probation && (
                  <Field label="Probation End Date">
                    <input type="date" className={inputClass} value={form.probation_end_date} onChange={(e) => update('probation_end_date', e.target.value)} />
                  </Field>
                )}

                <Field label="Leave Entitlement (days per year)">
                  <input type="number" min="0" className={inputClass} value={form.leave_entitlement_days} onChange={(e) => update('leave_entitlement_days', Number(e.target.value))} />
                </Field>
              </div>
            )}

            {/* STEP 5 — Pay & Qualifications */}
            {step === 5 && (
              <div className="flex flex-col gap-6">
                <div>
                  <div className="text-sm font-bold text-navy mb-1">Pay</div>
                  <div className="text-xs text-gray-400 mb-4">
                    How this person is paid. Leave blank if the school has not decided yet.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <Field label="Salary Grade">
                      <input className={inputClass} value={form.salary_grade} onChange={(e) => update('salary_grade', e.target.value)} />
                    </Field>
                    <Field label="Bank Name">
                      <select className={inputClass} value={form.bank_name} onChange={(e) => update('bank_name', e.target.value)}>
                        {BANK_CHOICES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Bank Branch">
                      <input className={inputClass} value={form.bank_branch} onChange={(e) => update('bank_branch', e.target.value)} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Bank Account Number">
                      <input className={inputClass} value={form.bank_account_number} onChange={(e) => update('bank_account_number', e.target.value)} />
                    </Field>
                    <Field label="MoMo Number">
                      <input className={inputClass} value={form.momo_number} onChange={(e) => update('momo_number', e.target.value)} />
                    </Field>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="text-sm font-bold text-navy mb-4">Qualifications</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Highest Qualification">
                      <select className={inputClass} value={form.highest_qualification} onChange={(e) => update('highest_qualification', e.target.value)}>
                        {QUALIFICATION_CHOICES.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Institution Attended">
                      <input className={inputClass} value={form.institution_attended} onChange={(e) => update('institution_attended', e.target.value)} />
                    </Field>
                    <Field label="Years of Experience">
                      <input type="number" min="0" className={inputClass} value={form.years_of_experience} onChange={(e) => update('years_of_experience', Number(e.target.value))} />
                    </Field>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6 — Review */}
            {step === 6 && (
              <div className="flex flex-col gap-5">
                <div className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-navy text-white text-lg font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                      {form.photo ? (
                        <img src={URL.createObjectURL(form.photo)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (form.first_name?.[0] || '') + (form.last_name?.[0] || '')
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-serif text-xl font-bold text-navy truncate">{fullName || 'Unnamed staff member'}</div>
                      <div className="text-[13px] text-slate-500 mt-1">
                        {labelFor(STAFF_CATEGORY_CHOICES, form.staff_category) || 'No category'}
                        {form.position_name && <span> &middot; {form.position_name}</span>}
                        {form.teaches && <span> &middot; Teaches classes</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  <ReviewCard icon={icons.contact} title="Contact">
                    <Row label="Phone" value={form.phone} />
                    <Row label="WhatsApp" value={form.whatsapp_number} />
                    <Row label="Other phone" value={form.secondary_phone} />
                    <Row label="Email" value={form.email} />
                    <Row label="Address" value={form.residential_address} />
                    <Row label="Digital address" value={form.digital_address} />
                    <Row label="City" value={form.city} />
                    <Row label="Region" value={labelFor(GHANA_REGIONS, form.region)} />
                  </ReviewCard>

                  <ReviewCard icon={icons.employment} title="Employment">
                    <Row label="Type" value={labelFor(EMPLOYMENT_TYPE_CHOICES, form.employment_type)} />
                    <Row label="Commitment" value={labelFor(TIME_COMMITMENT_CHOICES, form.time_commitment)} />
                    <Row label="Category" value={labelFor(STAFF_CATEGORY_CHOICES, form.staff_category)} />
                    <Row label="Position" value={form.position_name} />
                    <Row label="First appointed" value={formatDate(form.date_of_first_appointment)} />
                    <Row label="Joined school" value={formatDate(form.date_joined_school)} />
                    <Row label="On probation" value={form.is_on_probation ? 'Yes' : 'No'} />
                    <Row label="Leave entitlement" value={`${form.leave_entitlement_days} days`} />
                  </ReviewCard>

                  <ReviewCard icon={icons.identity} title="Identity">
                    <Row label="Date of birth" value={formatDate(form.date_of_birth)} />
                    <Row label="Gender" value={labelFor(GENDER_CHOICES, form.gender)} />
                    <Row label="Nationality" value={form.nationality} />
                    <Row label="Marital status" value={labelFor(MARITAL_STATUS_CHOICES, form.marital_status)} />
                    <Row label="Ghana Card" value={form.ghana_card_number} />
                    <Row label="SSNIT" value={form.ssnit_number} />
                    <Row label="NTC licence" value={form.ntc_license_number} />
                    <Row label="Blood group" value={form.blood_group === 'unknown' ? '' : form.blood_group} />
                  </ReviewCard>

                  <ReviewCard icon={icons.qualifications} title="Qualifications">
                    <Row label="Highest" value={labelFor(QUALIFICATION_CHOICES, form.highest_qualification)} />
                    <Row label="Institution" value={form.institution_attended} />
                    <Row label="Experience" value={`${form.years_of_experience} years`} />
                    <Row label="Subjects" value={selectedSubjectNames.join(', ')} />
                  </ReviewCard>

                  <ReviewCard icon={icons.pay} title="Pay">
                    <Row label="Salary grade" value={form.salary_grade} />
                    <Row label="Bank" value={labelFor(BANK_CHOICES, form.bank_name)} />
                    <Row label="Branch" value={form.bank_branch} />
                    <Row label="Account number" value={form.bank_account_number} />
                    <Row label="MoMo number" value={form.momo_number} />
                  </ReviewCard>

                  <ReviewCard icon={icons.emergency} title="Emergency contact">
                    <Row label="Name" value={primaryContact.full_name} />
                    <Row label="Relationship" value={primaryContact.relationship} />
                    <Row label="Phone" value={primaryContact.phone} />
                    <Row label="WhatsApp" value={primaryContact.whatsapp_number} />
                    {form.emergency_contacts.length > 1 && (
                      <Row label="Other contacts" value={`${form.emergency_contacts.length - 1} more`} />
                    )}
                  </ReviewCard>
                </div>

                {submitError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {submitError}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={`flex items-center justify-between mt-8 pt-6 ${step === 6 ? '' : 'border-t border-gray-100'}`}>
            <button
              onClick={goBack}
              disabled={step === 1}
              className="text-sm font-semibold text-gray-500 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-0 disabled:pointer-events-none"
            >
              Back
            </button>

            {step < 6 ? (
              <button
                onClick={goNext}
                className="bg-navy text-white text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-navy-light transition"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={phase !== 'form'}
                className="bg-gold text-navy text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-gold-light transition disabled:opacity-50"
              >
                {phase === 'submitting' ? 'Registering...' : 'Confirm & Register Staff'}
              </button>
            )}
          </div>
        </div>
      </div>

      {phase === 'success' && successData && (
        <div className="fixed inset-0 bg-navy/95 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
          <div className="flex flex-col items-center text-center animate-success-pop max-w-sm">
            <div className="w-20 h-20 rounded-full bg-gold flex items-center justify-center mb-6 animate-success-ring">
              <svg className="w-10 h-10 text-navy animate-success-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
              {successData.full_name || `${form.first_name} ${form.last_name}`} Registered!
            </h2>
            <p className="text-white/60 text-sm mb-8">
              Staff ID: <span className="text-gold font-semibold">{successData.staff_id}</span>
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-white/10 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-white/15 transition"
              >
                Register Another
              </button>
              <button
                onClick={() => navigate('/admin/staff')}
                className="flex-1 bg-gold text-navy text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-gold-light transition"
              >
                View Staff List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffRegistrationWizard