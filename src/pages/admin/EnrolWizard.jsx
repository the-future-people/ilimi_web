import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { getSchoolClassrooms } from '../../api/academics'
import { enrolStudent } from '../../api/students'

const GENDER_CHOICES = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const RELIGION_CHOICES = [
  { value: '', label: 'Select...' },
  { value: 'christian', label: 'Christian' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'traditionalist', label: 'Traditionalist' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'None / Prefer not to say' },
]

const BLOOD_GROUP_CHOICES = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
]

const BOARDING_CHOICES = [
  { value: 'day', label: 'Day Student' },
  { value: 'boarder', label: 'Full Boarder' },
  { value: 'weekly', label: 'Weekly Boarder' },
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

const GUARDIAN_RELATIONSHIP_CHOICES = [
  { value: '', label: 'Select...' },
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'guardian', label: 'Legal Guardian' },
  { value: 'other', label: 'Other' },
]

const EC_RELATIONSHIP_CHOICES = [
  ...GUARDIAN_RELATIONSHIP_CHOICES,
  { value: 'family_friend', label: 'Family Friend' },
]

const steps = [
  { num: 1, label: 'Personal' },
  { num: 2, label: 'Academic' },
  { num: 3, label: 'Contact' },
  { num: 4, label: 'Guardian' },
  { num: 5, label: 'Health' },
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

function EnrolWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [phase, setPhase] = useState('form') // 'form' | 'processing' | 'success' | 'error'
  const [processStep, setProcessStep] = useState(0)
  const [submitError, setSubmitError] = useState('')
  const [successData, setSuccessData] = useState(null)

  const { data: classroomsData } = useQuery({
    queryKey: ['school-classrooms'],
    queryFn: getSchoolClassrooms,
  })
  const classrooms = classroomsData?.data?.classrooms || []

  const [form, setForm] = useState({
    // Step 1
    first_name: '', middle_name: '', last_name: '', date_of_birth: '',
    gender: '', place_of_birth: '', home_town: '', nationality: 'Ghanaian',
    mother_tongue: '', religion: '',
    // Step 2
    enrollment_date: new Date().toISOString().split('T')[0], current_class: '',
    previous_school: '', expected_graduation_year: '', boarding_status: 'day',
    house_dormitory: '', bus_route: '', locker_number: '',
    // Step 3
    residential_address: '', city: '', region: '',
    birth_certificate_number: '', nhis_number: '',
    // Step 4
    g1_first_name: '', g1_last_name: '', g1_relationship: '', g1_phone: '',
    g1_whatsapp: '', g1_email: '', g1_occupation: '', g1_employer: '',
    g1_address: '', g1_is_fee_payer: false,
    g2_first_name: '', g2_last_name: '', g2_relationship: '', g2_phone: '',
    g2_whatsapp: '', g2_email: '', g2_occupation: '', g2_is_fee_payer: false,
    // Step 5
    blood_group: 'unknown', known_allergies: '', medical_notes: '',
    disability_status: false, disability_description: '',
    talents_skills: '', additional_notes: '',
    emergency_full_name: '', emergency_relationship: '', emergency_phone: '',
    emergency_whatsapp: '',
  })

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const validateStep = (s) => {
    const errs = {}
    if (s === 1) {
      if (!form.first_name.trim()) errs.first_name = 'First name is required.'
      if (!form.last_name.trim()) errs.last_name = 'Last name is required.'
      if (!form.date_of_birth) errs.date_of_birth = 'Date of birth is required.'
      if (!form.gender) errs.gender = 'Gender is required.'
    }
    if (s === 2) {
      if (!form.enrollment_date) errs.enrollment_date = 'Enrollment date is required.'
    }
    if (s === 4) {
      if (!form.g1_first_name.trim()) errs.g1_first_name = 'Required.'
      if (!form.g1_last_name.trim()) errs.g1_last_name = 'Required.'
      if (!form.g1_phone.trim()) errs.g1_phone = 'Required.'
      if (!form.g1_relationship) errs.g1_relationship = 'Required.'
    }
    if (s === 5) {
      if (!form.emergency_full_name.trim()) errs.emergency_full_name = 'Required.'
      if (!form.emergency_phone.trim()) errs.emergency_phone = 'Required.'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const goNext = () => {
    if (validateStep(step)) setStep((s) => Math.min(s + 1, 6))
  }
  const goBack = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    if (phase !== 'form') return
    setSubmitError('')

    const guardians = [{
      first_name: form.g1_first_name,
      last_name: form.g1_last_name,
      relationship: form.g1_relationship,
      occupation: form.g1_occupation,
      employer: form.g1_employer,
      nationality: 'Ghanaian',
      phone: form.g1_phone,
      whatsapp_number: form.g1_whatsapp,
      email: form.g1_email,
      residential_address: form.g1_address,
      is_fee_payer: form.g1_is_fee_payer,
      is_primary: true,
    }]

    if (form.g2_first_name.trim() && form.g2_phone.trim()) {
      guardians.push({
        first_name: form.g2_first_name,
        last_name: form.g2_last_name,
        relationship: form.g2_relationship || 'other',
        occupation: form.g2_occupation,
        phone: form.g2_phone,
        whatsapp_number: form.g2_whatsapp,
        email: form.g2_email,
        is_fee_payer: form.g2_is_fee_payer,
        is_primary: false,
      })
    }

    const emergency_contacts = []
    if (form.emergency_full_name.trim() && form.emergency_phone.trim()) {
      emergency_contacts.push({
        full_name: form.emergency_full_name,
        relationship: form.emergency_relationship || 'other',
        phone: form.emergency_phone,
        whatsapp_number: form.emergency_whatsapp,
        is_primary: true,
      })
    }

    const payload = {
      first_name: form.first_name,
      middle_name: form.middle_name,
      last_name: form.last_name,
      date_of_birth: form.date_of_birth,
      gender: form.gender,
      place_of_birth: form.place_of_birth,
      home_town: form.home_town,
      nationality: form.nationality,
      mother_tongue: form.mother_tongue,
      religion: form.religion,
      current_class: form.current_class || null,
      enrollment_date: form.enrollment_date,
      previous_school: form.previous_school,
      expected_graduation_year: form.expected_graduation_year || null,
      boarding_status: form.boarding_status,
      house_dormitory: form.house_dormitory,
      bus_route: form.bus_route,
      locker_number: form.locker_number,
      residential_address: form.residential_address,
      city: form.city,
      region: form.region,
      birth_certificate_number: form.birth_certificate_number,
      nhis_number: form.nhis_number,
      blood_group: form.blood_group,
      known_allergies: form.known_allergies,
      medical_notes: form.medical_notes,
      disability_status: form.disability_status,
      disability_description: form.disability_description,
      talents_skills: form.talents_skills,
      additional_notes: form.additional_notes,
      guardians,
      emergency_contacts,
    }

    setPhase('processing')
    setProcessStep(0)
    apiDoneRef.current = false
    apiResultRef.current = null

    enrolStudent(payload)
      .then((res) => {
        apiResultRef.current = { success: true, data: res.data || res }
        apiDoneRef.current = true
      })
      .catch((err) => {
        const msg = err.response?.data?.message
          || JSON.stringify(err.response?.data?.errors || err.response?.data)
          || 'Failed to enrol student. Please check the details and try again.'
        apiResultRef.current = { success: false, message: msg }
        apiDoneRef.current = true
      })
  }

  const selectedClassroom = classrooms.find((c) => String(c.id) === String(form.current_class))

  const processSteps = [
    'Creating student profile...',
    'Linking guardian & emergency contacts...',
    ...(form.current_class ? ['Recording class placement...'] : []),
    'Sending SMS confirmation...',
  ]

  const apiDoneRef = useRef(false)
  const apiResultRef = useRef(null)

  useEffect(() => {
    if (phase !== 'processing') return

    const totalDurationMs = 10000
    const stepCount = processSteps.length - 1 // number of transitions needed
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

    // We've reached the last visual step — wait for the real API result
    const checkDone = setInterval(() => {
      if (apiDoneRef.current) {
        clearInterval(checkDone)
        const result = apiResultRef.current
        setTimeout(() => {
          if (result.success) {
            setSuccessData(result.data)
            setPhase('success')
          } else {
            setSubmitError(result.message)
            setPhase('error')
          }
        }, 350)
      }
    }, 150)

    return () => clearInterval(checkDone)
  }, [phase, processStep])

  return (
    <div className="min-h-screen">
      <PortalHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
          <Link to="/admin" className="hover:text-navy transition">Dashboard</Link>
          <span className="text-gray-300">›</span>
          <Link to="/admin/students" className="hover:text-navy transition">Students &amp; Admissions</Link>
          <span className="text-gray-300">›</span>
          <span className="text-navy font-semibold">Enrol New Student</span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mb-6">Enrol New Student</h1>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto no-scrollbar">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    step === s.num
                      ? 'bg-navy text-white'
                      : step > s.num
                      ? 'bg-gold text-navy'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step > s.num ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : s.num}
                </div>
                <span className={`text-[10px] font-semibold ${step === s.num ? 'text-navy' : 'text-gray-400'}`}>
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

          {/* STEP 1 — Personal Information */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="text-sm font-bold text-navy">Personal Information</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <Field label="Date of Birth" required error={errors.date_of_birth}>
                  <input type="date" className={errors.date_of_birth ? inputErrorClass : inputClass} value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} />
                </Field>
                <Field label="Gender" required error={errors.gender}>
                  <select className={errors.gender ? inputErrorClass : inputClass} value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                    <option value="">Select...</option>
                    {GENDER_CHOICES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </Field>
                <Field label="Religion">
                  <select className={inputClass} value={form.religion} onChange={(e) => update('religion', e.target.value)}>
                    {RELIGION_CHOICES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Place of Birth">
                  <input className={inputClass} value={form.place_of_birth} onChange={(e) => update('place_of_birth', e.target.value)} />
                </Field>
                <Field label="Home Town">
                  <input className={inputClass} value={form.home_town} onChange={(e) => update('home_town', e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nationality">
                  <input className={inputClass} value={form.nationality} onChange={(e) => update('nationality', e.target.value)} />
                </Field>
                <Field label="Mother Tongue">
                  <input className={inputClass} value={form.mother_tongue} onChange={(e) => update('mother_tongue', e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {/* STEP 2 — Academic Placement */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="text-sm font-bold text-navy">Academic Placement</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Enrollment Date" required error={errors.enrollment_date}>
                  <input type="date" className={errors.enrollment_date ? inputErrorClass : inputClass} value={form.enrollment_date} onChange={(e) => update('enrollment_date', e.target.value)} />
                </Field>
                <Field label="Class">
                  <select className={inputClass} value={form.current_class} onChange={(e) => update('current_class', e.target.value)}>
                    <option value="">Not yet assigned</option>
                    {classrooms.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Previous School">
                  <input className={inputClass} value={form.previous_school} onChange={(e) => update('previous_school', e.target.value)} />
                </Field>
                <Field label="Expected Graduation Year">
                  <input type="number" className={inputClass} value={form.expected_graduation_year} onChange={(e) => update('expected_graduation_year', e.target.value)} />
                </Field>
              </div>
              <Field label="Boarding Status">
                <select className={inputClass} value={form.boarding_status} onChange={(e) => update('boarding_status', e.target.value)}>
                  {BOARDING_CHOICES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </Field>
              {form.boarding_status !== 'day' && (
                <Field label="House / Dormitory">
                  <input className={inputClass} value={form.house_dormitory} onChange={(e) => update('house_dormitory', e.target.value)} />
                </Field>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Bus Route">
                  <input className={inputClass} value={form.bus_route} onChange={(e) => update('bus_route', e.target.value)} />
                </Field>
                <Field label="Locker Number">
                  <input className={inputClass} value={form.locker_number} onChange={(e) => update('locker_number', e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {/* STEP 3 — Contact & Documents */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="text-sm font-bold text-navy">Contact &amp; Documents</div>
              <Field label="Residential Address">
                <textarea rows={2} className={inputClass} value={form.residential_address} onChange={(e) => update('residential_address', e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="City">
                  <input className={inputClass} value={form.city} onChange={(e) => update('city', e.target.value)} />
                </Field>
                <Field label="Region">
                  <select className={inputClass} value={form.region} onChange={(e) => update('region', e.target.value)}>
                    {GHANA_REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Birth Certificate Number">
                  <input className={inputClass} value={form.birth_certificate_number} onChange={(e) => update('birth_certificate_number', e.target.value)} />
                </Field>
                <Field label="NHIS Card Number">
                  <input className={inputClass} value={form.nhis_number} onChange={(e) => update('nhis_number', e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {/* STEP 4 — Guardian Information */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-sm font-bold text-navy mb-4">Primary Guardian</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Field label="First Name" required error={errors.g1_first_name}>
                    <input className={errors.g1_first_name ? inputErrorClass : inputClass} value={form.g1_first_name} onChange={(e) => update('g1_first_name', e.target.value)} />
                  </Field>
                  <Field label="Last Name" required error={errors.g1_last_name}>
                    <input className={errors.g1_last_name ? inputErrorClass : inputClass} value={form.g1_last_name} onChange={(e) => update('g1_last_name', e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Field label="Relationship" required error={errors.g1_relationship}>
                    <select className={errors.g1_relationship ? inputErrorClass : inputClass} value={form.g1_relationship} onChange={(e) => update('g1_relationship', e.target.value)}>
                      {GUARDIAN_RELATIONSHIP_CHOICES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Phone" required error={errors.g1_phone}>
                    <input className={errors.g1_phone ? inputErrorClass : inputClass} value={form.g1_phone} onChange={(e) => update('g1_phone', e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Field label="WhatsApp Number">
                    <input className={inputClass} value={form.g1_whatsapp} onChange={(e) => update('g1_whatsapp', e.target.value)} />
                  </Field>
                  <Field label="Email">
                    <input type="email" className={inputClass} value={form.g1_email} onChange={(e) => update('g1_email', e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Field label="Occupation">
                    <input className={inputClass} value={form.g1_occupation} onChange={(e) => update('g1_occupation', e.target.value)} />
                  </Field>
                  <Field label="Employer">
                    <input className={inputClass} value={form.g1_employer} onChange={(e) => update('g1_employer', e.target.value)} />
                  </Field>
                </div>
                <Field label="Residential Address">
                  <textarea rows={2} className={inputClass} value={form.g1_address} onChange={(e) => update('g1_address', e.target.value)} />
                </Field>
                <label className="flex items-center gap-2 mt-3">
                  <input type="checkbox" checked={form.g1_is_fee_payer} onChange={(e) => update('g1_is_fee_payer', e.target.checked)} className="w-4 h-4 accent-navy" />
                  <span className="text-sm text-gray-600">Responsible for paying school fees</span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm font-bold text-navy mb-1">Second Guardian <span className="text-gray-400 font-normal">(optional)</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 mt-4">
                  <Field label="First Name">
                    <input className={inputClass} value={form.g2_first_name} onChange={(e) => update('g2_first_name', e.target.value)} />
                  </Field>
                  <Field label="Last Name">
                    <input className={inputClass} value={form.g2_last_name} onChange={(e) => update('g2_last_name', e.target.value)} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Field label="Relationship">
                    <select className={inputClass} value={form.g2_relationship} onChange={(e) => update('g2_relationship', e.target.value)}>
                      {GUARDIAN_RELATIONSHIP_CHOICES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Phone">
                    <input className={inputClass} value={form.g2_phone} onChange={(e) => update('g2_phone', e.target.value)} />
                  </Field>
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.g2_is_fee_payer} onChange={(e) => update('g2_is_fee_payer', e.target.checked)} className="w-4 h-4 accent-navy" />
                  <span className="text-sm text-gray-600">Responsible for paying school fees</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 5 — Health & Emergency Contact */}
          {step === 5 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-sm font-bold text-navy mb-4">Health Information</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Field label="Blood Group">
                    <select className={inputClass} value={form.blood_group} onChange={(e) => update('blood_group', e.target.value)}>
                      {BLOOD_GROUP_CHOICES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                  </Field>
                  <div className="flex items-end pb-2.5">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={form.disability_status} onChange={(e) => update('disability_status', e.target.checked)} className="w-4 h-4 accent-navy" />
                      <span className="text-sm text-gray-600">Has a disability</span>
                    </label>
                  </div>
                </div>
                {form.disability_status && (
                  <Field label="Disability Description">
                    <textarea rows={2} className={inputClass} value={form.disability_description} onChange={(e) => update('disability_description', e.target.value)} />
                  </Field>
                )}
                <Field label="Known Allergies">
                  <textarea rows={2} className={`${inputClass} mt-4`} value={form.known_allergies} onChange={(e) => update('known_allergies', e.target.value)} />
                </Field>
                <Field label="Medical Notes">
                  <textarea rows={2} className={`${inputClass} mt-4`} value={form.medical_notes} onChange={(e) => update('medical_notes', e.target.value)} />
                </Field>
                <Field label="Talents &amp; Skills">
                  <textarea rows={2} className={`${inputClass} mt-4`} value={form.talents_skills} onChange={(e) => update('talents_skills', e.target.value)} />
                </Field>
                <Field label="Additional Notes">
                  <textarea rows={2} className={`${inputClass} mt-4`} value={form.additional_notes} onChange={(e) => update('additional_notes', e.target.value)} />
                </Field>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm font-bold text-navy mb-4">Emergency Contact</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <Field label="Full Name" required error={errors.emergency_full_name}>
                    <input className={errors.emergency_full_name ? inputErrorClass : inputClass} value={form.emergency_full_name} onChange={(e) => update('emergency_full_name', e.target.value)} />
                  </Field>
                  <Field label="Relationship">
                    <select className={inputClass} value={form.emergency_relationship} onChange={(e) => update('emergency_relationship', e.target.value)}>
                      {EC_RELATIONSHIP_CHOICES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Phone" required error={errors.emergency_phone}>
                    <input className={errors.emergency_phone ? inputErrorClass : inputClass} value={form.emergency_phone} onChange={(e) => update('emergency_phone', e.target.value)} />
                  </Field>
                  <Field label="WhatsApp Number">
                    <input className={inputClass} value={form.emergency_whatsapp} onChange={(e) => update('emergency_whatsapp', e.target.value)} />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6 — Review */}
          {step === 6 && (
            <div className="flex flex-col gap-6">
              <div className="text-sm font-bold text-navy">Review &amp; Confirm</div>

              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Personal</div>
                <div className="text-sm text-navy">{form.first_name} {form.middle_name} {form.last_name}</div>
                <div className="text-xs text-gray-500 mt-1">{form.date_of_birth} · {form.gender}</div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Academic</div>
                <div className="text-sm text-navy">{selectedClassroom?.full_name || 'Not yet assigned'}</div>
                <div className="text-xs text-gray-500 mt-1">Enrolling {form.enrollment_date} · {BOARDING_CHOICES.find((b) => b.value === form.boarding_status)?.label}</div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Primary Guardian</div>
                <div className="text-sm text-navy">{form.g1_first_name} {form.g1_last_name}</div>
                <div className="text-xs text-gray-500 mt-1">{form.g1_phone} · {GUARDIAN_RELATIONSHIP_CHOICES.find((r) => r.value === form.g1_relationship)?.label}</div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Emergency Contact</div>
                <div className="text-sm text-navy">{form.emergency_full_name}</div>
                <div className="text-xs text-gray-500 mt-1">{form.emergency_phone}</div>
              </div>

              {submitError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
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
                Confirm & Enrol Student
              </button>
            )}
          </div>
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
                  <span className={`text-sm transition ${
                    i <= processStep ? 'text-white' : 'text-white/30'
                  }`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success overlay */}
      {phase === 'success' && successData && (
        <div className="fixed inset-0 bg-navy/95 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
          <div className="flex flex-col items-center text-center animate-success-pop max-w-sm">
            <div className="w-20 h-20 rounded-full bg-gold flex items-center justify-center mb-6 animate-success-ring">
              <svg className="w-10 h-10 text-navy animate-success-check" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
              {successData.full_name || `${form.first_name} ${form.last_name}`} Enrolled!
            </h2>
            <p className="text-white/60 text-sm mb-8">
              Student ID: <span className="text-gold font-semibold">{successData.student_id}</span>
            </p>
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-white/10 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-white/15 transition"
              >
                Enrol Another
              </button>
              <button
                onClick={() => navigate(`/admin/students/${successData.id}`)}
                className="flex-1 bg-gold text-navy text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-gold-light transition"
              >
                View Profile
              </button>
            </div>
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
            <h2 className="font-serif text-xl font-bold text-white mb-2">Enrolment Failed</h2>
            <p className="text-white/60 text-sm mb-6">{submitError}</p>
            <button
              onClick={() => setPhase('form')}
              className="bg-gold text-navy text-sm font-bold px-6 py-2.5 rounded-lg hover:bg-gold-light transition"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnrolWizard