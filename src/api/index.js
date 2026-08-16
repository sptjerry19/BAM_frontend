import api from './client'

const AUTH = ''

export const login = (data) => api.post(`${AUTH}/login`, data).then((r) => r.data)
export const register = (data) => api.post(`${AUTH}/register`, data).then((r) => r.data)
export const logout = () => api.post(`${AUTH}/logout`).then((r) => r.data)
export const getMe = () => api.get(`${AUTH}/me`).then((r) => r.data)
export const forgotPassword = (data) =>
  api.post(`${AUTH}/forgot-password`, data).then((r) => r.data)
export const resetPassword = (data) =>
  api.post(`${AUTH}/reset-password`, data).then((r) => r.data)

export const getStats = () => api.get(`${AUTH}/stats`).then((r) => r.data)

export const getCourts = (params = {}) =>
  api.get(`${AUTH}/courts`, { params }).then((r) => r.data)
export const createCourt = (data) => api.post(`${AUTH}/courts`, data).then((r) => r.data)
export const updateCourt = (id, data) => api.put(`${AUTH}/courts/${id}`, data).then((r) => r.data)
export const deleteCourt = (id) => api.delete(`${AUTH}/courts/${id}`)

export const getProducts = (category, params = {}) =>
  api
    .get(`${AUTH}/products`, { params: { ...params, ...(category ? { category } : {}) } })
    .then((r) => ({
      data: Array.isArray(r.data) ? r.data : [],
      pagination: r.api?.meta?.pagination ?? null,
    }))
export const getBestsellers = () =>
  api.get(`${AUTH}/products/bestsellers`).then((r) => (Array.isArray(r.data) ? r.data : []))
export const createProduct = (data) => {
  if (data instanceof FormData) {
    return api.post(`${AUTH}/products`, data).then((r) => r.data)
  }
  return api.post(`${AUTH}/products`, data).then((r) => r.data)
}
export const updateProduct = (id, data) => {
  if (data instanceof FormData) {
    data.append('_method', 'PUT')
    return api.post(`${AUTH}/products/${id}`, data).then((r) => r.data)
  }
  return api.put(`${AUTH}/products/${id}`, data).then((r) => r.data)
}
export const deleteProduct = (id) => api.delete(`${AUTH}/products/${id}`)

export const uploadFiles = (files, folder = 'uploads') => {
  const fd = new FormData()
  fd.append('folder', folder)
  ;[...files].forEach((file) => fd.append('files[]', file))
  return api.post(`${AUTH}/uploads`, fd).then((r) => r.data)
}

export const getMembers = (search, level, params = {}) =>
  api.get(`${AUTH}/members`, { params: { search, level, ...params } }).then((r) => r.data)
export const getMember = (id) => api.get(`${AUTH}/members/${id}`).then((r) => r.data)

export const createBooking = (data) => api.post(`${AUTH}/bookings`, data).then((r) => r.data)
export const createOrder = (data) => api.post(`${AUTH}/orders`, data).then((r) => r.data)

export const getProduct = (id) => api.get(`${AUTH}/products/${id}`).then((r) => r.data)
export const getProductReviews = (productId) =>
  api.get(`${AUTH}/products/${productId}/reviews`).then((r) => r.data)
export const createProductReview = (productId, data) =>
  api.post(`${AUTH}/products/${productId}/reviews`, data).then((r) => r.data)
export const getCustomEquipments = (memberId) =>
  api.get(`${AUTH}/members/${memberId}/custom-equipments`).then((r) => r.data)
export const createCustomEquipment = (memberId, data) =>
  api.post(`${AUTH}/members/${memberId}/custom-equipments`, data).then((r) => r.data)
export const deleteCustomEquipment = (id) => api.delete(`${AUTH}/custom-equipments/${id}`).then((r) => r.data)
export const attachMemberEquipment = (memberId, productId) =>
  api.post(`${AUTH}/members/${memberId}/equipment/${productId}`).then((r) => r.data)
export const detachMemberEquipment = (memberId, productId) =>
  api.delete(`${AUTH}/members/${memberId}/equipment/${productId}`).then((r) => r.data)
