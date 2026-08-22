import api from './axios'

// ── Assignments (teacher-facing) ──────────────────────────────────────

export const getAssignments = async (params = {}) => {
  const res = await api.get('/classroom/assignments/', { params })
  return res.data
}

export const createAssignment = async (payload) => {
  const res = await api.post('/classroom/assignments/', payload)
  return res.data
}

// ── Completions (teacher marks a student's status) ────────────────────

export const markCompletion = async (completionId, payload) => {
  const res = await api.patch(`/classroom/completions/${completionId}/`, payload)
  return res.data
}

// ── Parent-facing (read-only, scoped to own child) ────────────────────

export const getStudentAssignments = async (studentId) => {
  const res = await api.get(`/classroom/parent/students/${studentId}/assignments/`)
  return res.data
}