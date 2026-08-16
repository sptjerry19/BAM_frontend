export const categoryLabels = {
  racket: 'Vợt',
  shoes: 'Giày',
  shirt: 'Áo',
  shorts: 'Quần',
  shuttlecock: 'Cầu lông',
  bag: 'Túi đựng',
  grip: 'Grip',
  string: 'Dây',
  other: 'Khác',
}

export const levelLabels = {
  beginner: 'Mới bắt đầu',
  intermediate: 'Trung cấp',
  advanced: 'Nâng cao',
  pro: 'Chuyên nghiệp',
}

export const levelColors = {
  beginner: '#64748b',
  intermediate: '#3b82f6',
  advanced: '#84cc16',
  pro: '#facc15',
}

export const catIcons = {
  racket: '🏸',
  shoes: '👟',
  shirt: '👕',
  shorts: '🩳',
  shuttlecock: '○',
  bag: '🎒',
  grip: '○',
  string: '⊙',
  other: '◈',
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

/** Resolve product image URL as stored (S3 / CDN / relative). No campaign-image override. */
export function productImageUrl(image) {
  if (!image || typeof image !== 'string') return ''
  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) return image
  if (image.startsWith('/')) return image
  if (image.includes('/')) return `/${image}`
  return image
}

/** Prefer first of images[], then legacy image field. */
export function productCoverUrl(product) {
  if (!product) return ''
  const list = Array.isArray(product.images) ? product.images.filter(Boolean) : []
  return productImageUrl(list[0] || product.image)
}

export function productGallery(product) {
  if (!product) return []
  const list = Array.isArray(product.images) ? product.images.filter(Boolean) : []
  if (list.length) return list.map(productImageUrl)
  if (product.image) return [productImageUrl(product.image)]
  return []
}
