/**
 * Local campaign / mock media from src/assets/uploads.
 * Vite emits hashed asset URLs; JS only holds string paths.
 */
const modules = import.meta.glob('../assets/uploads/background*.jpg', {
  eager: true,
  import: 'default',
})

function sortKeys(keys) {
  return keys.sort((a, b) => {
    const na = Number(a.match(/background(\d+)/i)?.[1] || 0)
    const nb = Number(b.match(/background(\d+)/i)?.[1] || 0)
    return na - nb
  })
}

/** background1.jpg … background10.jpg */
export const UPLOADS = sortKeys(Object.keys(modules)).map((k) => modules[k])

/** 1-based: upload(1) → background1 */
export function upload(n = 1) {
  if (!UPLOADS.length) return ''
  const i = ((Number(n) - 1) % UPLOADS.length + UPLOADS.length) % UPLOADS.length
  return UPLOADS[i]
}

/** 0-based cycling helper for lists */
export function uploadAt(index = 0) {
  if (!UPLOADS.length) return ''
  const i = ((Number(index) % UPLOADS.length) + UPLOADS.length) % UPLOADS.length
  return UPLOADS[i]
}
