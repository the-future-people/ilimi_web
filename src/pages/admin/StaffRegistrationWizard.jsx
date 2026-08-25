import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Breadcrumb from '../../components/layout/Breadcrumb'
import { useAuth } from '../../context/AuthContext'
import { useQuery } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { getSchoolClassrooms } from '../../api/academics'
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
  { num: 2, label: 'Photo & Fingerprint' },
  { num: 3, label: 'Contact' },
  { num: 4, label: 'Employment' },
  { num: 5, label: 'Banking & Next of Kin' },
  { num: 6, label: 'Review' },
]

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

function StaffRegistrationWizard() {
  const { activeMember } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [transitioning, setTransitioning] = useState(false)
  const [errors, setErrors] = useState({})
  const [phase, setPhase] = useState('form') // 'form' | 'submitting' | 'success' | 'error'
  const [submitError, setSubmitError] = useState('')
  const [successData, setSuccessData] = useState(null)
  const [confirmSkipPhoto, setConfirmSkipPhoto] = useState(false)

  const { data: classroomsData } = useQuery({
    queryKey: ['school-classrooms'],
    queryFn: getSchoolClassrooms,
  })
  const classrooms = classroomsData?.data?.classrooms || []

  const { data: subjectsData } = useQuery({
    queryKey: ['all-subjects'],
    queryFn: getSubjects,
  })
  const subjects = subjectsData?.data?.subjects || subjectsData?.data || []

  const [form, setForm] = useState({
    // Step 1 — Personal & Documents
    title: '', first_name: '', middle_name: '', last_name: '', date_of_birth: '',
    gender: '', nationality: 'Ghanaian', marital_status: '', number_of_dependants: 0,
    blood_group: 'unknown', ghana_card_number: '', ssnit_number: '', ntc_license_number: '',
    // Step 2 — Photo & Fingerprint
    photo: null, fingerprint_data: null,
    // Step 3 — Contact & Address
    phone: '', whatsapp_number: '', secondary_phone: '', email: '',
    residential_address: '', digital_address: '', city: '', region: '',
    // Step 4 — Employment & Qualifications
    employment_type: 'permanent', time_commitment: 'full_time', staff_category: '',
    position_name: '', salary_grade: '', date_of_first_appointment: '', date_joined_school: '',
    is_on_probation: false, probation_end_date: '', is_head_of_department: false,
    leave_entitlement_days: 21, highest_qualification: '', institution_attended: '',
    years_of_experience: 0, subject_specializations: [],
    // Step 5 — Banking & Next of Kin
    bank_name: '', bank_branch: '', bank_account_number: '', momo_number: '',
    next_of_kin_name: '', next_of_kin_relationship: '', next_of_kin_phone: '', next_of_kin_address: '',
    emergency_contacts: [],
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

  const validateStep = (s) => {
    const errs = {}
    if (s === 1) {
      if (!form.first_name.trim()) errs.first_name = 'First name is required.'
      if (!form.last_name.trim()) errs.last_name = 'Last name is required.'
      if (!form.gender) errs.gender = 'Gender is required.'
    }
    if (s === 3) {
      if (!form.phone.trim()) errs.phone = 'Phone number is required.'
    }
    if (s === 4) {
      if (!form.employment_type) errs.employment_type = 'Employment type is required.'
    }
    if (s === 5) {
      const contacts = form.emergency_contacts
      if (contacts.length > 0) {
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
    if (step === 2 && !form.photo && !confirmSkipPhoto) {
      setConfirmSkipPhoto(true)
      return
    }
    if (validateStep(step)) {
      setConfirmSkipPhoto(false)
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
      next_of_kin_name: form.next_of_kin_name,
      next_of_kin_relationship: form.next_of_kin_relationship,
      next_of_kin_phone: form.next_of_kin_phone,
      next_of_kin_address: form.next_of_kin_address,
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
              .join(' · ')
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

  return (
    <div className="min-h-screen">
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

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mb-6">Register Staff Member</h1>

        <div className="flex items-center gap-1 mb-6 overflow-x-auto no-scrollbar">
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

        <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">
          <div
            className="transition-all duration-200 ease-out"
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'translateY(-8px)' : 'translateY(0)',
            }}
          >

            {/* STEP 1 — Personal & Documents */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div className="text-sm font-bold text-navy">Personal Information</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Field label="Title">
                    <select className={inputClass} value={form.title} onChange={(e) => update('title', e.target.value)}>
                      {TITLE_CHOICES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="First Name" required error={errors.first_name}>
                    <input className={errors.first_name ? inputErrorClass : inputClass} value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />
                  </Field>
                  <Field label="Middle Name">
                    <input className={inputClass} value={form.middle_name} onChange={(e) => update('middle_name', e.target.value)} />
                  </Field>
                  <Field label="Last Name" required error={errors.last_name}>
                    <input className={errors.last_name ? inputErrorClass : inputClass} value={form.last_name} onChange={(e) => update('last_name', e.target.value)} />
                  </Field>
                </div>
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

                <div className="pt-2 border-t border-gray-100" />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Ghana Card Number">
                    <input className={inputClass} placeholder="e.g. GHA-123456789-0" value={form.ghana_card_number} onChange={(e) => update('ghana_card_number', e.target.value)} />
                  </Field>
                  <Field label="SSNIT Number">
                    <input className={inputClass} value={form.ssnit_number} onChange={(e) => update('ssnit_number', e.target.value)} />
                  </Field>
                  <Field label="NTC License Number">
                    <input className={inputClass} value={form.ntc_license_number} onChange={(e) => update('ntc_license_number', e.target.value)} />
                  </Field>
                </div>
              </div>
            )}

            {/* STEP 2 — Photo & Fingerprint */}
            {step === 2 && (
              <div className="flex flex-col gap-6">
                <div>
                  <div className="text-sm font-bold text-navy mb-1">Staff Photo</div>
                  <div className="text-xs text-gray-400 mb-4">Take a photo now, or upload one if you already have it.</div>
                  <PhotoCapture value={form.photo} onChange={(file) => { update('photo', file); setConfirmSkipPhoto(false) }} allowCamera />
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-sm font-bold text-navy mb-1">Fingerprint Scan</div>
                  <div className="text-xs text-gray-400 mb-4">
                    Optional for now — upload a scan if you have compatible hardware.
                  </div>
                  <FingerprintUpload value={form.fingerprint_data} onChange={(file) => update('fingerprint_data', file)} />
                </div>

                {confirmSkipPhoto && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
                    <div className="text-sm text-amber-800 font-semibold">No photo added — are you sure you want to skip this step?</div>
                    <div className="text-xs text-amber-700">You can add a photo later from the staff profile.</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setConfirmSkipPhoto(false); setStep(3) }}
                        className="text-xs font-bold bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition"
                      >
                        Skip Anyway
                      </button>
                      <button
                        onClick={() => setConfirmSkipPhoto(false)}
                        className="text-xs font-semibold text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-100 transition"
                      >
                        Go Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3 — Contact & Address */}
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
              </div>
            )}

            {/* STEP 4 — Employment & Qualifications */}
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
                  <Field label="Staff Category">
                    <select className={inputClass} value={form.staff_category} onChange={(e) => update('staff_category', e.target.value)}>
                      {STAFF_CATEGORY_CHOICES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                </div>

                <PositionTypeahead value={form.position_name} onChange={(text) => update('position_name', text)} />

                {form.staff_category === 'teaching' && (
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
                  <Field label="Salary Grade">
                    <input className={inputClass} value={form.salary_grade} onChange={(e) => update('salary_grade', e.target.value)} />
                  </Field>
                  <Field label="Branch">
                    <select className={inputClass} value={form.branch || ''} onChange={(e) => update('branch', e.target.value)}>
                      <option value="">Not specified</option>
                    </select>
                  </Field>
                </div>
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

            {/* STEP 5 — Banking & Next of Kin */}
            {step === 5 && (
              <div className="flex flex-col gap-6">
                <div>
                  <div className="text-sm font-bold text-navy mb-4">Banking</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
                  <div className="text-sm font-bold text-navy mb-4">Next of Kin</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <Field label="Full Name">
                      <input className={inputClass} value={form.next_of_kin_name} onChange={(e) => update('next_of_kin_name', e.target.value)} />
                    </Field>
                    <Field label="Relationship">
                      <input className={inputClass} value={form.next_of_kin_relationship} onChange={(e) => update('next_of_kin_relationship', e.target.value)} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Phone">
                      <input className={inputClass} value={form.next_of_kin_phone} onChange={(e) => update('next_of_kin_phone', e.target.value)} />
                    </Field>
                    <Field label="Address">
                      <input className={inputClass} value={form.next_of_kin_address} onChange={(e) => update('next_of_kin_address', e.target.value)} />
                    </Field>
                  </div>
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

            {/* STEP 6 — Review */}
            {step === 6 && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-2xl bg-navy text-white text-lg font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                    {form.photo ? (
                      <img src={URL.createObjectURL(form.photo)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (form.first_name?.[0] || '') + (form.last_name?.[0] || '')
                    )}
                  </div>
                  <div>
                    <div className="font-serif text-lg font-bold text-navy">
                      {TITLE_CHOICES.find((t) => t.value === form.title)?.label || ''} {form.first_name} {form.middle_name} {form.last_name}
                    </div>
                    <div className="text-xs text-gray-500">{form.gender} Â· {form.phone}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Personal</div>
                  <div className="text-sm text-navy grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <div>Nationality: {form.nationality || '—'}</div>
                    <div>Marital Status: {form.marital_status || '—'}</div>
                    <div>Ghana Card: {form.ghana_card_number || '—'}</div>
                    <div>SSNIT: {form.ssnit_number || '—'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Employment</div>
                  <div className="text-sm text-navy grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <div>Type: {EMPLOYMENT_TYPE_CHOICES.find((e) => e.value === form.employment_type)?.label}</div>
                    <div>Commitment: {TIME_COMMITMENT_CHOICES.find((t) => t.value === form.time_commitment)?.label}</div>
                    <div>Category: {form.staff_category || '—'}</div>
                    <div>Position: {form.position_name || '—'}</div>
                  </div>
                  {selectedSubjectNames.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">Subjects: {selectedSubjectNames.join(', ')}</div>
                  )}
                </div>

                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Emergency Contact</div>
                  {form.emergency_contacts.length === 0 ? (
                    <div className="text-sm text-gray-400">None added</div>
                  ) : (
                    <div className="text-sm text-navy">
                      {form.emergency_contacts[0].full_name} Â· {form.emergency_contacts[0].phone}
                    </div>
                  )}
                </div>

                {submitError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                    {submitError}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
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