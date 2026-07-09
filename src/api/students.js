import api from './axios'

export async function getStudentsByClassroom(classroomId) {
  const response = await api.get(`/students/?classroom=${classroomId}`)
  return response.data
}