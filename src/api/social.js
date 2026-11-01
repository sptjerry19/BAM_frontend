import api from './client'
let guestPreview = false
export function setSocialGuestPreview(value) {
  guestPreview = value
}

export const social = {
  get: (path, params) =>
    api
      .get(path, {
        params: {
          ...params,
          ...(guestPreview &&
          /^\/(profiles|member-profiles|posts|albums|social-media)\//.test(path)
            ? { as_guest: 1 }
            : {}),
        },
      })
      .then((r) => r.data),
  post: (path, data = {}) => api.post(path, data).then((r) => r.data),
  patch: (path, data) => api.patch(path, data).then((r) => r.data),
  put: (path, data = {}) => api.put(path, data).then((r) => r.data),
  delete: (path) => api.delete(path).then((r) => r.data),
}

export async function uploadSocialMedia(file, purpose) {
  const data = new FormData()
  data.append('file', file)
  data.append('purpose', purpose)
  return social.post('/social-media', data)
}

export function socialError(error) {
  return (
    error?.api?.message ||
    error?.response?.data?.message ||
    'Không thể thực hiện. Vui lòng thử lại.'
  )
}
