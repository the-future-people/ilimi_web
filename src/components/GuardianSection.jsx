import GuardianCard from './GuardianCard'

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

const emptyPerson = () => ({
  title: '', first_name: '', last_name: '', relationship: '',
  phone: '', whatsapp_number: '', secondary_phone: '',
  photo: null, fingerprint_data: null,
  residential_address: '', digital_address: '',
  occupation_name: '', ghana_card_number: '',
  ghana_card_front: null, ghana_card_back: null,
  can_pickup: true, is_fee_payer: false,
})

export default function GuardianSection({ parents, guardians, onChangeParents, onChangeGuardians, errors = {} }) {
  const updateParent = (index, updated) => {
    const next = [...parents]
    next[index] = updated
    onChangeParents(next)
  }

  const addParent = () => {
    if (parents.length >= 2) return
    const newPerson = emptyPerson()
    if (parents[0]?.relationship) {
      const remaining = PARENT_RELATIONSHIP_CHOICES.find((r) => r.value !== parents[0].relationship)?.value
      if (remaining) newPerson.relationship = remaining
    }
    onChangeParents([...parents, newPerson])
  }

  const removeParent = (index) => {
    onChangeParents(parents.filter((_, i) => i !== index))
  }

  const updateGuardian = (index, updated) => {
    const next = [...guardians]
    next[index] = updated
    onChangeGuardians(next)
  }

  const addGuardian = () => {
    if (guardians.length >= 5) return
    onChangeGuardians([...guardians, emptyPerson()])
  }

  const removeGuardian = (index) => {
    onChangeGuardians(guardians.filter((_, i) => i !== index))
  }

  // If parent 0 has chosen a relationship, parent 1 auto-locks to the remaining option
  const firstParentRelationship = parents[0]?.relationship
  const secondParentLocked = parents.length === 2 && firstParentRelationship
    ? PARENT_RELATIONSHIP_CHOICES.find((r) => r.value !== firstParentRelationship)?.value
    : null

  // Keep parent 1's stored relationship in sync with the lock, so submitted data is correct
  const handleFirstParentUpdate = (updated) => {
    updateParent(0, updated)
    if (parents.length === 2 && updated.relationship) {
      const remaining = PARENT_RELATIONSHIP_CHOICES.find((r) => r.value !== updated.relationship)?.value
      if (remaining && parents[1]?.relationship !== remaining) {
        updateParent(1, { ...parents[1], relationship: remaining })
      }
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="text-sm font-bold text-navy mb-1">Parent(s)</div>
        <div className="text-xs text-gray-400 mb-4">At least one parent is required.</div>

        <div className="flex flex-col gap-4">
          {parents.map((parent, i) => (
            <GuardianCard
              key={i}
              data={parent}
              onUpdate={i === 0 ? handleFirstParentUpdate : (updated) => updateParent(i, updated)}
              onRemove={() => removeParent(i)}
              relationshipChoices={PARENT_RELATIONSHIP_CHOICES}
              lockedRelationship={i === 1 ? secondParentLocked : null}
              errors={i === 0 ? errors : {}}
              showRemove={i > 0}
              isPrimary={i === 0}
            />
          ))}
        </div>

        {parents.length < 2 && (
          <button
            type="button"
            onClick={addParent}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-navy hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Another Parent
          </button>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100">
        <div className="text-sm font-bold text-navy mb-1">
          Other Guardians <span className="text-gray-400 font-normal">(optional)</span>
        </div>
        <div className="text-xs text-gray-400 mb-4">Add anyone else authorized in the child's life — up to 5.</div>

        <div className="flex flex-col gap-4">
          {guardians.map((guardian, i) => (
            <GuardianCard
              key={i}
              data={guardian}
              onUpdate={(updated) => updateGuardian(i, updated)}
              onRemove={() => removeGuardian(i)}
              relationshipChoices={GUARDIAN_RELATIONSHIP_CHOICES}
              lockedRelationship={null}
              errors={{}}
              showRemove
              isPrimary={false}
            />
          ))}
        </div>

        {guardians.length < 5 && (
          <button
            type="button"
            onClick={addGuardian}
            className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-navy hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Guardian
          </button>
        )}
      </div>
    </div>
  )
}