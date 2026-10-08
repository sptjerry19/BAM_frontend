const KEY = 'jb_booking_draft'

export const BOOKING_PAYMENTS = [
  {
    id: 'venue',
    label: 'Thanh toán tại sân',
    hint: 'Trả tiền mặt hoặc quẹt thẻ khi đến chơi.',
  },
  {
    id: 'bank',
    label: 'Chuyển khoản ngân hàng',
    hint: 'Nhận số tài khoản sau khi xác nhận đặt sân.',
  },
  {
    id: 'momo',
    label: 'MoMo',
    hint: 'Thanh toán qua ví MoMo.',
  },
]

export function emptyBookingDraft() {
  return {
    court_id: null,
    court_name: '',
    court_address: '',
    booking_date: '',
    price_per_hour: 0,
    total_price: 0,
    min_hours: 1,
    slots: [],
  }
}

export function readBookingDraft() {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return emptyBookingDraft()
    const parsed = { ...emptyBookingDraft(), ...JSON.parse(raw) }
    if (!Array.isArray(parsed.slots)) parsed.slots = []
    return parsed
  } catch {
    return emptyBookingDraft()
  }
}

export function writeBookingDraft(data) {
  sessionStorage.setItem(KEY, JSON.stringify({ ...emptyBookingDraft(), ...data }))
}

export function clearBookingDraft() {
  sessionStorage.removeItem(KEY)
}

export function bookingPaymentLabel(id) {
  return BOOKING_PAYMENTS.find((m) => m.id === id)?.label ?? id
}

export function isBookingDraftReady(draft, courtId) {
  if (!draft?.court_id || String(draft.court_id) !== String(courtId)) return false
  return Boolean(draft.booking_date && Array.isArray(draft.slots) && draft.slots.length > 0)
}
