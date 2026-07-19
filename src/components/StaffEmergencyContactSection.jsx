const RELATIONSHIP_CHOICES = [
  { value: '', label: 'Select...' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'child', label: 'Child' },
  { value: 'relative', label: 'Other Relative' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' },
]

const inputClass = "px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
const inputErrorClass = "px-3 py-2.5 border border-red-300 rounded-lg text-sm outline-none focus:border-red-400"

const emptyContact = () => ({
  full_name: '', relationship: '', phone: '', whatsapp_number: '', is_primary: false,
})

export default function StaffEmergencyContactSection({ contacts, onChange, errors = [] }) {
  const updateContact = (index, updated) => {
    const next = [...contacts]
    next[index] = updated
    onChange(next)
  }

  const addContact = () => {
    if (contacts.length >= 3) return
    const isFirst = contacts.length === 0
    onChange([...contacts, { ...emptyContact(), is_primary: isFirst }])
  }

  const removeContact = (index) => {
    onChange(contacts.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="text-sm font-bold text-navy mb-1">Emergency Contact(s)</div>
      <div className="text-xs text-gray-400 mb-4">Who should be contacted first in an emergency — up to 3.</div>

      <div className="flex flex-col gap-3">
        {contacts.map((contact, i) => {
          const contactErrors = errors[i] || {}
          return (
            <div key={i} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
              {contacts.length > 1 && (
                <div className="flex justify-end -mb-2">
                  <button
                    type="button"
                    onClick={() => removeContact(i)}
                    className="text-xs font-semibold text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">
                    Full Name {i === 0 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    className={contactErrors.full_name ? inputErrorClass : inputClass}
                    value={contact.full_name}
                    onChange={(e) => updateContact(i, { ...contact, full_name: e.target.value })}
                  />
                  {contactErrors.full_name && <span className="text-[11px] text-red-500">{contactErrors.full_name}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">
                    Relationship {i === 0 && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    className={contactErrors.relationship ? inputErrorClass : inputClass}
                    value={contact.relationship}
                    onChange={(e) => updateContact(i, { ...contact, relationship: e.target.value })}
                  >
                    {RELATIONSHIP_CHOICES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  {contactErrors.relationship && <span className="text-[11px] text-red-500">{contactErrors.relationship}</span>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">
                    Phone {i === 0 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    className={contactErrors.phone ? inputErrorClass : inputClass}
                    value={contact.phone}
                    onChange={(e) => updateContact(i, { ...contact, phone: e.target.value })}
                  />
                  {contactErrors.phone && <span className="text-[11px] text-red-500">{contactErrors.phone}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500">WhatsApp Number</label>
                  <input
                    className={inputClass}
                    value={contact.whatsapp_number}
                    onChange={(e) => updateContact(i, { ...contact, whatsapp_number: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {contacts.length < 3 && (
        <button
          type="button"
          onClick={addContact}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-navy hover:underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Emergency Contact
        </button>
      )}
    </div>
  )
}