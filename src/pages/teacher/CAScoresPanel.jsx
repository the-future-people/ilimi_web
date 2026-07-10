import { useState, useEffect, useRef } from 'react'
import ScoreEntryList from './ScoreEntryList'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getStudentsByClassroom } from '../../api/students'
import { getClassroomCurrentTerm } from '../../api/academics'
import {
  getComponentTypes,
  getComponents,
  createComponent,
  saveComponentScores,
  getCAScores,
  saveExamScore,
  submitCAScores,
} from '../../api/caScores'

const gradeStyles = {
  A1: 'bg-green-50 text-green-700',
  B2: 'bg-blue-50 text-blue-700',
  B3: 'bg-blue-50 text-blue-700',
  C4: 'bg-amber-50 text-amber-700',
  C5: 'bg-amber-50 text-amber-700',
  C6: 'bg-amber-50 text-amber-700',
  D7: 'bg-red-50 text-red-700',
  E8: 'bg-red-50 text-red-700',
  F9: 'bg-red-50 text-red-700',
}

function CAScoresPanel({ classroomId, subjects }) {
  const queryClient = useQueryClient()
  const compScrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkCompScroll = () => {
    const el = compScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  const scrollComponents = (direction) => {
    const el = compScrollRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'left' ? -140 : 140, behavior: 'smooth' })
  }
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || null)
  const [selectedComponent, setSelectedComponent] = useState(null)
  const [componentScores, setComponentScores] = useState({})
  const [examScores, setExamScores] = useState({})
  const [editingExam, setEditingExam] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newComponent, setNewComponent] = useState({ component_type: '', name: '', max_score: 100, date: new Date().toISOString().split('T')[0] })
  const [toast, setToast] = useState(null)

  const { data: termData } = useQuery({
    queryKey: ['classroom-term', classroomId],
    queryFn: () => getClassroomCurrentTerm(classroomId),
  })
  const term = termData?.data?.term || termData?.term

  const { data: studentsData } = useQuery({
    queryKey: ['classroom-students', classroomId],
    queryFn: () => getStudentsByClassroom(classroomId),
  })
  const students = studentsData?.data?.students || []

  const { data: typesData } = useQuery({
    queryKey: ['ca-component-types'],
    queryFn: getComponentTypes,
  })
  const componentTypes = typesData?.data?.component_types || []

  const { data: componentsData, refetch: refetchComponents } = useQuery({
    queryKey: ['ca-components', classroomId, selectedSubject, term?.id],
    queryFn: () => getComponents(classroomId, selectedSubject, term?.id),
    enabled: !!selectedSubject && !!term?.id,
  })
  const components = componentsData?.data?.components || []

  const { data: scoresData, refetch: refetchScores } = useQuery({
    queryKey: ['ca-scores', classroomId, selectedSubject, term?.id],
    queryFn: () => getCAScores(classroomId, selectedSubject, term?.id),
    enabled: !!selectedSubject && !!term?.id,
  })
  const caScores = scoresData?.data?.scores || []
  const scoresByStudent = {}
  caScores.forEach((s) => { scoresByStudent[s.student] = s })

  useEffect(() => {
    if (components.length > 0 && !selectedComponent) {
      setSelectedComponent(components[0].id)
    }
  }, [components])

  useEffect(() => {
    setSelectedComponent(null)
    setComponentScores({})
  }, [selectedSubject])

  useEffect(() => {
    checkCompScroll()
  }, [components])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleScoreChange = (studentId, value) => {
    setComponentScores((prev) => ({ ...prev, [studentId]: value }))
  }

  const handleSaveScores = async () => {
    const payload = Object.entries(componentScores)
      .filter(([, v]) => v !== '' && v !== undefined)
      .map(([studentId, score]) => ({ student_id: parseInt(studentId), score: parseFloat(score) }))

    if (payload.length === 0) {
      showToast('No scores entered.', 'error')
      return
    }

    try {
      const res = await saveComponentScores(selectedComponent, payload)
      showToast(`${res.data?.saved || payload.length} score(s) saved.`)
      setComponentScores({})
      refetchScores()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save scores.', 'error')
    }
  }

  const handleSaveExamScore = async (studentId) => {
    const value = examScores[studentId]
    if (value === undefined || value === '') {
      showToast('Enter an exam score first.', 'error')
      return
    }
    try {
      await saveExamScore(studentId, {
        subject: selectedSubject,
        term: term.id,
        classroom: classroomId,
        exam_score: parseFloat(value),
      })
      showToast('Exam score saved.')
      setEditingExam(null)
      refetchScores()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save exam score.', 'error')
    }
  }

  const handleCreateComponent = async () => {
    if (!newComponent.component_type || !newComponent.name) {
      showToast('Please fill in all fields.', 'error')
      return
    }
    try {
      await createComponent({
        classroom: classroomId,
        subject: selectedSubject,
        term: term.id,
        component_type: newComponent.component_type,
        name: newComponent.name,
        max_score: newComponent.max_score,
        date: newComponent.date,
      })
      showToast('Component created.')
      setShowAddModal(false)
      setNewComponent({ component_type: '', name: '', max_score: 100, date: new Date().toISOString().split('T')[0] })
      refetchComponents()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create component.', 'error')
    }
  }

  const handleSubmit = async () => {
    if (!confirm('Submit and lock all scores for this subject? This cannot be undone.')) return
    try {
      await submitCAScores({ classroom: classroomId, subject: selectedSubject, term: term.id })
      showToast('Scores submitted and locked.')
      refetchScores()
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit scores.', 'error')
    }
  }

  const allSubmitted = caScores.length > 0 && caScores.every((s) => s.submitted)
  const activeComponent = components.find((c) => c.id === selectedComponent)

  if (!term) {
    return <div className="p-6 text-center py-14 text-gray-400 text-sm">No active term found.</div>
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Subject selector */}
      <div className="mb-5">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">Select Subject</div>
        <div className="flex items-center gap-2 flex-wrap">
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSubject(s.id)}
              className={`text-xs font-semibold px-4 py-2 rounded-full transition ${
                selectedSubject === s.id ? 'bg-navy text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop sidebar layout */}
      <div className="hidden lg:grid lg:grid-cols-[280px_1fr] gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-navy">Components</div>
            {!allSubmitted && (
              <button
                onClick={() => setShowAddModal(true)}
                className="text-[10px] font-bold text-amber-700 bg-gold/10 px-2 py-1 rounded-full hover:bg-gold/20 transition"
              >
                + Add
              </button>
            )}
          </div>
          {components.length === 0 && (
            <div className="text-xs text-gray-400 text-center py-6">No components yet.</div>
          )}
          <div className="flex flex-col gap-1">
            {components.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedComponent(c.id)}
                className={`text-left px-3 py-2 rounded-lg text-xs transition ${
                  selectedComponent === c.id ? 'bg-navy text-white' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <div className="font-semibold">{c.name}</div>
                <div className={`text-[10px] ${selectedComponent === c.id ? 'text-white/60' : 'text-gray-400'}`}>
                  {c.component_type_name} · /{c.max_score}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4">
          {!activeComponent ? (
            <div className="text-center py-14 text-gray-400 text-sm">Select or create a component to enter scores.</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-bold text-navy">{activeComponent.name}</div>
                  <div className="text-xs text-gray-400">{activeComponent.component_type_name} · Max {activeComponent.max_score}</div>
                </div>
                {!allSubmitted && (
                  <button
                    onClick={handleSaveScores}
                    className="text-xs font-bold bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy-light transition"
                  >
                    Save Scores
                  </button>
                )}
              </div>
              <ScoreEntryList
                students={students}
                maxScore={activeComponent.max_score}
                scores={componentScores}
                onScoreChange={handleScoreChange}
                disabled={allSubmitted}
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile horizontal component picker */}
      <div className="lg:hidden mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-bold text-navy">Components</div>
          {!allSubmitted && (
            <button
              onClick={() => setShowAddModal(true)}
              className="text-[10px] font-bold text-amber-700 bg-gold/10 px-2 py-1 rounded-full"
            >
              + Add
            </button>
          )}
        </div>

        {components.length === 0 ? (
          <div className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">No components yet.</div>
        ) : (
          <div className="relative bg-gray-50 rounded-xl">
            {canScrollLeft && (
              <button
                onClick={() => scrollComponents('left')}
                className="absolute left-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-r from-gray-50 via-gray-50 to-transparent rounded-l-xl"
              >
                <svg className="w-3.5 h-3.5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {canScrollRight && (
              <button
                onClick={() => scrollComponents('right')}
                className="absolute right-0 top-0 bottom-0 z-10 w-8 flex items-center justify-center bg-gradient-to-l from-gray-50 via-gray-50 to-transparent rounded-r-xl"
              >
                <svg className="w-3.5 h-3.5 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            <div
              ref={compScrollRef}
              onScroll={checkCompScroll}
              className="flex items-center gap-2 p-2.5 overflow-x-auto no-scrollbar scroll-smooth"
            >
              {components.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedComponent(c.id)}
                  className={`flex-shrink-0 text-left px-3 py-2 rounded-lg text-xs transition whitespace-nowrap ${
                    selectedComponent === c.id ? 'bg-navy text-white' : 'bg-white text-gray-600 border border-gray-100'
                  }`}
                >
                  <div className="font-semibold">{c.name}</div>
                  <div className={`text-[9px] ${selectedComponent === c.id ? 'text-white/60' : 'text-gray-400'}`}>
                    /{c.max_score}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Score entry — mobile */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 mt-3">
          {!activeComponent ? (
            <div className="text-center py-10 text-gray-400 text-sm">Select or create a component above.</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-navy truncate">{activeComponent.name}</div>
                  <div className="text-xs text-gray-400">Max {activeComponent.max_score}</div>
                </div>
                {!allSubmitted && (
                  <button
                    onClick={handleSaveScores}
                    className="text-xs font-bold bg-navy text-white px-3 py-2 rounded-lg flex-shrink-0"
                  >
                    Save
                  </button>
                )}
              </div>
              <ScoreEntryList
                students={students}
                maxScore={activeComponent.max_score}
                scores={componentScores}
                onScoreChange={handleScoreChange}
                disabled={allSubmitted}
              />
            </>
          )}
        </div>
      </div>

      {/* Summary table: class score, exam score, total, grade */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="text-sm font-bold text-navy">Term Summary</div>
          {!allSubmitted && caScores.length > 0 && (
            <button
              onClick={handleSubmit}
              className="text-xs font-bold bg-gold text-navy px-4 py-2 rounded-lg hover:bg-gold-light transition"
            >
              Submit & Lock
            </button>
          )}
          {allSubmitted && (
            <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full">Submitted & Locked</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="p-3 text-[10px] font-bold text-gray-400 uppercase">Student</th>
                <th className="p-3 text-[10px] font-bold text-gray-400 uppercase text-center">Class /30</th>
                <th className="p-3 text-[10px] font-bold text-gray-400 uppercase text-center">Exam /70</th>
                <th className="p-3 text-[10px] font-bold text-gray-400 uppercase text-center">Total</th>
                <th className="p-3 text-[10px] font-bold text-gray-400 uppercase text-center">Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const score = scoresByStudent[student.id]
                const locked = score?.locked
                return (
                  <tr key={student.id} className="border-b border-gray-50">
                    <td className="p-3 text-sm text-navy font-medium">{student.full_name}</td>
                    <td className="p-3 text-center text-sm text-gray-600">{score ? score.class_score : '—'}</td>
                    <td className="p-3 text-center">
                      {editingExam === student.id ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="number"
                            min="0"
                            max="70"
                            step="0.5"
                            autoFocus
                            defaultValue={score?.exam_score || ''}
                            onChange={(e) => setExamScores((prev) => ({ ...prev, [student.id]: e.target.value }))}
                            className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center outline-none focus:border-gold"
                          />
                          <button onClick={() => handleSaveExamScore(student.id)} className="text-[10px] font-bold text-green-600">✓</button>
                          <button onClick={() => setEditingExam(null)} className="text-[10px] font-bold text-gray-400">✕</button>
                        </div>
                      ) : (
                        <button
                          disabled={locked}
                          onClick={() => setEditingExam(student.id)}
                          className="text-sm text-gray-600 hover:text-navy disabled:text-gray-300"
                        >
                          {score?.exam_score || '—'}
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-center text-sm font-bold text-navy">{score?.total || '—'}</td>
                    <td className="p-3 text-center">
                      {score?.grade ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${gradeStyles[score.grade] || 'bg-gray-100 text-gray-500'}`}>
                          {score.grade}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add component modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="font-serif text-lg font-bold text-navy mb-4">Add Component</div>
            <div className="flex flex-col gap-3">
              <select
                value={newComponent.component_type}
                onChange={(e) => setNewComponent((p) => ({ ...p, component_type: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
              >
                <option value="">Select type...</option>
                {componentTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.weight}%)</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Component name (e.g. Class Test 1)"
                value={newComponent.name}
                onChange={(e) => setNewComponent((p) => ({ ...p, name: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Max score"
                  value={newComponent.max_score}
                  onChange={(e) => setNewComponent((p) => ({ ...p, max_score: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
                />
                <input
                  type="date"
                  value={newComponent.date}
                  onChange={(e) => setNewComponent((p) => ({ ...p, date: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gold"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleCreateComponent}
                  className="flex-1 bg-navy text-white text-sm font-bold py-2 rounded-lg hover:bg-navy-light transition"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-100 text-gray-600 text-sm font-bold py-2 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-lg z-50 ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default CAScoresPanel