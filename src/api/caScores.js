import api from './axios'

export async function getComponentTypes() {
  const response = await api.get('/academics/ca-component-types/')
  return response.data
}

export async function getComponents(classroomId, subjectId, termId) {
  const response = await api.get('/academics/ca-components/', {
    params: { classroom: classroomId, subject: subjectId, term: termId },
  })
  return response.data
}

export async function createComponent(payload) {
  const response = await api.post('/academics/ca-components/', payload)
  return response.data
}

export async function saveComponentScores(componentId, scores) {
  const response = await api.post(`/academics/ca-components/${componentId}/scores/`, { scores })
  return response.data
}

export async function getCAScores(classroomId, subjectId, termId) {
  const response = await api.get('/academics/ca-scores/', {
    params: { classroom: classroomId, subject: subjectId, term: termId },
  })
  return response.data
}

export async function saveExamScore(studentId, payload) {
  const response = await api.post(`/academics/ca-scores/exam/${studentId}/`, payload)
  return response.data
}

export async function submitCAScores(payload) {
  const response = await api.post('/academics/ca-scores/submit/', payload)
  return response.data
}