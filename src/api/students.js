import api from './axios'

export async function getStudentsByClassroom(classroomId) {
  const response = await api.get(`/students/?classroom=${classroomId}`)
  return response.data
}

export async function getAllStudents(params = {}) {
  const response = await api.get('/students/', { params })
  return response.data
}

export async function getStudentDetail(studentId) {
  const response = await api.get(`/students/${studentId}/`)
  return response.data
}

export async function enrolStudent(payload) {
  const response = await api.post('/students/', payload)
  return response.data
}

export async function changeStudentClass(studentId, payload) {
  const response = await api.post(`/students/${studentId}/change-class/`, payload)
  return response.data
}

export async function bulkChangeStudentClass(payload) {
  const response = await api.post('/students/bulk-change-class/', payload)
  return response.data
}

export async function uploadStudentFile(studentId, field, file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post(`/students/${studentId}/upload/${field}/`, formData)
  return response.data
}

export async function uploadGuardianFile(guardianId, field, file) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post(`/students/guardians/${guardianId}/upload/${field}/`, formData)
  return response.data
}

export async function createEnrolmentInvite(payload) {
  const response = await api.post('/students/invites/', payload)
  return response.data
}

export async function getEnrolmentInvites(params = {}) {
  const response = await api.get('/students/invites/', { params })
  return response.data
}

export async function approveEnrolmentInvite(id, overrides = {}) {
  const response = await api.post(`/students/invites/${id}/approve/`, { overrides })
  return response.data
}

export async function rejectEnrolmentInvite(id, remarks = '') {
  const response = await api.post(`/students/invites/${id}/reject/`, { remarks })
  return response.data
}

export async function getPublicInvite(token) {
  const response = await api.get(`/students/public/enrol/${token}/`)
  return response.data
}

export async function submitPublicInvite(token, payload) {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    if (key === 'guardians' || key === 'emergency_contacts') {
      formData.append(key, JSON.stringify(value))
    } else {
      formData.append(key, value)
    }
  })
  const response = await api.post(`/students/public/enrol/${token}/submit/`, formData)
  return response.data
}