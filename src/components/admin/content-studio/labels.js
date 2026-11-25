export const STATUS_LABELS = {
  idea: 'Ý tưởng',
  researching: 'Đang nghiên cứu',
  source_verified: 'Đã xác minh nguồn',
  scripted: 'Đã có kịch bản',
  producing: 'Đang sản xuất',
  quality_check: 'Kiểm tra chất lượng',
  needs_review: 'Cần duyệt',
  ready: 'Sẵn sàng',
  scheduling: 'Đang lên lịch',
  scheduled: 'Đã lên lịch',
  publish_unknown: 'Chưa rõ kết quả đăng',
  reconciliation: 'Đang đối soát',
  published: 'Đã đăng',
  measured: 'Đã đo',
  blocked: 'Bị chặn',
  failed: 'Lỗi',
  cancelled: 'Đã hủy',
}

export const SLOT_LABELS = { news: 'Tin tức', equipment: 'Trang bị', tutorial: 'Kỹ thuật', meme: 'Meme' }

const TONE = {
  good: ['ready', 'scheduled', 'published', 'measured', 'succeeded'],
  warn: ['needs_review', 'blocked', 'publish_unknown', 'reconciliation', 'running', 'pending'],
  bad: ['failed'],
}
const COLORS = { good: '#84cc16', warn: '#facc15', bad: '#ef4444', neutral: '#64748b' }

export function pillStyle(status) {
  const tone = Object.keys(TONE).find((k) => TONE[k].includes(status)) || 'neutral'
  const c = COLORS[tone]
  return { background: `${c}1f`, color: c, border: `1px solid ${c}30` }
}

export const fmt = (v) => (v ? new Date(v).toLocaleString('vi-VN') : '—')

/** The channel plans in Vietnam time, whatever the browser's timezone is. */
export const CHANNEL_TZ = 'Asia/Ho_Chi_Minh'

export const fmtTime = (v) =>
  v ? new Intl.DateTimeFormat('vi-VN', { timeZone: CHANNEL_TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(v)) : '—'

/** Only real web addresses become links: stored URLs come from outside sources. */
export const isWebUrl = (v) => /^https?:\/\//i.test(v || '')
