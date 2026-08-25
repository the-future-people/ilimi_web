import axios from 'axios'
import api from './axios'
import { API_BASE_URL } from '../config'

const publicApi = axios.create({ baseURL: `${API_BASE_URL}/api/v1` })

// Admin-side — needs auth.
export const inviteStaff = async (staffId, payload = {}) => {
  const res = await api.post(`/auth/staff/${staffId}/invite/`, payload)
  return res.data
}

// Public — the staff member is not logged in yet, so no interceptor.
export const getStaffInvite = async (token) => {
  const res = await publicApi.get(`/auth/staff/setup/${token}/`)
  return res.data
}

export const acceptStaffInvite = async (token, payload) => {
  const res = await publicApi.post(`/auth/staff/setup/${token}/`, payload)
  return res.data
}