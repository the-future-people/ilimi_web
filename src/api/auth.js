import api from './axios'

export async function login(email, password) {
  const response = await api.post('/auth/token/', { email, password })
  return response.data
}

export async function getMyMemberships() {
  const response = await api.get('/schools/my-memberships/')
  return response.data
}

export async function registerStep1(payload) {
  const response = await api.post('/auth/register/step1/', payload)
  return response.data
}

export async function sendInitialOtp(phoneNumber) {
  const response = await api.post('/auth/register/send-otp/', {
    phone_number: phoneNumber,
  })
  return response.data
}

export async function registerSchool(payload) {
  const response = await api.post('/auth/register/school/', payload)
  return response.data
}

export async function verifyOtp(phoneNumber, otpCode) {
  const response = await api.post('/auth/verify/otp/', {
    phone_number: phoneNumber,
    otp_code: otpCode,
  })
  return response.data
}

export async function resendOtp(phoneNumber) {
  const response = await api.post('/auth/verify/otp/resend/', {
    phone_number: phoneNumber,
  })
  return response.data
}

export function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('active_member_id')
  localStorage.removeItem('active_member')
  window.location.href = '/login'
}