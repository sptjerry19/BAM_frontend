import api from './client'

export const getStats = () => api.get('/stats').then((r) => r.data)

export const getCourts = () => api.get('/courts').then((r) => r.data)
export const createCourt = (data) => api.post('/courts', data).then((r) => r.data)
export const updateCourt = (id, data) => api.put(`/courts/${id}`, data).then((r) => r.data)
export const deleteCourt = (id) => api.delete(`/courts/${id}`)

export const getProducts = (category) =>
  api.get('/products', { params: category ? { category } : {} }).then((r) => r.data)
export const createProduct = (data) => api.post('/products', data).then((r) => r.data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data).then((r) => r.data)
export const deleteProduct = (id) => api.delete(`/products/${id}`)

export const getMembers = (search, level) =>
  api.get('/members', { params: { search, level } }).then((r) => r.data)
export const getMember = (id) => api.get(`/members/${id}`).then((r) => r.data)

export const createBooking = (data) => api.post('/bookings', data).then((r) => r.data)
export const createOrder = (data) => api.post('/orders', data).then((r) => r.data)
