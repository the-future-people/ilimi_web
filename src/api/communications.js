import api from './axios'

export async function getExcursions() {
  const response = await api.get('/communications/excursions/')
  return response.data
}

export async function createExcursion(payload) {
  const response = await api.post('/communications/excursions/', payload)
  return response.data
}

export async function requestExcursionConsent(excursionId) {
  const response = await api.post(`/communications/excursions/${excursionId}/request-consent/`)
  return response.data
}

export async function getConsentRequests(params = {}) {
  const response = await api.get('/communications/consent-requests/', { params })
  return response.data
}

export async function createConsentRequest(payload) {
  const response = await api.post('/communications/consent-requests/', payload)
  return response.data
}

export async function getPublicConsent(token) {
  const response = await api.get(`/communications/public/consent/${token}/`)
  return response.data
}

export async function respondToConsent(token, payload) {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    formData.append(key, value)
  })
  const response = await api.post(`/communications/public/consent/${token}/respond/`, formData)
  return response.data
}

export async function generateConsentPdf(id) {
  const response = await api.post(`/communications/consent-requests/${id}/pdf/`)
  return response.data
}

export async function emailConsentPdf(id) {
  const response = await api.post(`/communications/consent-requests/${id}/email/`)
  return response.data
}

export async function getConsentWhatsAppLink(id) {
  const response = await api.post(`/communications/consent-requests/${id}/whatsapp/`)
  return response.data
}