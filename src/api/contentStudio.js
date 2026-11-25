import api from './client'

const BASE = '/admin/content-studio'

// client.js already unwraps the { success, data, meta } envelope into `r.data`;
// pagination (if any) is left in `r.api.meta.pagination`.
const unwrap = (r) => ({ data: r.data, pagination: r.api?.meta?.pagination ?? null })
// review decisions also show the server's message
const withMessage = (r) => ({ data: r.data, message: r.api?.message ?? '' })

export const contentStudio = {
  overview: () => api.get(`${BASE}/overview`).then(unwrap),
  contents: (params) => api.get(`${BASE}/contents`, { params }).then(unwrap),
  content: (id) => api.get(`${BASE}/contents/${id}`).then(unwrap),
  calendar: (params) => api.get(`${BASE}/calendar`, { params }).then(unwrap),
  review: (id) => api.get(`${BASE}/contents/${id}/review`).then(unwrap),
  slide: (id, index) => api.get(`${BASE}/contents/${id}/slides/${index}`, { responseType: 'blob' }).then((r) => r.data),
  approve: (id, body) => api.post(`${BASE}/contents/${id}/approve`, body).then(withMessage),
  retry: (id) => api.post(`${BASE}/contents/${id}/retry`).then(withMessage),
  cancel: (id, body) => api.post(`${BASE}/contents/${id}/cancel`, body).then(withMessage),
  sources: (params) => api.get(`${BASE}/sources`, { params }).then(unwrap),
  runs: (params) => api.get(`${BASE}/pipeline-runs`, { params }).then(unwrap),
  run: (id) => api.get(`${BASE}/pipeline-runs/${id}`).then(unwrap),
  settings: () => api.get(`${BASE}/settings`).then(unwrap),
  pause: (reason) => api.post(`${BASE}/automation/pause`, { reason }).then(unwrap),
  resume: () => api.post(`${BASE}/automation/resume`).then(unwrap),
}

export function contentStudioError(e) {
  const first = e?.api?.errors && Object.values(e.api.errors).flat()[0]
  return first || e?.api?.message || e?.message || 'Có lỗi xảy ra'
}
