import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getSetupStatus,
  getClassrooms,
  createClassroom,
  getClassLevels,
} from '../../api/academics'
import AcademicYearSetup from './AcademicYearSetup'

function NewClassModal({ yearId, levels, onClose, onCreated }) {
  const [levelName, setLevelName] = useState('')
  const [sectionName, setSectionName] = useState('')
  const [capacity, setCapacity] = useState(40)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    if (!levelName) return setError('Choose a class level.')
    if (!sectionName.trim()) return setError('Give the class a name, e.g. Mandela or A.')

    setSubmitting(true)
    try {
      const res = await createClassroom(yearId, {
        class_level_name: levelName,
        section_name: sectionName.trim(),
        capacity: Number(capacity) || 40,
      })
      onCreated(res.message || 'Class created successfully.')
    } catch (err) {
      const data = err.response?.data
      const fieldError = data?.errors && Object.values(data.errors)[0]?.[0]
      setError(fieldError || data?.message || 'Could not create the class.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={() => !submitting && onClose()}
    >
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="font-serif text-lg font-bold text-navy mb-1">New Class</div>
        <div className="text-xs text-gray-400 mb-4">
          Pick the level, then give this class its own name.
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Class Level</label>
            <select
              value={levelName}
              onChange={(e) => setLevelName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold bg-white"
            >
              <option value="">Select a level...</option>
              {levels.map((l) => (
                <option key={l.name} value={l.name}>{l.display_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Class Name</label>
            <input
              type="text"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="e.g. Mandela, Nkrumah, A"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
              Shown as "{levels.find((l) => l.name === levelName)?.display_name || 'JHS 1'} {sectionName || 'Mandela'}"
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Capacity</label>
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2.5 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-navy text-white text-sm font-bold py-2.5 rounded-lg hover:bg-navy-light transition disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ClassCard({ classroom }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/50 transition">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-navy truncate">{classroom.full_name}</div>
          <div className="text-xs text-gray-400">
            {classroom.form_teacher_name || 'No form teacher assigned'}
          </div>
        </div>
      </div>
      <div className="text-xs text-gray-400 font-semibold whitespace-nowrap ml-3">
        {classroom.capacity} seats
      </div>
    </div>
  )
}

function ClassesTab() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState('')

  const { data: setupData, isLoading: setupLoading } = useQuery({
    queryKey: ['year-setup-status'],
    queryFn: getSetupStatus,
  })

  const needsSetup = setupData?.data?.needs_setup
  const academicYear = setupData?.data?.academic_year
  const yearId = academicYear?.id

  const { data: levelsData } = useQuery({
    queryKey: ['class-levels'],
    queryFn: getClassLevels,
    enabled: !needsSetup,
  })
  const availableLevels = levelsData?.data?.available_levels || []
  const levelOrder = useMemo(() => {
    const map = {}
    for (const l of availableLevels) map[l.name] = l.order
    return map
  }, [availableLevels])

  const { data: classData, isLoading: classLoading } = useQuery({
    queryKey: ['classrooms', yearId],
    queryFn: () => getClassrooms(yearId),
    enabled: !!yearId,
  })
  const classrooms = classData?.data?.classrooms || []

  // Group by level, most senior first — ordering comes from the API's
  // `order` field, never a hardcoded frontend list.
  const groups = useMemo(() => {
    const byLevel = {}
    for (const c of classrooms) {
      const key = c.class_level_display || 'Other'
      if (!byLevel[key]) byLevel[key] = { label: key, levelId: c.class_level, classrooms: [] }
      byLevel[key].classrooms.push(c)
    }
    const levelById = {}
    for (const l of levelsData?.data?.class_levels || []) levelById[l.id] = l
    return Object.values(byLevel).sort((a, b) => {
      const oa = levelById[a.levelId]?.order ?? levelOrder[a.levelId] ?? 999
      const ob = levelById[b.levelId]?.order ?? levelOrder[b.levelId] ?? 999
      return ob - oa
    })
  }, [classrooms, levelsData, levelOrder])

  const handleSetupComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['year-setup-status'] })
    queryClient.invalidateQueries({ queryKey: ['school-classrooms'] })
  }

  const handleCreated = (message) => {
    setShowModal(false)
    setToast(message)
    queryClient.invalidateQueries({ queryKey: ['classrooms', yearId] })
    queryClient.invalidateQueries({ queryKey: ['class-levels'] })
    queryClient.invalidateQueries({ queryKey: ['school-classrooms'] })
    setTimeout(() => setToast(''), 4000)
  }

  if (setupLoading) {
    return <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
  }

  if (needsSetup) {
    return <AcademicYearSetup onComplete={handleSetupComplete} />
  }

  return (
    <>
      {/* Year context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <div className="text-sm font-bold text-navy">
            {academicYear?.name}
            {academicYear?.current_term && (
              <span className="ml-2 text-[10px] font-bold text-gold-dark bg-gold/15 px-2 py-0.5 rounded-full uppercase">
                {academicYear.current_term.name_display}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {classrooms.length} class{classrooms.length !== 1 ? 'es' : ''} across {groups.length} level{groups.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-navy text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-navy-light transition whitespace-nowrap self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Class
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {classLoading && <div className="text-center py-14 text-gray-400 text-sm">Loading classes...</div>}

        {!classLoading && classrooms.length === 0 && (
          <div className="text-center py-16 px-6">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="text-sm font-bold text-navy mb-1">No classes yet</div>
            <p className="text-xs text-gray-400 max-w-xs mx-auto mb-5">
              Create your first class to start placing students. You can add as many as you need per level.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-navy text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-navy-light transition"
            >
              Create your first class
            </button>
          </div>
        )}

        {!classLoading && groups.map((group) => (
          <div key={group.label}>
            <div className="px-4 pt-5 pb-2 bg-gray-50/80 border-y-2 border-navy/10">
              <span className="text-sm font-bold text-navy">{group.label}</span>
              <span className="text-[11px] text-gray-400 font-semibold ml-2">
                {group.classrooms.length} class{group.classrooms.length !== 1 ? 'es' : ''}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {group.classrooms.map((c) => (
                <ClassCard key={c.id} classroom={c} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <NewClassModal
          yearId={yearId}
          levels={availableLevels}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}
    </>
  )
}

export default ClassesTab