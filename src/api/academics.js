import api from './axios'

export async function getMyClasses() {
  const response = await api.get('/academics/assignments/')
  return response.data
}

export async function getClassroomDetail(classroomId) {
  const response = await api.get(`/academics/classrooms/${classroomId}/`)
  return response.data
}

export async function getMyClassrooms() {
  const response = await api.get('/staff/my-classrooms/')
  return response.data
}

export async function getClassroomCurrentTerm(classroomId) {
  const response = await api.get(`/staff/classrooms/${classroomId}/current-term/`)
  return response.data
}

export async function getSchoolClassrooms() {
  const response = await api.get('/academics/my-classrooms/')
  return response.data
}

export async function markTourSeen(memberId) {
  const response = await api.post(`/schools/my-memberships/${memberId}/mark-tour-seen/`)
  return response.data
}

export async function getSubjects() {
  const response = await api.get('/academics/subjects/')
  return response.data
}