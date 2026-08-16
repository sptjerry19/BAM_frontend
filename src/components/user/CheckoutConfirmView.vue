<script setup>
import { ref, inject, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { motion } from 'motion-v'
import { getProducts, createOrder } from '../../api'
import Icon from '../common/Icon.vue'
import { formatCurrency, productCoverUrl } from '../../utils/labels'
import {
  PAYMENT_METHODS,
  DEMO_VOUCHERS,
  readCheckout,
  writeCheckout,
  clearCheckout,
  paymentLabel,
  emptyCheckout,
  findVoucher,
  estimateVoucherOff,
} from '../../composables/useCheckout'

const user = inject('user')
const cart = inject('cart')
const setCart = inject('setCart')
const router = useRouter()

const products = ref([])
const checkout = ref(emptyCheckout())
const submitting = ref(false)
const submitError = ref('')
const ordered = ref(false)
const orderResult = ref(null)

const voucherInput = ref('')
const voucherMsg = ref('')
const voucherOk = ref(false)
const showVoucherList = ref(true)

const cartProducts = computed(() =>
  cart.value
    .map((item) => {
      const product = products.value.find((p) => p.id === item.productId)
      return product ? { ...item, product } : null
    })
    .filter(Boolean),
)

const total = computed(() =>
  cartProducts.value.reduce((s, i) => s + i.product.price * i.qty, 0),
)

const appliedVoucher = computed(() => findVoucher(checkout.value.voucher_code))
const voucherOff = computed(() => estimateVoucherOff(appliedVoucher.value, total.value))
const pointsSaved = computed(() => (user.value?.points ?? 0) * 10)
const payable = computed(() => Math.max(0, total.value - pointsSaved.value - voucherOff.value))

const shippingReady = computed(() =>
  Boolean(
    checkout.value.name?.trim()
    && checkout.value.phone?.trim()
    && checkout.value.email?.trim()
    && checkout.value.address?.trim(),
  ),
)

onMounted(async () => {
  if (!(cart.value?.length > 0)) {
    router.replace({ name: 'cart' })
    return
  }

  checkout.value = readCheckout()
  voucherInput.value = checkout.value.voucher_code || ''
  if (checkout.value.voucher_code) {
    voucherOk.value = Boolean(findVoucher(checkout.value.voucher_code))
  }
  if (!shippingReady.value) {
    router.replace({ name: 'checkout-info' })
    return
  }

  products.value = (await getProducts(undefined, { per_page: 100 })).data
})

function selectPayment(id) {
  checkout.value.payment_method = id
  writeCheckout({ ...checkout.value, payment_method: id })
}

function persistVoucher(code) {
  checkout.value.voucher_code = code
  writeCheckout({ ...checkout.value, voucher_code: code })
}

function applyVoucherCode(raw) {
  const code = String(raw || '').trim().toUpperCase()
  voucherInput.value = code
  voucherMsg.value = ''
  voucherOk.value = false

  if (!code) {
    voucherMsg.value = 'Nhập mã giảm giá để áp dụng.'
    return
  }

  const found = findVoucher(code)
  if (!found) {
    persistVoucher('')
    voucherMsg.value = 'Mã không hợp lệ hoặc đã hết hạn.'
    return
  }
  if (total.value < (found.minOrder || 0)) {
    persistVoucher('')
    voucherMsg.value = `Đơn tối thiểu ${formatCurrency(found.minOrder)} để dùng mã này.`
    return
  }

  persistVoucher(found.code)
  voucherOk.value = true
  voucherMsg.value = found.type === 'shipping'
    ? `Đã áp dụng ${found.code} — miễn phí giao hàng.`
    : `Đã áp dụng ${found.code}.`
}

function applyFromList(voucher) {
  applyVoucherCode(voucher.code)
}

function clearVoucher() {
  voucherInput.value = ''
  voucherMsg.value = ''
  voucherOk.value = false
  persistVoucher('')
}

async function placeOrder() {
  if (!cartProducts.value.length || !shippingReady.value) return
  submitting.value = true
  submitError.value = ''
  try {
    const memberId = user.value?.member_id || user.value?.member?.id || user.value?.id || null
    orderResult.value = await createOrder({
      ...(memberId ? { member_id: String(memberId) } : {}),
      customer_name: checkout.value.name,
      customer_phone: checkout.value.phone,
      customer_email: checkout.value.email,
      shipping_address: checkout.value.address,
      note: checkout.value.note || null,
      payment_method: checkout.value.payment_method,
      status: 'pending',
      items: cartProducts.value.map((i) => ({
        product_id: i.productId,
        qty: i.qty,
        price: i.product.price,
      })),
    })
    setCart([])
    clearCheckout()
    ordered.value = true
  } catch (err) {
    submitError.value =
      err?.api?.message
      || Object.values(err?.api?.errors || {})?.[0]?.[0]
      || 'Chúng tôi chưa gửi được đơn hàng. Vui lòng thử lại sau ít phút.'
  } finally {
    submitting.value = false
  }
}

function backToShop() {
  router.push({ name: 'shop' })
}
</script>

<template>
  <section v-if="ordered" class="max-w-lg mx-auto text-center py-10">
    <motion.span
      class="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center"
      style="background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent-line)"
      :initial="{ scale: 0.6, opacity: 0 }"
      :animate="{ scale: 1, opacity: 1 }"
      :transition="{ type: 'spring', stiffness: 320, damping: 20 }"
    >
      <Icon name="check" :size="30" :stroke="2.2" />
    </motion.span>

    <h1 class="page-title mt-6">Đơn hàng đã được ghi nhận</h1>
    <p class="lede mx-auto mt-3">
      Chúng tôi sẽ liên hệ qua điện thoại/email để xác nhận.
      Hình thức: <strong>{{ paymentLabel(orderResult?.payment_method || checkout.payment_method) }}</strong>.
    </p>
    <p v-if="orderResult?.id" class="mono mt-5 text-[13px]" style="color: var(--text-3)">
      Mã đơn: {{ orderResult.id }}
    </p>
    <button type="button" class="btn-primary px-7 py-3.5 rounded-2xl text-[15px] mt-8" @click="backToShop">
      Tiếp tục mua sắm
    </button>
  </section>

  <div v-else class="mx-auto">
    <button
      type="button"
      class="btn-text inline-flex items-center gap-1.5 mb-6"
      @click="router.push({ name: 'checkout-info' })"
    >
      <Icon name="arrowLeft" :size="16" />
      Thông tin giao hàng
    </button>

    <p class="eyebrow ml-5">Bước 2 / 2</p>
    <h1 class="page-title mt-2">Xác nhận đơn hàng</h1>
    <p class="lede mt-3">Kiểm tra lại trước khi thanh toán.</p>

    <div class="grid gap-6 lg:grid-cols-[1.35fr_1fr] mt-8 items-start">
      <div class="space-y-4">
        <motion.div
          class="surface p-5 sm:p-6"
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
        >
          <h2 class="font-heading font-bold text-[16px]">Giao tới</h2>
          <dl class="mt-4 space-y-2 text-[14px]">
            <div class="flex justify-between gap-4">
              <dt style="color: var(--text-3)">Họ tên</dt>
              <dd class="text-right font-medium">{{ checkout.name }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt style="color: var(--text-3)">Điện thoại</dt>
              <dd class="mono text-right">{{ checkout.phone }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt style="color: var(--text-3)">Email</dt>
              <dd class="text-right break-all">{{ checkout.email }}</dd>
            </div>
            <div class="pt-2" style="border-top: 1px solid var(--line)">
              <dt class="text-[12px] uppercase tracking-[0.08em] mb-1" style="color: var(--text-3)">Địa chỉ</dt>
              <dd>{{ checkout.address }}</dd>
            </div>
            <div v-if="checkout.note">
              <dt class="text-[12px] uppercase tracking-[0.08em] mb-1" style="color: var(--text-3)">Ghi chú</dt>
              <dd style="color: var(--text-2)">{{ checkout.note }}</dd>
            </div>
          </dl>
        </motion.div>

        <motion.div
          class="surface p-5 sm:p-6"
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: 0.05 }"
        >
          <h2 class="font-heading font-bold text-[16px]">Sản phẩm</h2>
          <ul class="mt-4 space-y-3">
            <li
              v-for="{ productId, qty, product } in cartProducts"
              :key="productId"
              class="flex items-center gap-3"
            >
              <img
                :src="productCoverUrl(product)"
                :alt="product.name"
                class="w-14 h-14 rounded-xl object-cover product-img-bg shrink-0"
              />
              <div class="min-w-0 flex-1">
                <p class="text-[13px] font-semibold leading-snug truncate">{{ product.name }}</p>
                <p class="mono text-[12px] mt-0.5" style="color: var(--text-3)">×{{ qty }}</p>
              </div>
              <span class="mono text-[13px] shrink-0">{{ formatCurrency(product.price * qty) }}</span>
            </li>
          </ul>
        </motion.div>

        <motion.div
          class="surface p-5 sm:p-6"
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: 0.08 }"
        >
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-heading font-bold text-[16px] flex items-center gap-2">
              <Icon name="tag" :size="18" />
              Mã giảm giá
            </h2>
            <button
              type="button"
              class="btn-text text-[12.5px]"
              @click="showVoucherList = !showVoucherList"
            >
              {{ showVoucherList ? 'Ẩn mã có sẵn' : 'Chọn mã có sẵn' }}
            </button>
          </div>

          <form class="mt-4 flex gap-2" @submit.prevent="applyVoucherCode(voucherInput)">
            <label class="sr-only" for="voucher-code">Mã giảm giá</label>
            <input
              id="voucher-code"
              v-model="voucherInput"
              type="text"
              maxlength="32"
              autocomplete="off"
              spellcheck="false"
              class="input-field flex-1 min-w-0 px-3.5 py-3 rounded-xl text-[14px] uppercase tracking-wide"
              placeholder="Nhập mã (vd: JBAM10)"
              :disabled="Boolean(appliedVoucher)"
            />
            <button
              v-if="!appliedVoucher"
              type="submit"
              class="btn-ghost shrink-0 px-4 py-3 rounded-xl text-[13.5px] font-semibold"
            >
              Áp dụng
            </button>
            <button
              v-else
              type="button"
              class="btn-ghost shrink-0 px-4 py-3 rounded-xl text-[13.5px] font-semibold"
              @click="clearVoucher"
            >
              Gỡ
            </button>
          </form>

          <p
            v-if="voucherMsg"
            class="mt-2.5 text-[13px]"
            :style="{ color: voucherOk ? 'var(--accent)' : '#f87171' }"
            role="status"
          >
            {{ voucherMsg }}
          </p>

          <ul v-if="showVoucherList" class="mt-4 space-y-2" aria-label="Mã giảm giá có sẵn">
            <li v-for="v in DEMO_VOUCHERS" :key="v.code">
              <button
                type="button"
                class="w-full text-left rounded-2xl px-4 py-3.5 transition-colors flex items-start gap-3"
                :aria-pressed="checkout.voucher_code === v.code"
                :style="{
                  border: `1px solid ${checkout.voucher_code === v.code ? 'var(--accent-line)' : 'var(--line)'}`,
                  background: checkout.voucher_code === v.code ? 'var(--accent-soft)' : 'transparent',
                }"
                @click="applyFromList(v)"
              >
                <span
                  class="mono text-[12px] font-semibold px-2 py-1 rounded-lg shrink-0 mt-0.5"
                  style="background: rgba(0,0,0,0.06); letter-spacing: 0.04em"
                >
                  {{ v.code }}
                </span>
                <span class="min-w-0">
                  <span class="font-semibold text-[14px] block">{{ v.title }}</span>
                  <span class="text-[12.5px] mt-0.5 block" style="color: var(--text-3)">{{ v.hint }}</span>
                </span>
              </button>
            </li>
          </ul>
        </motion.div>

        <motion.div
          class="surface p-5 sm:p-6"
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: 0.1 }"
        >
          <h2 class="font-heading font-bold text-[16px]">Phương thức thanh toán</h2>
          <ul class="mt-4 space-y-2.5" role="radiogroup" aria-label="Phương thức thanh toán">
            <li v-for="method in PAYMENT_METHODS" :key="method.id">
              <button
                type="button"
                role="radio"
                class="w-full text-left rounded-2xl px-4 py-3.5 transition-colors"
                :aria-checked="checkout.payment_method === method.id"
                :style="{
                  border: `1px solid ${checkout.payment_method === method.id ? 'var(--accent-line)' : 'var(--line)'}`,
                  background: checkout.payment_method === method.id ? 'var(--accent-soft)' : 'transparent',
                }"
                @click="selectPayment(method.id)"
              >
                <span class="font-semibold text-[14px] block">{{ method.label }}</span>
                <span class="text-[12.5px] mt-0.5 block" style="color: var(--text-3)">{{ method.hint }}</span>
              </button>
            </li>
          </ul>
        </motion.div>
      </div>

      <motion.aside
        class="surface p-6 lg:sticky lg:top-24"
        :initial="{ opacity: 0, y: 16 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.12 }"
      >
        <h2 class="font-heading font-bold text-[17px]">Thanh toán</h2>
        <dl class="space-y-2.5 mt-5 text-[13.5px]">
          <div class="flex justify-between">
            <dt style="color: var(--text-3)">Tạm tính</dt>
            <dd class="mono">{{ formatCurrency(total) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt style="color: var(--text-3)">Phí giao hàng</dt>
            <dd class="mono" style="color: var(--accent)">Miễn phí</dd>
          </div>
          <div v-if="pointsSaved > 0" class="flex justify-between">
            <dt style="color: var(--text-3)">Đổi điểm tích lũy</dt>
            <dd class="mono" style="color: var(--accent)">−{{ formatCurrency(pointsSaved) }}</dd>
          </div>
          <div v-if="appliedVoucher" class="flex justify-between gap-3">
            <dt style="color: var(--text-3)">
              Mã {{ appliedVoucher.code }}
              <span v-if="appliedVoucher.type === 'shipping'" class="block text-[11px]">Freeship</span>
            </dt>
            <dd class="mono shrink-0" style="color: var(--accent)">
              {{ voucherOff > 0 ? `−${formatCurrency(voucherOff)}` : 'Áp dụng' }}
            </dd>
          </div>
          <div class="flex justify-between">
            <dt style="color: var(--text-3)">Hình thức</dt>
            <dd class="text-right text-[13px]">{{ paymentLabel(checkout.payment_method) }}</dd>
          </div>
        </dl>

        <div class="flex items-baseline justify-between mt-5 pt-5" style="border-top: 1px solid var(--line)">
          <span class="font-heading font-bold text-[15px]">Tổng cộng</span>
          <span class="mono text-2xl font-medium" style="color: var(--accent)">
            {{ formatCurrency(payable) }}
          </span>
        </div>

        <p
          v-if="submitError"
          class="mt-4 px-3.5 py-3 rounded-xl text-[13px]"
          style="background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); color: #fca5a5"
          role="alert"
        >
          {{ submitError }}
        </p>

        <motion.button
          type="button"
          class="w-full mt-5 py-3.5 rounded-2xl btn-primary text-[15px] flex items-center justify-center gap-2 disabled:opacity-50"
          :disabled="submitting || !cartProducts.length"
          :while-tap="{ scale: 0.985 }"
          @click="placeOrder"
        >
          {{ submitting ? 'Đang xử lý' : 'Xác nhận thanh toán' }}
          <Icon v-if="!submitting" name="check" :size="17" />
        </motion.button>

        <p class="mt-4 text-[12px] leading-relaxed text-center" style="color: var(--text-3)">
          Bằng việc xác nhận, bạn đồng ý với điều khoản mua hàng của JBadminton.
          MoMo / Apple Pay sẽ được kết nối cổng thanh toán ở bước sau.
        </p>
      </motion.aside>
    </div>
  </div>
</template>
