import api from './axios'

export async function getAllStaff(params = {}) {
  const response = await api.get('/staff/', { params })
  return response.data
}

export async function getStaffDetail(staffId) {
  const response = await api.get(`/staff/${staffId}/`)
  return response.data
}

export async function getMyStaffProfile() {
  const response = await api.get('/staff/me/')
  return response.data
}

export async function registerStaff(payload) {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return
    if (key === 'emergency_contacts' || key === 'subject_specializations') {
      formData.append(key, JSON.stringify(value))
    } else {
      formData.append(key, value)
    }
  })
  const response = await api.post('/staff/', formData)
  return response.data
}

export async function updateStaff(staffId, payload) {
  const response = await api.patch(`/staff/${staffId}/`, payload)
  return response.data
}