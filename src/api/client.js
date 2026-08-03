import axios from 'axios'

const TOKEN_KEY = 'bm_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Unwrap unified API envelope:
 * { success, message, data, meta, errors }
 */
api.interceptors.response.use(
  (response) => {
    const body = response.data
    if (
      body &&
      typeof body === 'object' &&
      !Array.isArray(body) &&
      Object.prototype.hasOwnProperty.call(body, 'success') &&
      Object.prototype.hasOwnProperty.call(body, 'data')
    ) {
      response.api = {
        success: body.success,
        message: body.message,
        meta: body.meta,
        errors: body.errors,
      }
      response.data = body.data
    }
    return response
  },
  (error) => {
    const body = error.response?.data
    if (
      body &&
      typeof body === 'object' &&
      Object.prototype.hasOwnProperty.call(body, 'success')
    ) {
      error.api = {
        success: body.success,
        message: body.message,
        meta: body.meta,
        errors: body.errors ?? body.errors,
        data: body.data,
      }
    }

    if (error.response?.status === 401) {
      const url = String(error.config?.url || '')
      const isAuthEndpoint = /\/auth\/(login|register|forgot-password|reset-password)/.test(url)
      if (!isAuthEndpoint) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem('bm_user')
        window.dispatchEvent(new CustomEvent('auth:logout'))
      }
    }

    return Promise.reject(error)
  },
)

export { TOKEN_KEY }
export default api
