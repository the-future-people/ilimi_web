import api from './axios'

export const getClasswork = async (params = {}) => {
  const res = await api.get('/academics/classwork/', { params })
  return res.data
}

export const createClasswork = async (payload) => {
  const res = await api.post('/academics/classwork/', payload)
  return res.data
}

export const getClassworkRecords = async (classworkId) => {
  const res = await api.get(`/academics/classwork/${classworkId}/records/`)
  return res.data
}

export const markClasswork = async (classworkId, records) => {
  const res = await api.post(`/academics/classwork/${classworkId}/mark/`, { records })
  return res.data
}

export const getComponentTypes = async () => {
  const res = await api.get('/academics/ca-component-types/')
  return res.data
}