export const SLOT_MINUTES = 30
export const GRID_START = 5 * 60
export const GRID_END = 24 * 60

export function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function minutesToLabel(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function timeToMinutes(value) {
  const raw = String(value || '00:00').slice(0, 5)
  const [h, m] = raw.split(':').map((n) => Number(n) || 0)
  return h * 60 + m
}

export function slotCount(start = GRID_START, end = GRID_END, size = SLOT_MINUTES) {
  return Math.max(0, Math.round((end - start) / size))
}

export function slotToMinutes(index, gridStart = GRID_START, size = SLOT_MINUTES) {
  return gridStart + index * size
}

export function minutesToSlot(mins, gridStart = GRID_START, size = SLOT_MINUTES) {
  return Math.floor((mins - gridStart) / size)
}

export function formatBookingDate(iso) {
  if (!iso) return ''
  const [y, m, d] = String(iso).slice(0, 10).split('-')
  if (!d) return String(iso)
  return `${d}/${m}/${y}`
}

export function isWeekendISO(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  const day = new Date(y, m - 1, d).getDay()
  return day === 0 || day === 6
}

export function nowMinutes() {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}

/** Inclusive start slot, exclusive end slot. */
export function bookingToSlotRange(booking, gridStart = GRID_START, size = SLOT_MINUTES) {
  const start = timeToMinutes(booking.start_time)
  const end = start + Math.round(Number(booking.hours) * 60)
  return {
    from: minutesToSlot(start, gridStart, size),
    to: minutesToSlot(end, gridStart, size),
    court_number: Number(booking.court_number) || 1,
  }
}

export function hourLabels(gridStart = GRID_START, gridEnd = GRID_END) {
  const labels = []
  for (let m = gridStart; m < gridEnd; m += 60) {
    labels.push(minutesToLabel(m))
  }
  return labels
}

export function formatCourtList(numbers) {
  const nums = [...new Set((numbers || []).map(Number).filter((n) => n > 0))].sort((a, b) => a - b)
  if (!nums.length) return ''
  if (nums.length === 1) return `Sân ${nums[0]}`
  const sequential = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1)
  if (sequential) return `Sân ${nums[0]}–${nums[nums.length - 1]}`
  return `Sân ${nums.join(', ')}`
}
