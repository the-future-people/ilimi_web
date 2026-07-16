import api from './axios'

export async function searchOccupations(query) {
  const response = await api.get('/core/occupations/', { params: { search: query } })
  return response.data
}