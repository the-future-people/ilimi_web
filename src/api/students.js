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