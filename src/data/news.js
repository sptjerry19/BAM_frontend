/**
 * Shape helpers for /api/news and /api/categories responses.
 */

export function formatNewsDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

export function formatReadTime(minutes) {
  const n = Number(minutes)
  if (!Number.isFinite(n) || n <= 0) return ''
  return `${n} phút`
}

export function articleHtml(article) {
  const html = article?.content || article?.body || ''
  return typeof html === 'string' ? html : ''
}

export function articleHeadings(html) {
  return [...String(html).matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean)
}

export function articleTag(article) {
  return article?.tag || article?.category?.name || ''
}

export function articleAuthor(article) {
  const user = article?.user
  if (!user) return null
  return {
    name: user.name || 'JBadminton',
    role: user.role === 'admin' ? 'Biên tập' : 'Thành viên',
    avatar: user.avatar || null,
  }
}
