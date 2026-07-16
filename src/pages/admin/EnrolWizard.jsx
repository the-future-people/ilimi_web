import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PortalHeader from '../../components/layout/PortalHeader'
import { getSchoolClassrooms } from '../../api/academics'
import { enrolStudent, getAllStudents, uploadStudentFile, uploadGuardianFile } from '../../api/students'
import PhotoCapture from '../../components/PhotoCapture'
import FingerprintUpload from '../../components/FingerprintUpload'
import GuardianSection from '../../components/GuardianSection'

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

const steps = [
  { num: 1, label: 'Personal' },
  { num: 2, label: 'Photo & Fingerprint' },
  { num: 3, label: 'Guardian' },
  { num: 4, label: 'Academic' },
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

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const emptyPerson = () => ({
  title: '', first_name: '', last_name: '', relationship: '',
  phone: '', whatsapp_number: '', secondary_phone: '',
  photo: null, fingerprint_data: null,
  residential_address: '', digital_address: '',
  occupation_name: '', ghana_card_number: '',
  ghana_card_front: null, ghana_card_back: null,
  can_pickup: true, is_fee_payer: false,
})

function EnrolWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [transitioning, setTransitioning] = useState(false)
  const [errors, setErrors] = useState({})
  const [phase, setPhase] = useState('form') // 'form' | 'processing' | 'success' | 'error'
  const [processLabels, setProcessLabels] = useState([])
  const [processIndex, setProcessIndex] = useState(0)
  const [submitError, setSubmitError] = useState('')
  const [successData, setSuccessData] = useState(null)
  const [confirmSkipPhoto, setConfirmSkipPhoto] = useState(false)
  const stepperRef = useRef(null)
  const [canScrollStepperLeft, setCanScrollStepperLeft] = useState(false)
  const [canScrollStepperRight, setCanScrollStepperRight] = useState(false)

  const checkStepperScroll = () => {
    const el = stepperRef.current
    if (!el) return
    setCanScrollStepperLeft(el.scrollLeft > 4)
    setCanScrollStepperRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  const scrollStepper = (direction) => {
    const el = stepperRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' })
  }

  const { data: classroomsData } = useQuery({
    queryKey: ['school-classrooms'],
    queryFn: getSchoolClassrooms,
  })
  const classrooms = classroomsData?.data?.classrooms || []

  const [form, setForm] = useState({
    // Step 1 — Personal
    first_name: '', middle_name: '', last_name: '', date_of_birth: '',
    gender: '', ghana_card_number: '', birth_certificate_number: '',
    place_of_birth: '', home_town: '', nationality: 'Ghanaian',
    mother_tongue: '', religion: '',
    // Step 2 — Photo & Fingerprint
    photo: null, fingerprint_data: null,
    // Step 3 — Guardians
    parents: [emptyPerson()],
    guardians: [],
    // Step 4 — Academic
    enrollment_date: new Date().toISOString().split('T')[0], current_class: '',
    previous_school: '', expected_graduation_year: '', boarding_status: 'day',
    house_dormitory: '', bus_route: '', locker_number: '',
    siblings: [], // [{id, full_name}]
    // Step 5 — Health
    blood_group: 'unknown', known_allergies: '', medical_notes: '',
    disability_status: false, disability_description: '', nhis_number: '',
    talents_skills: '', additional_notes: '',
    emergency_choice: '', // 'parent-0', 'guardian-1', or 'other'
    emergency_full_name: '', emergency_relationship: '', emergency_phone: '',
  })
  useEffect(() => {
    checkStepperScroll()
    const el = stepperRef.current
    if (!el) return
    el.addEventListener('scroll', checkStepperScroll)
    window.addEventListener('resize', checkStepperScroll)
    return () => {
      el.removeEventListener('scroll', checkStepperScroll)
      window.removeEventListener('resize', checkStepperScroll)
    }
  }, [step])

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  // ── Sibling search (Academic step) ──────────────────────────────────
  const [siblingQuery, setSiblingQuery] = useState('')
  const [siblingResults, setSiblingResults] = useState([])
  const siblingDebounceRef = useRef(null)

  const handleSiblingSearch = (text) => {
    setSiblingQuery(text)
    if (siblingDebounceRef.current) clearTimeout(siblingDebounceRef.current)
    if (text.trim().length < 2) {
      setSiblingResults([])
      return
    }
    siblingDebounceRef.current = setTimeout(async () => {
      try {
        const res = await getAllStudents({ search: text.trim() })
        setSiblingResults(res.data?.students || [])
      } catch {
        setSiblingResults([])
      }
    }, 300)
  }

  const addSibling = (student) => {
    if (form.siblings.some((s) => s.id === student.id)) return
    update('siblings', [...form.siblings, { id: student.id, full_name: student.full_name }])
    setSiblingQuery('')
    setSiblingResults([])
  }

  const removeSibling = (id) => {
    update('siblings', form.siblings.filter((s) => s.id !== id))
  }

  // ── Validation ───────────────────────────────────────────────────────
  const validateStep = (s) => {
    const errs = {}
    if (s === 1) {
      if (!form.first_name.trim()) errs.first_name = 'First name is required.'
      if (!form.last_name.trim()) errs.last_name = 'Last name is required.'
      if (!form.date_of_birth) errs.date_of_birth = 'Date of birth is required.'
      if (!form.gender) errs.gender = 'Gender is required.'
    }
    if (s === 3) {
      const primary = form.parents[0]
      if (!primary?.first_name?.trim()) errs.first_name = 'Required.'
      if (!primary?.last_name?.trim()) errs.last_name = 'Required.'
      if (!primary?.phone?.trim()) errs.phone = 'Required.'
      if (!primary?.relationship) errs.relationship = 'Required.'
    }
    if (s === 4) {
      if (!form.enrollment_date) errs.enrollment_date = 'Enrollment date is required.'
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

  // ── Submission (two-phase: JSON create, then sequential file uploads) ─
const handleSubmit = async () => {
    if (phase !== 'form') return
    setSubmitError('')

    const allGuardians = [
      ...form.parents.map((p, i) => ({ ...p, __isPrimary: i === 0 })),
      ...form.guardians.map((g) => ({ ...g, __isPrimary: false })),
    ].filter((g) => g.first_name?.trim() && g.phone?.trim())

    const guardiansPayload = allGuardians.map((g) => ({
      title: g.title || '',
      first_name: g.first_name,
      last_name: g.last_name,
      relationship: g.relationship,
      occupation_name: g.occupation_name || '',
      nationality: 'Ghanaian',
      phone: g.phone,
      whatsapp_number: g.whatsapp_number || '',
      secondary_phone: g.secondary_phone || '',
      residential_address: g.residential_address || '',
      digital_address: g.digital_address || '',
      ghana_card_number: g.ghana_card_number || '',
      can_pickup: g.can_pickup ?? true,
      is_fee_payer: g.is_fee_payer || false,
      is_primary: g.__isPrimary,
    }))

    const incompleteGuardian = allGuardians.find((g) => !g.relationship)
    if (incompleteGuardian) {
      setSubmitError(`Please select a relationship for ${incompleteGuardian.first_name} before submitting.`)
      return
    }

    let emergency_contacts = []
    if (form.emergency_choice === 'other') {
      if (form.emergency_full_name.trim() && form.emergency_phone.trim()) {
        emergency_contacts = [{
          full_name: form.emergency_full_name,
          relationship: form.emergency_relationship || 'other',
          phone: form.emergency_phone,
          whatsapp_number: '',
          is_primary: true,
        }]
      }
    } else if (form.emergency_choice) {
      const chosen = allGuardians[Number(form.emergency_choice.split('-')[1])]
      if (chosen) {
        emergency_contacts = [{
          full_name: `${chosen.first_name} ${chosen.last_name}`,
          relationship: chosen.relationship || 'other',
          phone: chosen.phone,
          whatsapp_number: chosen.whatsapp_number || '',
          is_primary: true,
        }]
      }
    }

    const payload = {
      first_name: form.first_name,
      middle_name: form.middle_name,
      last_name: form.last_name,
      date_of_birth: form.date_of_birth,
      gender: form.gender,
      ghana_card_number: form.ghana_card_number,
      birth_certificate_number: form.birth_certificate_number,
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
      sibling_ids: form.siblings.map((s) => s.id),
      blood_group: form.blood_group,
      known_allergies: form.known_allergies,
      medical_notes: form.medical_notes,
      disability_status: form.disability_status,
      disability_description: form.disability_description,
      nhis_number: form.nhis_number,
      talents_skills: form.talents_skills,
      additional_notes: form.additional_notes,
      guardians: guardiansPayload,
      emergency_contacts,
    }

    // Precompute the full checklist of labels up front — the "pre-creation"
    // labels animate on a timer while the real request is in flight; the
    // upload labels are then walked through one at a time as each real
    // upload actually happens.
    const name = form.first_name || 'the student'
    const className = selectedClassroom?.full_name

    const preLabels = [
      `Assembling ${name}'s data...`,
      `Creating student profile...`,
      `Registering guardians...`,
      className ? `Placing ${name} into ${className}...` : `Finalizing academic record...`,
    ]

    const uploadTasks = []
    if (form.photo) uploadTasks.push({ label: `Uploading ${name}'s photo...`, kind: 'student', field: 'photo', file: form.photo })
    if (form.fingerprint_data) uploadTasks.push({ label: `Uploading ${name}'s fingerprint scan...`, kind: 'student', field: 'fingerprint_data', file: form.fingerprint_data })
    allGuardians.forEach((g) => {
      if (g.photo) uploadTasks.push({ label: `Uploading photo for ${g.first_name}...`, kind: 'guardian', field: 'photo', file: g.photo, guardianRef: g })
      if (g.fingerprint_data) uploadTasks.push({ label: `Uploading fingerprint for ${g.first_name}...`, kind: 'guardian', field: 'fingerprint_data', file: g.fingerprint_data, guardianRef: g })
      if (g.ghana_card_front) uploadTasks.push({ label: `Uploading Ghana Card (front) for ${g.first_name}...`, kind: 'guardian', field: 'ghana_card_front', file: g.ghana_card_front, guardianRef: g })
      if (g.ghana_card_back) uploadTasks.push({ label: `Uploading Ghana Card (back) for ${g.first_name}...`, kind: 'guardian', field: 'ghana_card_back', file: g.ghana_card_back, guardianRef: g })
    })

    const allLabels = [...preLabels, ...uploadTasks.map((t) => t.label), 'Finalizing enrollment...']
    setProcessLabels(allLabels)
    setProcessIndex(0)
    setPhase('processing')

    try {
      // Phase A — animate through the pre-creation labels on a timer while
      // the real create request is in flight; hold on the last one if the
      // request takes longer than the animation.
      const enrolPromise = enrolStudent(payload)
      let i = 0
      const preInterval = setInterval(() => {
        i += 1
        if (i >= preLabels.length) {
          clearInterval(preInterval)
          return
        }
        setProcessIndex(i)
      }, 900)

      const res = await enrolPromise
      clearInterval(preInterval)
      setProcessIndex(preLabels.length - 1)
      await wait(400)

      const student = res.data || res
      const studentId = student.id
      const createdGuardians = student.guardians || []

      // Phase B — walk through real file uploads, one label at a time,
      // with a minimum visible duration so fast uploads don't flicker past.
      for (let t = 0; t < uploadTasks.length; t += 1) {
        setProcessIndex(preLabels.length + t)
        const task = uploadTasks[t]
        const start = Date.now()
        try {
          if (task.kind === 'student') {
            await uploadStudentFile(studentId, task.field, task.file)
          } else {
            const idx = allGuardians.indexOf(task.guardianRef)
            const created = createdGuardians[idx]
            const guardianId = created?.guardian?.id
            if (guardianId) {
              await uploadGuardianFile(guardianId, task.field, task.file)
            }
          }
        } catch {
          // A single file failing shouldn't derail an otherwise-successful
          // enrolment — the student and guardian records already exist.
        }
        const elapsed = Date.now() - start
        if (elapsed < 500) await wait(500 - elapsed)
      }

      // Phase C — finalize
      setProcessIndex(allLabels.length - 1)
      await wait(700)

      setSuccessData(student)
      setPhase('success')
    } catch (err) {
      const msg = err.response?.data?.message
        || JSON.stringify(err.response?.data?.errors || err.response?.data)
        || 'Failed to enrol student. Please check the details and try again.'
      setSubmitError(msg)
      setPhase('error')
    }
  }

  const selectedClassroom = classrooms.find((c) => String(c.id) === String(form.current_class))
  const allGuardiansForReview = [...form.parents, ...form.guardians].filter((g) => g.first_name?.trim())

  return (
    <div className="min-h-screen">
      <PortalHeader />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-8">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
          <Link to="/admin" className="hover:text-navy transition">Dashboard</Link>
          <span className="text-gray-300">›</span>
          <Link to="/admin/students" className="hover:text-navy transition">Students &amp; Admissions</Link>
          <span className="text-gray-300">›</span>
          <span className="text-navy font-semibold">Enrol New Student</span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mb-6">Enrol New Student</h1>

        <div className="relative mb-6">
          {canScrollStepperLeft && (
            <button
              onClick={() => scrollStepper('left')}
              className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-gray-100 via-gray-100 to-transparent"
            >
              <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {canScrollStepperRight && (
            <button
              onClick={() => scrollStepper('right')}
              className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-gray-100 via-gray-100 to-transparent"
            >
              <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <div ref={stepperRef} className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
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
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-8">

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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="First Name" required error={errors.first_name}>
                  <input className={errors.first_name ? inputErrorClass : inputClass} value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />
                </Field>
                <Field label="Middle Name">
                  <input className={inputClass} value={form.middle_name} onChange={(e) => update('middle_name', e.target.value)} />
                </Field>
                <Field label="Last Name (Surname)" required error={errors.last_name}>
                  <input className={errors.last_name ? inputErrorClass : inputClass} value={form.last_name} onChange={(e) => update('last_name', e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Date of Birth" required error={errors.date_of_birth}>
                  <input type="date" className={errors.date_of_birth ? inputErrorClass : inputClass} value={form.date_of_birth} onChange={(e) => update('date_of_birth', e.target.value)} />
                </Field>
                <Field label="Gender" required error={errors.gender}>
                  <select className={errors.gender ? inputErrorClass : inputClass} value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                    <option value="">Select...</option>
                    {GENDER_CHOICES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </Field>
              </div>

              <div className="pt-2 border-t border-gray-100" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Ghana Card Number">
                  <input className={inputClass} placeholder="e.g. GHA-123456789-0" value={form.ghana_card_number} onChange={(e) => update('ghana_card_number', e.target.value)} />
                </Field>
                <Field label="Birth Certificate Number">
                  <input className={inputClass} value={form.birth_certificate_number} onChange={(e) => update('birth_certificate_number', e.target.value)} />
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Nationality">
                  <input className={inputClass} value={form.nationality} onChange={(e) => update('nationality', e.target.value)} />
                </Field>
                <Field label="Mother Tongue">
                  <input className={inputClass} value={form.mother_tongue} onChange={(e) => update('mother_tongue', e.target.value)} />
                </Field>
                <Field label="Religion">
                  <select className={inputClass} value={form.religion} onChange={(e) => update('religion', e.target.value)}>
                    {RELIGION_CHOICES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* STEP 2 — Photo & Fingerprint */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-sm font-bold text-navy mb-1">Student Photo</div>
                <div className="text-xs text-gray-400 mb-4">Take a photo now, or upload one if you already have it.</div>
                <PhotoCapture value={form.photo} onChange={(file) => { update('photo', file); setConfirmSkipPhoto(false) }} allowCamera />
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm font-bold text-navy mb-1">Fingerprint Scan</div>
                <div className="text-xs text-gray-400 mb-4">
                  Optional for now — upload a scan if you have compatible hardware. Live scanner capture is coming once biometric hardware is set up.
                </div>
                <FingerprintUpload value={form.fingerprint_data} onChange={(file) => update('fingerprint_data', file)} />
              </div>

              {confirmSkipPhoto && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
                  <div className="text-sm text-amber-800 font-semibold">No photo added — are you sure you want to skip this step?</div>
                  <div className="text-xs text-amber-700">You can add a photo later from the student's profile.</div>
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

          {/* STEP 3 — Guardian(s) */}
          {step === 3 && (
            <GuardianSection
              parents={form.parents}
              guardians={form.guardians}
              onChangeParents={(next) => update('parents', next)}
              onChangeGuardians={(next) => update('guardians', next)}
              errors={errors}
            />
          )}

          {/* STEP 4 — Academic */}
          {step === 4 && (
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

              <Field label="Sibling(s) already enrolled">
                <div className="relative">
                  <input
                    className={inputClass + " w-full"}
                    placeholder="Search by name..."
                    value={siblingQuery}
                    onChange={(e) => handleSiblingSearch(e.target.value)}
                  />
                  {siblingResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {siblingResults.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => addSibling(s)}
                          className="w-full text-left px-3 py-2 text-sm text-navy hover:bg-gray-50 transition"
                        >
                          {s.full_name} <span className="text-gray-400 text-xs">({s.student_id})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {form.siblings.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.siblings.map((s) => (
                      <span key={s.id} className="flex items-center gap-1.5 text-xs font-semibold bg-gold/10 text-amber-700 px-2.5 py-1 rounded-full">
                        {s.full_name}
                        <button type="button" onClick={() => removeSibling(s.id)} className="hover:text-red-600">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>

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
                <Field label="Bus Route (optional)">
                  <input className={inputClass} value={form.bus_route} onChange={(e) => update('bus_route', e.target.value)} />
                </Field>
                <Field label="Locker Number (optional)">
                  <input className={inputClass} value={form.locker_number} onChange={(e) => update('locker_number', e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          {/* STEP 5 — Health */}
          {step === 5 && (
            <div className="flex flex-col gap-5">
              <div className="text-sm font-bold text-navy">Health Information</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Blood Group">
                  <select className={inputClass} value={form.blood_group} onChange={(e) => update('blood_group', e.target.value)}>
                    {BLOOD_GROUP_CHOICES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </Field>
                <Field label="NHIS Card Number">
                  <input className={inputClass} value={form.nhis_number} onChange={(e) => update('nhis_number', e.target.value)} />
                </Field>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.disability_status} onChange={(e) => update('disability_status', e.target.checked)} className="w-4 h-4 accent-navy" />
                <span className="text-sm text-gray-600">Has a disability</span>
              </label>
              {form.disability_status && (
                <Field label="Disability Description">
                  <textarea rows={2} className={inputClass} value={form.disability_description} onChange={(e) => update('disability_description', e.target.value)} />
                </Field>
              )}
              <Field label="Known Allergies">
                <textarea rows={2} className={inputClass} value={form.known_allergies} onChange={(e) => update('known_allergies', e.target.value)} />
              </Field>
              <Field label="Medical Notes">
                <textarea rows={2} className={inputClass} value={form.medical_notes} onChange={(e) => update('medical_notes', e.target.value)} />
              </Field>
              <Field label="Talents & Skills">
                <textarea rows={2} className={inputClass} value={form.talents_skills} onChange={(e) => update('talents_skills', e.target.value)} />
              </Field>
              <Field label="Additional Notes">
                <textarea rows={2} className={inputClass} value={form.additional_notes} onChange={(e) => update('additional_notes', e.target.value)} />
              </Field>

              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm font-bold text-navy mb-3">Emergency Contact (Priority)</div>
                <Field label="Who should be contacted first in an emergency?">
                  <select
                    className={inputClass}
                    value={form.emergency_choice}
                    onChange={(e) => update('emergency_choice', e.target.value)}
                  >
                    <option value="">Select...</option>
                    {allGuardiansForReview.map((g, i) => (
                      <option key={i} value={`g-${i}`}>{g.first_name} {g.last_name}</option>
                    ))}
                    <option value="other">Someone else (not listed)</option>
                  </select>
                </Field>

                {form.emergency_choice === 'other' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <Field label="Full Name">
                      <input className={inputClass} value={form.emergency_full_name} onChange={(e) => update('emergency_full_name', e.target.value)} />
                    </Field>
                    <Field label="Phone">
                      <input className={inputClass} value={form.emergency_phone} onChange={(e) => update('emergency_phone', e.target.value)} />
                    </Field>
                    <Field label="Relationship">
                      <input className={inputClass} value={form.emergency_relationship} onChange={(e) => update('emergency_relationship', e.target.value)} />
                    </Field>
                  </div>
                )}
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
                  <div className="font-serif text-lg font-bold text-navy">{form.first_name} {form.middle_name} {form.last_name}</div>
                  <div className="text-xs text-gray-500">{form.date_of_birth} · {form.gender}</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Personal & Documents</div>
                <div className="text-sm text-navy grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <div>Ghana Card: {form.ghana_card_number || '—'}</div>
                  <div>Birth Cert.: {form.birth_certificate_number || '—'}</div>
                  <div>Place of Birth: {form.place_of_birth || '—'}</div>
                  <div>Home Town: {form.home_town || '—'}</div>
                  <div>Nationality: {form.nationality || '—'}</div>
                  <div>Religion: {form.religion || '—'}</div>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Academic</div>
                <div className="text-sm text-navy">{selectedClassroom?.full_name || 'Not yet assigned'}</div>
                <div className="text-xs text-gray-500 mt-1">Enrolling {form.enrollment_date}</div>
                {form.siblings.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">Siblings: {form.siblings.map((s) => s.full_name).join(', ')}</div>
                )}
              </div>

              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Parents & Guardians</div>
                <div className="flex flex-col gap-3">
                  {allGuardiansForReview.map((g, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {g.photo ? <img src={URL.createObjectURL(g.photo)} alt="" className="w-full h-full object-cover" /> : (g.first_name?.[0] || '?')}
                      </div>
                      <div className="text-sm">
                        <div className="text-navy font-semibold">{g.first_name} {g.last_name} <span className="text-gray-400 font-normal capitalize">({g.relationship})</span></div>
                        <div className="text-xs text-gray-500">{g.phone}{g.occupation_name ? ` · ${g.occupation_name}` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Health</div>
                <div className="text-sm text-navy grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <div>Blood Group: {form.blood_group}</div>
                  <div>NHIS: {form.nhis_number || '—'}</div>
                  <div>Disability: {form.disability_status ? 'Yes' : 'No'}</div>
                  <div>Talents: {form.talents_skills || '—'}</div>
                </div>
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
                Confirm & Enrol Student
              </button>
            )}
          </div>
        </div>
      </div>

      {phase === 'processing' && (
        <div className="fixed inset-0 bg-navy/95 backdrop-blur-sm z-[100] flex items-center justify-center px-4">
          <div className="flex flex-col items-center text-center w-full max-w-xs">
            <div className="w-14 h-14 rounded-full border-4 border-white/10 border-t-gold animate-spin mb-8" />
            <div className="flex flex-col gap-3 w-full">
              {processLabels.map((label, i) => (
                <div key={i} className="flex items-center gap-3 text-left">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                    i < processIndex ? 'bg-gold' : i === processIndex ? 'bg-white/15' : 'bg-white/5'
                  }`}>
                    {i < processIndex ? (
                      <svg className="w-3 h-3 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i === processIndex ? (
                      <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                    ) : null}
                  </div>
                  <span className={`text-sm transition ${i <= processIndex ? 'text-white' : 'text-white/30'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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