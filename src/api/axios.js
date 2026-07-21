import axios from 'axios'
import { API_BASE_URL } from '../config'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const memberId = localStorage.getItem('active_member_id')
  if (memberId) {
    config.headers['X-School-Member-Id'] = memberId
  }

  return config
})

// Handle expired access tokens by refreshing automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        // No refresh token — force logout
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/token/refresh/`, {
          refresh: refreshToken,
        })
        const newAccessToken = response.data.data?.access || response.data.access
        localStorage.setItem('access_token', newAccessToken)

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api