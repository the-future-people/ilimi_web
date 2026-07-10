import { useRef, useEffect, useState } from 'react'

function ScoreEntryList({ students, maxScore, scores, onScoreChange, disabled }) {
  const inputRefs = useRef({})
  const [fillValue, setFillValue] = useState('')

  useEffect(() => {
    const firstStudent = students[0]
    if (firstStudent && inputRefs.current[firstStudent.id] && !disabled) {
      inputRefs.current[firstStudent.id].focus()
    }
  }, [students])

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault()
      const next = students[index + 1]
      if (next && inputRefs.current[next.id]) {
        inputRefs.current[next.id].focus()
        inputRefs.current[next.id].select()
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = students[index - 1]
      if (prev && inputRefs.current[prev.id]) {
        inputRefs.current[prev.id].focus()
        inputRefs.current[prev.id].select()
      }
    }
  }

  const handleFillAll = () => {
    if (fillValue === '') return
    students.forEach((s) => onScoreChange(s.id, fillValue))
  }

  return (
    <div>
      {!disabled && (
        <div className="flex items-center gap-2 mb-3 p-2.5 bg-gold/5 border border-gold/15 rounded-lg">
          <span className="text-[11px] font-semibold text-amber-700 whitespace-nowrap">Fill all with</span>
          <input
            type="number"
            min="0"
            max={maxScore}
            step="0.5"
            value={fillValue}
            onChange={(e) => setFillValue(e.target.value)}
            placeholder="score"
            className="w-20 px-2 py-1 border border-gold/30 rounded-lg text-xs text-center outline-none focus:border-gold bg-white"
          />
          <button
            onClick={handleFillAll}
            className="text-[11px] font-bold text-amber-700 bg-gold/15 px-2.5 py-1 rounded-full hover:bg-gold/25 transition"
          >
            Apply to all
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {students.map((student, index) => (
          <div key={student.id} className="flex items-center justify-between gap-3 p-2.5 border border-gray-100 rounded-lg">
            <span className="text-sm text-navy font-medium truncate">{student.full_name}</span>
            <input
              ref={(el) => (inputRefs.current[student.id] = el)}
              type="number"
              min="0"
              max={maxScore}
              step="0.5"
              disabled={disabled}
              value={scores[student.id] ?? ''}
              onChange={(e) => onScoreChange(student.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onFocus={(e) => e.target.select()}
              placeholder="—"
              className="w-16 sm:w-20 flex-shrink-0 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center outline-none focus:border-gold disabled:bg-gray-50 disabled:text-gray-300"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ScoreEntryList