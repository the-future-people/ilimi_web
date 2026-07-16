import PhotoCapture from './PhotoCapture'
import FingerprintUpload from './FingerprintUpload'
import OccupationTypeahead from './OccupationTypeahead'

const TITLE_CHOICES = [
  { value: '', label: 'Select...' },
  { value: 'mr', label: 'Mr.' },
  { value: 'mrs', label: 'Mrs.' },
  { value: 'miss', label: 'Miss' },
  { value: 'dr', label: 'Dr.' },
  { value: 'prof', label: 'Prof.' },
  { value: 'rev', label: 'Rev.' },
  { value: 'pastor', label: 'Pastor' },
  { value: 'alhaji', label: 'Alhaji' },
  { value: 'hajia', label: 'Hajia' },
  { value: 'hon', label: 'Hon.' },
  { value: 'other', label: 'Other' },
]

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

export default function GuardianCard({
  data,
  onUpdate,
  onRemove,
  relationshipChoices,
  lockedRelationship,
  errors = {},
  showRemove,
  isPrimary,
}) {
  const update = (field, value) => onUpdate({ ...data, [field]: value })

  return (
    <div className="border border-gray-100 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
      {showRemove && (
        <div className="flex justify-end -mb-2">
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold text-red-500 hover:underline"
          >
            Remove
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Title">
          <select className={inputClass} value={data.title || ''} onChange={(e) => update('title', e.target.value)}>
            {TITLE_CHOICES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="First Name" required={isPrimary} error={errors.first_name}>
          <input className={errors.first_name ? inputErrorClass : inputClass} value={data.first_name || ''} onChange={(e) => update('first_name', e.target.value)} />
        </Field>
        <Field label="Last Name" required={isPrimary} error={errors.last_name}>
          <input className={errors.last_name ? inputErrorClass : inputClass} value={data.last_name || ''} onChange={(e) => update('last_name', e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Relationship to Ward" required={isPrimary} error={errors.relationship}>
          {lockedRelationship ? (
            <div className={`${inputClass} bg-gray-50 text-gray-500`}>
              {relationshipChoices.find((r) => r.value === lockedRelationship)?.label}
            </div>
          ) : (
            <select
              className={errors.relationship ? inputErrorClass : inputClass}
              value={data.relationship || ''}
              onChange={(e) => update('relationship', e.target.value)}
            >
              <option value="">Select...</option>
              {relationshipChoices.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          )}
        </Field>
        <Field label="Primary Phone" required={isPrimary} error={errors.phone}>
          <input className={errors.phone ? inputErrorClass : inputClass} value={data.phone || ''} onChange={(e) => update('phone', e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="WhatsApp Number">
          <input className={inputClass} value={data.whatsapp_number || ''} onChange={(e) => update('whatsapp_number', e.target.value)} />
        </Field>
        <Field label="Secondary Phone">
          <input className={inputClass} value={data.secondary_phone || ''} onChange={(e) => update('secondary_phone', e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PhotoCapture
          label="Photo"
          allowCamera={false}
          value={data.photo || null}
          onChange={(file) => update('photo', file)}
        />
        <FingerprintUpload
          label="Fingerprint Scan"
          value={data.fingerprint_data || null}
          onChange={(file) => update('fingerprint_data', file)}
        />
      </div>

      <Field label="Residential Address">
        <textarea rows={2} className={inputClass} value={data.residential_address || ''} onChange={(e) => update('residential_address', e.target.value)} />
      </Field>

      <Field label="Digital Address (GhanaPost GPS)">
        <input
          className={inputClass}
          placeholder="e.g. GA-183-9820"
          value={data.digital_address || ''}
          onChange={(e) => update('digital_address', e.target.value)}
        />
      </Field>

      <OccupationTypeahead
        label="Occupation"
        value={data.occupation_name || ''}
        onChange={(text) => update('occupation_name', text)}
      />

      <Field label="Ghana Card Number">
        <input
          className={inputClass}
          placeholder="e.g. GHA-123456789-0"
          value={data.ghana_card_number || ''}
          onChange={(e) => update('ghana_card_number', e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PhotoCapture
          label="Ghana Card (Front)"
          allowCamera={false}
          value={data.ghana_card_front || null}
          onChange={(file) => update('ghana_card_front', file)}
        />
        <PhotoCapture
          label="Ghana Card (Back)"
          allowCamera={false}
          value={data.ghana_card_back || null}
          onChange={(file) => update('ghana_card_back', file)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.can_pickup ?? true}
            onChange={(e) => update('can_pickup', e.target.checked)}
            className="w-4 h-4 accent-navy"
          />
          <span className="text-sm text-gray-600">Authorized to pick up the student</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.is_fee_payer || false}
            onChange={(e) => update('is_fee_payer', e.target.checked)}
            className="w-4 h-4 accent-navy"
          />
          <span className="text-sm text-gray-600">Responsible for paying school fees</span>
        </label>
      </div>
    </div>
  )
}