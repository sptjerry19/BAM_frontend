import api from './client'

const AUTH = ''

export const login = (data) => api.post(`${AUTH}/login`, data).then((r) => r.data)
export const register = (data) => api.post(`${AUTH}/register`, data).then((r) => r.data)
export const logout = () => api.post(`${AUTH}/logout`).then((r) => r.data)
export const getMe = () => api.get(`${AUTH}/me`).then((r) => r.data)
export const updateProfile = (data) => {
  if (data instanceof FormData) {
    return api.post(`${AUTH}/me`, data).then((r) => r.data)
  }
  return api.put(`${AUTH}/me`, data).then((r) => r.data)
}
export const forgotPassword = (data) =>
  api.post(`${AUTH}/forgot-password`, data).then((r) => r.data)
export const resetPassword = (data) =>
  api.post(`${AUTH}/reset-password`, data).then((r) => r.data)

export const getStats = () => api.get(`${AUTH}/stats`).then((r) => r.data)

export const getRankings = (limit = 20) =>
  api.get(`${AUTH}/rankings`, { params: { limit } }).then((r) => ({
    athletes: Array.isArray(r.data?.athletes) ? r.data.athletes : [],
    members: Array.isArray(r.data?.members) ? r.data.members : [],
  }))

export const getAthleteProfile = (id) =>
  api.get(`${AUTH}/athletes/${id}`).then((r) => r.data)

export const getCourts = (params = {}) =>
  api.get(`${AUTH}/courts`, { params }).then((r) => ({
    data: Array.isArray(r.data) ? r.data : [],
    pagination: r.api?.meta?.pagination ?? null,
  }))

export const getCourtTop = (limit = 5) =>
  api.get(`${AUTH}/courts/top`, { params: { limit } }).then((r) => ({
    courts: Array.isArray(r.data?.courts) ? r.data.courts : [],
    summary: r.data?.summary ?? null,
  }))

export const getPickedCourts = (ids) => {
  const list = [
    ...new Set(
      (ids || [])
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ]
  if (!list.length) return Promise.resolve([])
  return api
    .get(`${AUTH}/courts/picked`, { params: { ids: list } })
    .then((r) => (Array.isArray(r.data) ? r.data : []))
}

export const getCourt = (id) => api.get(`${AUTH}/courts/${id}`).then((r) => r.data)

export const getCourtAvailability = (id, date) =>
  api.get(`${AUTH}/courts/${id}/availability`, { params: { date } }).then((r) => r.data)

export const getCategories = (params = {}) =>
  api.get(`${AUTH}/categories`, { params }).then((r) => (Array.isArray(r.data) ? r.data : []))

export const getNewsList = (params = {}) =>
  api.get(`${AUTH}/news`, { params }).then((r) => ({
    data: Array.isArray(r.data) ? r.data : [],
    pagination: r.api?.meta?.pagination ?? null,
  }))

export const getNewsItem = (id) => api.get(`${AUTH}/news/${id}`).then((r) => r.data)
export const createNews = (data) => api.post(`${AUTH}/news`, data).then((r) => r.data)
export const updateNews = (id, data) => api.put(`${AUTH}/news/${id}`, data).then((r) => r.data)
export const deleteNews = (id) => api.delete(`${AUTH}/news/${id}`)

export const createCategory = (data) => api.post(`${AUTH}/categories`, data).then((r) => r.data)
export const updateCategory = (id, data) => api.put(`${AUTH}/categories/${id}`, data).then((r) => r.data)
export const deleteCategory = (id) => api.delete(`${AUTH}/categories/${id}`)
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
export const getBestsellers = (limit) =>
  api
    .get(`${AUTH}/products/bestsellers`, { params: limit ? { limit } : {} })
    .then((r) => (Array.isArray(r.data) ? r.data : []))
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
export const updateMemberStatus = (id, status) =>
  api.patch(`${AUTH}/members/${id}/status`, { status }).then((r) => r.data)
export const deleteMember = (id) => api.delete(`${AUTH}/members/${id}`)

export const createBooking = (data) => api.post(`${AUTH}/bookings`, data).then((r) => r.data)
export const createOrder = (data) => api.post(`${AUTH}/orders`, data).then((r) => r.data)

export const getProduct = (id) => api.get(`${AUTH}/products/${id}`).then((r) => r.data)

/** Resolve catalog rows for known ids (cart / favorites / equipment). Skips missing ids. */
export const getProductsByIds = async (ids = []) => {
  const unique = [...new Set((ids || []).map((id) => String(id)).filter(Boolean))]
  if (!unique.length) return []
  const rows = await Promise.all(unique.map((id) => getProduct(id).catch(() => null)))
  return rows.filter(Boolean)
}
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
