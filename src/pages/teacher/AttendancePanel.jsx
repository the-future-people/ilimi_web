import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getStudentsByClassroom } from '../../api/students'
import { getClassroomCurrentTerm } from '../../api/academics'
import { getClassAttendance, bulkMarkAttendance } from '../../api/attendance'

const statuses = [
  { key: 'present', label: 'Present', color: 'green' },
  { key: 'absent', label: 'Absent', color: 'red' },
  { key: 'late', label: 'Late', color: 'amber' },
  { key: 'excused', label: 'Excused', color: 'blue' },
]

const statusStyles = {
  present: 'bg-green-50 text-green-700 border-green-200',
  absent: 'bg-red-50 text-red-700 border-red-200',
  late: 'bg-amber-50 text-amber-700 border-amber-200',
  excused: 'bg-blue-50 text-blue-700 border-blue-200',
}

function AttendancePanel({ classroomId }) {
  const queryClient = useQueryClient()
  const today = new Date().toISOString().split('T')[0]
  const [localStatuses, setLocalStatuses] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const { data: termData } = useQuery({
    queryKey: ['classroom-term', classroomId],
    queryFn: () => getClassroomCurrentTerm(classroomId),
  })
  const term = termData?.data?.term || termData?.term

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['classroom-students', classroomId],
    queryFn: () => getStudentsByClassroom(classroomId),
  })
  const students = studentsData?.data?.students || []

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['classroom-attendance', classroomId, today, term?.id],
    queryFn: () => getClassAttendance(classroomId, today, term?.id),
    enabled: !!term?.id,
  })
  const records = attendanceData?.data?.data || []
  const recordsByStudent = {}
  records.forEach((r) => { recordsByStudent[r.student] = r })

  useEffect(() => {
    const initial = {}
    students.forEach((s) => {
      const record = recordsByStudent[s.id]
      if (record) initial[s.id] = record.status
    })
    setLocalStatuses(initial)
  }, [studentsData, attendanceData])

  const setStatus = (studentId, status) => {
    const record = recordsByStudent[studentId]
    if (record?.locked) return
    setLocalStatuses((prev) => ({ ...prev, [studentId]: status }))
  }

  const markAll = (status) => {
    const updates = {}
    students.forEach((s) => {
      const record = recordsByStudent[s.id]
      if (!record?.locked) updates[s.id] = status
    })
    setLocalStatuses((prev) => ({ ...prev, ...updates }))
  }

  const counts = statuses.reduce((acc, s) => {
    acc[s.key] = Object.values(localStatuses).filter((v) => v === s.key).length
    return acc
  }, {})
  const unmarkedCount = students.length - Object.keys(localStatuses).length

  const allSubmitted = records.length > 0 && records.every((r) => r.locked || r.status)
  const isRegisterSubmitted = records.length === students.length && students.length > 0

  const handleSubmit = async () => {
    if (unmarkedCount > 0) {
      setToast({ type: 'error', message: `${unmarkedCount} student(s) still unmarked.` })
      setTimeout(() => setToast(null), 4000)
      return
    }
    setSaving(true)
    try {
      const recordsPayload = Object.entries(localStatuses).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        status,
      }))
      await bulkMarkAttendance(term.id, today, recordsPayload)
      setToast({ type: 'success', message: 'Register submitted successfully.' })
      queryClient.invalidateQueries({ queryKey: ['classroom-attendance', classroomId] })
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to submit register.' })
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  if (!term) {
    return (
      <div className="text-center py-14 text-gray-400 text-sm">
        No active term found for this classroom.
      </div>
    )
  }

  if (studentsLoading || attendanceLoading) {
    return <div className="text-center py-14 text-gray-400 text-sm">Loading attendance...</div>
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Status banner */}
      <div className={`rounded-xl p-4 mb-4 flex items-start gap-3 ${
        isRegisterSubmitted ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'
      }`}>
        <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isRegisterSubmitted ? 'text-green-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isRegisterSubmitted ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          )}
        </svg>
        <div>
          <div className={`text-sm font-bold ${isRegisterSubmitted ? 'text-green-700' : 'text-amber-700'}`}>
            {isRegisterSubmitted ? 'Register Submitted' : 'Register Pending'}
          </div>
          <div className={`text-xs ${isRegisterSubmitted ? 'text-green-600' : 'text-amber-600'}`}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {term.name_display}
            {!isRegisterSubmitted && ' · Mark all students then submit.'}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="text-sm text-gray-500">
          {students.length} student{students.length !== 1 ? 's' : ''} · {term.academic_year}
        </div>
        {!isRegisterSubmitted && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => markAll('present')}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition"
            >
              Mark all Present
            </button>
            <button
              onClick={() => markAll('absent')}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition"
            >
              Mark all Absent
            </button>
          </div>
        )}
      </div>

      {/* Student rows */}
      <div className="flex flex-col gap-2 mb-5">
        {students.map((student) => {
          const record = recordsByStudent[student.id]
          const currentStatus = localStatuses[student.id]
          const locked = record?.locked

          return (
            <div key={student.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-gray-100 rounded-xl">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-800 to-blue-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {student.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-navy truncate">{student.full_name}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1.5">
                    {student.student_id}
                    {record?.via_fingerprint && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">
                        Fingerprint
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {statuses.map((s) => (
                  <button
                    key={s.key}
                    disabled={locked}
                    onClick={() => setStatus(student.id, s.key)}
                    className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition ${
                      currentStatus === s.key
                        ? statusStyles[s.key]
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    } ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary + submit */}
      {!isRegisterSubmitted && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">✓ {counts.present || 0} Present</span>
            <span className="font-semibold px-2 py-1 rounded-full bg-red-50 text-red-700">✗ {counts.absent || 0} Absent</span>
            <span className="font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700">⏱ {counts.late || 0} Late</span>
            <span className="font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700">📋 {counts.excused || 0} Excused</span>
            <span className="font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-500">— {unmarkedCount} Unmarked</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy-light transition disabled:opacity-50 whitespace-nowrap"
          >
            {saving ? 'Submitting...' : 'Submit Register'}
          </button>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-semibold text-white shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default AttendancePanel