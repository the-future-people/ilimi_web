import api from './axios'

export async function getDocumentTemplates(params = {}) {
  const response = await api.get('/documents/templates/', { params })
  return response.data
}

export async function getStudentDocuments(studentId) {
  const response = await api.get(`/documents/students/${studentId}/documents/`)
  return response.data
}

export async function previewDocument(studentId, payload) {
  const response = await api.post(`/documents/students/${studentId}/documents/preview/`, payload)
  return response.data
}

export async function generateDocument(studentId, payload) {
  const response = await api.post(`/documents/students/${studentId}/documents/generate/`, payload)
  return response.data
}

export async function getGeneratedDocuments(params = {}) {
  const response = await api.get('/documents/generated/', { params })
  return response.data
}