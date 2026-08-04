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

export function productImageUrl(image) {
  if (!image) return 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=300&fit=crop'
  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) return image
  if (image.includes('/')) return image.startsWith('/') ? image : `/${image}`
  return `https://images.unsplash.com/${image}?w=400&h=300&fit=crop`
}

/** Prefer first of images[], then legacy image field. */
export function productCoverUrl(product) {
  if (!product) return productImageUrl(null)
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
