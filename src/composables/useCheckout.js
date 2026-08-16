const CHECKOUT_KEY = 'jb_checkout'

export const PAYMENT_METHODS = [
  {
    id: 'cod',
    label: 'Thanh toán khi nhận hàng',
    hint: 'Trả tiền mặt hoặc quẹt thẻ khi shipper giao tới.',
  },
  {
    id: 'bank',
    label: 'Chuyển khoản ngân hàng',
    hint: 'Nhận hướng dẫn chuyển khoản sau khi xác nhận đơn.',
  },
  {
    id: 'momo',
    label: 'MoMo',
    hint: 'Thanh toán qua ví MoMo (sẽ mở cổng thanh toán).',
  },
  {
    id: 'apple_pay',
    label: 'Apple Pay',
    hint: 'Thanh toán nhanh trên thiết bị Apple.',
  },
]

/** Demo vouchers for UI only — replace with API later. */
export const DEMO_VOUCHERS = [
  {
    code: 'JBAM10',
    title: 'Giảm 10%',
    hint: 'Tối đa 200.000đ · đơn từ 500.000đ',
    type: 'percent',
    value: 10,
    maxOff: 200_000,
    minOrder: 500_000,
  },
  {
    code: 'FREESHIP',
    title: 'Miễn phí vận chuyển',
    hint: 'Áp dụng nội thành · đơn từ 300.000đ',
    type: 'shipping',
    value: 0,
    maxOff: 0,
    minOrder: 300_000,
  },
  {
    code: 'WELCOME50',
    title: 'Giảm 50.000đ',
    hint: 'Thành viên mới · đơn từ 400.000đ',
    type: 'fixed',
    value: 50_000,
    maxOff: 50_000,
    minOrder: 400_000,
  },
]

export function emptyCheckout() {
  return {
    name: '',
    phone: '',
    email: '',
    address: '',
    note: '',
    payment_method: 'cod',
    voucher_code: '',
  }
}

export function findVoucher(code) {
  const key = String(code || '').trim().toUpperCase()
  if (!key) return null
  return DEMO_VOUCHERS.find((v) => v.code === key) ?? null
}

/** UI-only discount preview against subtotal. */
export function estimateVoucherOff(voucher, subtotal) {
  if (!voucher || subtotal < (voucher.minOrder || 0)) return 0
  if (voucher.type === 'percent') {
    return Math.min(Math.round((subtotal * voucher.value) / 100), voucher.maxOff || Infinity)
  }
  if (voucher.type === 'fixed') return Math.min(voucher.value, subtotal)
  if (voucher.type === 'shipping') return 0
  return 0
}

export function readCheckout() {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_KEY)
    if (!raw) return emptyCheckout()
    return { ...emptyCheckout(), ...JSON.parse(raw) }
  } catch {
    return emptyCheckout()
  }
}

export function writeCheckout(data) {
  const prev = readCheckout()
  sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify({ ...prev, ...data }))
}

export function clearCheckout() {
  sessionStorage.removeItem(CHECKOUT_KEY)
}

export function paymentLabel(id) {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id
}
