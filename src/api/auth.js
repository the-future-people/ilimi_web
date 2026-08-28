import api from './axios'

export async function login(identifier, password) {
  const response = await api.post('/auth/token/', { identifier, password })
  return response.data
}

export async function getMyMemberships() {
  const response = await api.get('/schools/my-memberships/')
  return response.data
}

export async function markTourSeen(memberId) {
  const response = await api.post(`/schools/my-memberships/${memberId}/mark-tour-seen/`)
  return response.data
}

export async function startRegistration(payload) {
  const response = await api.post('/auth/register/start/', payload)
  return response.data
}

export async function resendPendingOtp(phoneNumber) {
  const response = await api.post('/auth/register/resend-otp/', {
    phone_number: phoneNumber,
  })
  return response.data
}

export async function verifyAndCreate(phoneNumber, otpCode) {
  const response = await api.post('/auth/register/verify/', {
    phone_number: phoneNumber,
    otp_code: otpCode,
  })
  return response.data
}

export async function checkAvailability(field, value) {
  const response = await api.post('/auth/register/check-availability/', {
    field,
    value,
  })
  return response.data
}

export async function requestPasswordReset(phoneNumber) {
  const response = await api.post('/auth/password/reset/', {
    phone_number: phoneNumber,
  })
  return response.data
}

export async function verifyPasswordResetCode(phoneNumber, code) {
  const response = await api.post('/auth/password/reset/verify/', {
    phone_number: phoneNumber,
    code,
  })
  return response.data
}

export async function completePasswordReset(ticket, newPassword, confirmPassword) {
  const response = await api.post('/auth/password/reset/complete/', {
    ticket,
    new_password: newPassword,
    confirm_password: confirmPassword,
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