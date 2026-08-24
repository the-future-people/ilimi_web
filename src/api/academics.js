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

// ── Academic year setup ───────────────────────────────────────────────

export const getSetupStatus = async () => {
  const res = await api.get('/academics/years/setup/')
  return res.data
}

export const getCalendarTemplates = async () => {
  const res = await api.get('/academics/calendar-templates/')
  return res.data
}

export const setupAcademicYear = async (payload) => {
  const res = await api.post('/academics/years/setup/', payload)
  return res.data
}

// ── Classrooms ────────────────────────────────────────────────────────

export const getClassrooms = async (yearId) => {
  const res = await api.get(`/academics/years/${yearId}/classrooms/`)
  return res.data
}

export const createClassroom = async (yearId, payload) => {
  const res = await api.post(`/academics/years/${yearId}/classrooms/`, payload)
  return res.data
}

export const updateClassroom = async (classroomId, payload) => {
  const res = await api.patch(`/academics/classrooms/${classroomId}/`, payload)
  return res.data
}

export const getClassLevels = async () => {
  const res = await api.get('/academics/class-levels/')
  return res.data
}

export const getAssignments = async (params = {}) => {
  const res = await api.get('/academics/assignments/', { params })
  return res.data
}

export const createAssignment = async (payload) => {
  const res = await api.post('/academics/assignments/', payload)
  return res.data
}

export const updateAssignment = async (id, payload) => {
  const res = await api.patch(`/academics/assignments/${id}/`, payload)
  return res.data
}

export const deleteAssignment = async (id) => {
  const res = await api.delete(`/academics/assignments/${id}/`)
  return res.data
}

export const setClassTeacher = async (classroomId, payload) => {
  const res = await api.post(`/academics/classrooms/${classroomId}/class-teacher/`, payload)
  return res.data
}

export const getClassroomOverview = async (classroomId) => {
  const res = await api.get(`/staff/classrooms/${classroomId}/overview/`)
  return res.data
}