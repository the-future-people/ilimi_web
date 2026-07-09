import api from './axios'

export async function login(email, password) {
  const response = await api.post('/auth/token/', { email, password })
  return response.data
}

export async function getMyMemberships() {
  const response = await api.get('/schools/my-memberships/')
  return response.data
}

export function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('active_member_id')
  localStorage.removeItem('active_member')
  window.location.href = '/login'
}