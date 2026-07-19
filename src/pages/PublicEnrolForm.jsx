import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicInvite, submitPublicInvite } from '../api/students'
import PhotoCapture from '../components/PhotoCapture'

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

const BOARDING_CHOICES = [
  { value: '', label: 'Select...' },
  { value: 'day', label: 'Day Student' },
  { value: 'boarder', label: 'Full Boarder' },
  { value: 'weekly', label: 'Weekly Boarder' },
]

const PARENT_RELATIONSHIP_CHOICES = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
]

const GUARDIAN_RELATIONSHIP_CHOICES = [
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'guardian', label: 'Legal Guardian' },
  { value: 'other', label: 'Other' },
]

const steps = ['Personal', 'Photo', 'Guardian(s)', 'Academic', 'Health', 'Review']

const inputClass = "px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
const inputErrorClass = "px-3 py-2.5 border border-red-300 rounded-lg text-sm outline-none focus:border-red-400"

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

const emptyPerson = () => ({
  title: '', first_name: '', last_name: '', relationship: '',
  phone: '', whatsapp_number: '', occupation_name: '',
  residential_address: '', is_fee_payer: false,
})

function PublicGuardianCard({ data, onUpdate, onRemove, relationshipChoices, lockedRelationship, errors = {}, showRemove, isPrimary, tint }) {
  const update = (field, value) => onUpdate({ ...data, [field]: value })
  const tintClass = tint === 'parent1' ? 'border-navy/10 bg-navy/[0.02]'
    : tint === 'parent2' ? 'border-gold/20 bg-gold/[0.04]'
    : 'border-gray-200 bg-gray-50/60'

  return (
    <div className={`border rounded-xl p-4 flex flex-col gap-3 ${tintClass}`}>
      {showRemove && (
        <div className="flex justify-end -mb-1">
          <button type="button" onClick={onRemove} className="text-xs font-semibold text-red-500 hover:underline">
            Remove
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="First Name" required={isPrimary} error={errors.first_name}>
          <input className={errors.first_name ? inputErrorClass : inputClass} value={data.first_name} onChange={(e) => update('first_name', e.target.value)} />
        </Field>
        <Field label="Last Name" required={isPrimary} error={errors.last_name}>
          <input className={errors.last_name ? inputErrorClass : inputClass} value={data.last_name} onChange={(e) => update('last_name', e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Relationship to Ward" required={isPrimary} error={errors.relationship}>
          {lockedRelationship ? (
            <div className={`${inputClass} bg-gray-100 text-gray-500`}>
              {relationshipChoices.find((r) => r.value === lockedRelationship)?.label}
            </div>
          ) : (
            <select className={errors.relationship ? inputErrorClass : inputClass} value={data.relationship} onChange={(e) => update('relationship', e.target.value)}>
              <option value="">Select...</option>
              {relationshipChoices.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          )}
        </Field>
        <Field label="Phone" required={isPrimary} error={errors.phone}>
          <input className={errors.phone ? inputErrorClass : inputClass} value={data.phone} onChange={(e) => update('phone', e.target.value)} />
        </Field>
      </div>
      <Field label="Occupation">
        <input className={inputClass} value={data.occupation_name} onChange={(e) => update('occupation_name', e.target.value)} />
      </Field>
      <Field label="Residential Address">
        <textarea rows={2} className={inputClass} value={data.residential_address} onChange={(e) => update('residential_address', e.target.value)} />
      </Field>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={data.is_fee_payer} onChange={(e) => update('is_fee_payer', e.target.checked)} className="w-4 h-4 accent-navy" />
        <span className="text-sm text-gray-600">Responsible for paying school fees</span>
      </label>
    </div>
  )
}

export default function PublicEnrolForm() {
  const { token } = useParams()
  const [loadState, setLoadState] = useState('loading') // loading | ready | invalid | expired
  const [schoolName, setSchoolName] = useState('')
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [phase, setPhase] = useState('form') // form | submitting | success | error
  const [submitError, setSubmitError] = useState('')

  const [form, setForm] = useState({
    first_name: '', middle_name: '', last_name: '', date_of_birth: '',
    gender: '', place_of_birth: '', home_town: '', nationality: 'Ghanaian',
    mother_tongue: '', religion: '',
    photo: null,
    parents: [emptyPerson()],
    guardians: [],
    previous_school: '', boarding_status: '',
    blood_group: '', known_allergies: '', medical_notes: '',
    disability_status: false, disability_description: '', talents_skills: '',
    emergency_choice: '', emergency_full_name: '', emergency_relationship: '', emergency_phone: '',
  })

  useEffect(() => {
    getPublicInvite(token)
      .then((res) => {
        const data = res.data || res
        setSchoolName(data.school_name)
        setForm((f) => ({ ...f, first_name: data.prospective_first_name, last_name: data.prospective_last_name }))
        setLoadState('ready')
      })
      .catch((err) => {
        const code = err.response?.status
        setLoadState(code === 410 ? 'expired' : 'invalid')
      })
  }, [token])

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const updateParent = (index, updated) => {
    const next = [...form.parents]
    next[index] = updated
    update('parents', next)
  }
  const addParent = () => {
    if (form.parents.length >= 2) return
    const newPerson = emptyPerson()
    if (form.parents[0]?.relationship) {
      const remaining = PARENT_RELATIONSHIP_CHOICES.find((r) => r.value !== form.parents[0].relationship)?.value
      if (remaining) newPerson.relationship = remaining
    }
    update('parents', [...form.parents, newPerson])
  }
  const removeParent = (index) => update('parents', form.parents.filter((_, i) => i !== index))

  const secondParentLocked = form.parents.length === 2 && form.parents[0]?.relationship
    ? PARENT_RELATIONSHIP_CHOICES.find((r) => r.value !== form.parents[0].relationship)?.value
    : null

  const handleFirstParentUpdate = (updated) => {
    updateParent(0, updated)
    if (form.parents.length === 2 && updated.relationship) {
      const remaining = PARENT_RELATIONSHIP_CHOICES.find((r) => r.value !== updated.relationship)?.value
      if (remaining && form.parents[1]?.relationship !== remaining) {
        updateParent(1, { ...form.parents[1], relationship: remaining })
      }
    }
  }

  const updateGuardian = (index, updated) => {
    const next = [...form.guardians]
    next[index] = updated
    update('guardians', next)
  }
  const addGuardian = () => {
    if (form.guardians.length >= 5) return
    update('guardians', [...form.guardians, emptyPerson()])
  }
  const removeGuardian = (index) => update('guardians', form.guardians.filter((_, i) => i !== index))

  const allGuardiansForReview = [...form.parents, ...form.guardians].filter((g) => g.first_name?.trim())

  const validateStep = (s) => {
    const errs = {}
    if (s === 1) {
      if (!form.first_name.trim()) errs.first_name = 'Required.'
      if (!form.last_name.trim()) errs.last_name = 'Required.'
      if (!form.date_of_birth) errs.date_of_birth = 'Required.'
      if (!form.gender) errs.gender = 'Required.'
    }
    if (s === 3) {
      const primary = form.parents[0]
      const pErrs = {}
      if (!primary?.first_name?.trim()) pErrs.first_name = 'Required.'
      if (!primary?.last_name?.trim()) pErrs.last_name = 'Required.'
      if (!primary?.phone?.trim()) pErrs.phone = 'Required.'
      if (!primary?.relationship) pErrs.relationship = 'Required.'
      if (Object.keys(pErrs).length > 0) errs.primaryParent = pErrs
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const goNext = () => { if (validateStep(step)) setStep((s) => Math.min(s + 1, 6)) }
  const goBack = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    if (phase !== 'form') return
    setSubmitError('')
    setPhase('submitting')

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
      phone: g.phone,
      whatsapp_number: g.whatsapp_number || '',
      residential_address: g.residential_address || '',
      is_fee_payer: g.is_fee_payer || false,
      is_primary: g.__isPrimary,
    }))

    let emergency_contacts = []
    if (form.emergency_choice === 'other') {
      if (form.emergency_full_name.trim() && form.emergency_phone.trim()) {
        emergency_contacts = [{
          full_name: form.emergency_full_name,
          relationship: form.emergency_relationship || 'other',
          phone: form.emergency_phone,
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
      place_of_birth: form.place_of_birth,
      home_town: form.home_town,
      nationality: form.nationality,
      mother_tongue: form.mother_tongue,
      religion: form.religion,
      previous_school: form.previous_school,
      boarding_status: form.boarding_status,
      blood_group: form.blood_group,
      known_allergies: form.known_allergies,
      medical_notes: form.medical_notes,
      disability_status: form.disability_status,
      disability_description: form.disability_description,
      talents_skills: form.talents_skills,
      guardians: guardiansPayload,
      emergency_contacts,
      photo: form.photo || undefined,
    }

    try {
      await submitPublicInvite(token, payload)
      setPhase('success')
    } catch (err) {
      const status = err.response?.status
      if (status === 410) {
        setSubmitError(err.response?.data?.message || 'This link has already been used or has expired.')
      } else {
        setSubmitError(err.response?.data?.message || 'Something went wrong. Please try again.')
      }
      setPhase('error')
    }
  }

  if (loadState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    )
  }

  if (loadState === 'invalid' || loadState === 'expired') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="font-serif text-lg font-bold text-navy mb-2">
            {loadState === 'expired' ? 'This link has expired' : 'This link is invalid'}
          </div>
          <p className="text-sm text-gray-500">
            Please contact the school directly for a new enrolment link.
          </p>
        </div>
      </div>
    )
  }

  if (phase === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy px-4">
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-gold flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-white mb-2">Thank you!</h2>
          <p className="text-white/70 text-sm">
            {schoolName} will review your submission and be in touch shortly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-navy px-4 py-5 text-center">
        <div className="text-white font-serif text-lg font-bold">{schoolName}</div>
        <div className="text-white/60 text-xs mt-0.5">Student Enrolment Form</div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-1 mb-5 overflow-x-auto no-scrollbar">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                step === i + 1 ? 'bg-navy text-white' : step > i + 1 ? 'bg-gold text-navy' : 'bg-gray-200 text-gray-400'
              }`}>
                {i + 1}
              </div>
              {i < steps.length - 1 && <div className={`w-6 h-0.5 mx-1 ${step > i + 1 ? 'bg-gold' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="text-sm font-bold text-navy">Personal Information</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="First Name" required error={errors.first_name}>
                  <input className={errors.first_name ? inputErrorClass : inputClass} value={form.first_name} onChange={(e) => update('first_name', e.target.value)} />
                </Field>
                <Field label="Last Name" required error={errors.last_name}>
                  <input className={errors.last_name ? inputErrorClass : inputClass} value={form.last_name} onChange={(e) => update('last_name', e.target.value)} />
                </Field>
              </div>
              <Field label="Middle Name">
                <input className={inputClass} value={form.middle_name} onChange={(e) => update('middle_name', e.target.value)} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Place of Birth">
                  <input className={inputClass} value={form.place_of_birth} onChange={(e) => update('place_of_birth', e.target.value)} />
                </Field>
                <Field label="Home Town">
                  <input className={inputClass} value={form.home_town} onChange={(e) => update('home_town', e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="text-sm font-bold text-navy">Photo</div>
              <div className="text-xs text-gray-400">A recent photo of your child, if you have one handy.</div>
              <PhotoCapture value={form.photo} onChange={(file) => update('photo', file)} allowCamera />
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-sm font-bold text-navy mb-1">Parent(s)</div>
                <div className="text-xs text-gray-400 mb-3">At least one parent is required.</div>
                <div className="flex flex-col gap-3">
                  {form.parents.map((parent, i) => (
                    <PublicGuardianCard
                      key={i}
                      data={parent}
                      onUpdate={i === 0 ? handleFirstParentUpdate : (updated) => updateParent(i, updated)}
                      onRemove={() => removeParent(i)}
                      relationshipChoices={PARENT_RELATIONSHIP_CHOICES}
                      lockedRelationship={i === 1 ? secondParentLocked : null}
                      errors={i === 0 ? (errors.primaryParent || {}) : {}}
                      showRemove={i > 0}
                      isPrimary={i === 0}
                      tint={i === 0 ? 'parent1' : 'parent2'}
                    />
                  ))}
                </div>
                {form.parents.length < 2 && (
                  <button type="button" onClick={addParent} className="mt-2 text-xs font-semibold text-navy hover:underline">
                    + Add Another Parent
                  </button>
                )}
              </div>
              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm font-bold text-navy mb-1">Other Guardians <span className="text-gray-400 font-normal">(optional)</span></div>
                <div className="flex flex-col gap-3">
                  {form.guardians.map((guardian, i) => (
                    <PublicGuardianCard
                      key={i}
                      data={guardian}
                      onUpdate={(updated) => updateGuardian(i, updated)}
                      onRemove={() => removeGuardian(i)}
                      relationshipChoices={GUARDIAN_RELATIONSHIP_CHOICES}
                      lockedRelationship={null}
                      errors={{}}
                      showRemove
                      isPrimary={false}
                      tint="guardian"
                    />
                  ))}
                </div>
                {form.guardians.length < 5 && (
                  <button type="button" onClick={addGuardian} className="mt-2 text-xs font-semibold text-navy hover:underline">
                    + Add Guardian
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-4">
              <div className="text-sm font-bold text-navy">Academic</div>
              <Field label="Previous School (if any)">
                <input className={inputClass} value={form.previous_school} onChange={(e) => update('previous_school', e.target.value)} />
              </Field>
              <Field label="Boarding Status">
                <select className={inputClass} value={form.boarding_status} onChange={(e) => update('boarding_status', e.target.value)}>
                  {BOARDING_CHOICES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </Field>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-4">
              <div className="text-sm font-bold text-navy">Health</div>
              <Field label="Blood Group (if known)">
                <input className={inputClass} value={form.blood_group} onChange={(e) => update('blood_group', e.target.value)} />
              </Field>
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

              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm font-bold text-navy mb-3">Emergency Contact</div>
                <Field label="Who should be contacted first in an emergency?">
                  <select className={inputClass} value={form.emergency_choice} onChange={(e) => update('emergency_choice', e.target.value)}>
                    <option value="">Select...</option>
                    {allGuardiansForReview.map((g, i) => (
                      <option key={i} value={`g-${i}`}>{g.first_name} {g.last_name}</option>
                    ))}
                    <option value="other">Someone else</option>
                  </select>
                </Field>
                {form.emergency_choice === 'other' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <Field label="Full Name">
                      <input className={inputClass} value={form.emergency_full_name} onChange={(e) => update('emergency_full_name', e.target.value)} />
                    </Field>
                    <Field label="Phone">
                      <input className={inputClass} value={form.emergency_phone} onChange={(e) => update('emergency_phone', e.target.value)} />
                    </Field>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                <div className="w-14 h-14 rounded-2xl bg-navy text-white text-base font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
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
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Parents &amp; Guardians</div>
                <div className="flex flex-col gap-2">
                  {allGuardiansForReview.map((g, i) => (
                    <div key={i} className="text-sm text-navy">
                      {g.first_name} {g.last_name} <span className="text-gray-400 capitalize">({g.relationship})</span> · {g.phone}
                    </div>
                  ))}
                </div>
              </div>
              {submitError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  {submitError}
                </div>
              )}
              <p className="text-xs text-gray-400">
                Once submitted, this form cannot be edited. If you need to make a correction afterward, please contact {schoolName} directly.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <button
              onClick={goBack}
              disabled={step === 1}
              className="text-sm font-semibold text-gray-500 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-0 disabled:pointer-events-none"
            >
              Back
            </button>
            {step < 6 ? (
              <button onClick={goNext} className="bg-navy text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-navy-light transition">
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={phase !== 'form'}
                className="bg-gold text-navy text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-gold-light transition disabled:opacity-50"
              >
                {phase === 'submitting' ? 'Submitting...' : 'Submit Enrolment Form'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}