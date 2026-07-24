import api from './axios'

export async function getStudentFees(params = {}) {
  const response = await api.get('/fees/student-fees/', { params })
  return response.data
}

export async function createPayment(payload) {
  const response = await api.post('/fees/payments/', payload)
  return response.data
}

export async function getPayments(params = {}) {
  const response = await api.get('/fees/payments/', { params })
  return response.data
}

export async function getFeeTypes() {
  const response = await api.get('/fees/types/')
  return response.data
}

export async function getFeeTypeSummary() {
  const response = await api.get('/fees/types/summary/')
  return response.data
}

export async function getClassroomFeeSummary(feeTypeId) {
  const response = await api.get('/fees/classrooms/summary/', { params: { fee_type: feeTypeId } })
  return response.data
}