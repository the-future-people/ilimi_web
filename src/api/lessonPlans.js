import api from './axios'

export const getLessonPlans = async (params = {}) => {
  const res = await api.get('/academics/lesson-plans/', { params })
  return res.data
}

export const getLessonPlan = async (id) => {
  const res = await api.get(`/academics/lesson-plans/${id}/`)
  return res.data
}

export const createLessonPlan = async (payload) => {
  const res = await api.post('/academics/lesson-plans/', payload)
  return res.data
}

export const updateLessonPlan = async (id, payload) => {
  const res = await api.patch(`/academics/lesson-plans/${id}/`, payload)
  return res.data
}

export const updateLessonPlanDay = async (dayId, payload) => {
  const res = await api.patch(`/academics/lesson-plan-days/${dayId}/`, payload)
  return res.data
}

export const submitLessonPlan = async (id) => {
  const res = await api.post(`/academics/lesson-plans/${id}/submit/`, {})
  return res.data
}

export const vetLessonPlan = async (id, payload) => {
  const res = await api.post(`/academics/lesson-plans/${id}/vet/`, payload)
  return res.data
}