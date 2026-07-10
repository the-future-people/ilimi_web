import api from './axios'

export async function getClassAttendance(classroomId, date, termId) {
  const response = await api.get('/attendance/students/', {
    params: { classroom: classroomId, date, term: termId },
  })
  return response.data
}

export async function bulkMarkAttendance(termId, date, records) {
  const response = await api.post('/attendance/students/bulk/', {
    term_id: termId,
    date,
    records,
  })
  return response.data
}