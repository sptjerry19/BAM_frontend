<script setup>
import { ref, inject, onMounted, computed } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import { getProducts, createOrder } from '../../api'
import Icon from '../common/Icon.vue'
import { formatCurrency, productCoverUrl } from '../../utils/labels'

const user = inject('user')
const cart = inject('cart')
const setCart = inject('setCart')
const goToShop = inject('goToShop', null)
const requireAuth = inject('requireAuth', null)

const emit = defineEmits(['continue-shopping'])

const products = ref([])
const ordered = ref(false)
const checkingOut = ref(false)
const orderResult = ref(null)
const checkoutError = ref('')

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

const pointsSaved = computed(() => (user.value?.points ?? 0) * 10)
const payable = computed(() => Math.max(0, total.value - pointsSaved.value))

onMounted(async () => {
  products.value = (await getProducts(undefined, { per_page: 100 })).data
})

function updateQty(productId, delta) {
  if (delta === -1) {
    const item = cart.value.find((i) => i.productId === productId)
    if (item?.qty === 1) {
      setCart(cart.value.filter((i) => i.productId !== productId))
    } else {
      setCart(
        cart.value.map((i) =>
          i.productId === productId ? { ...i, qty: i.qty + delta } : i,
        ),
      )
    }
  } else {
    setCart(
      cart.value.map((i) =>
        i.productId === productId ? { ...i, qty: i.qty + delta } : i,
      ),
    )
  }
}

function removeItem(productId) {
  setCart(cart.value.filter((i) => i.productId !== productId))
}

async function checkout() {
  if (!cartProducts.value.length) return
  if (requireAuth && !requireAuth('/cart')) return
  if (!user.value?.id) {
    checkoutError.value = 'Vui lòng đăng nhập để đặt hàng.'
    return
  }
  checkingOut.value = true
  checkoutError.value = ''
  try {
    orderResult.value = await createOrder({
      member_id: user.value.id,
      status: 'paid',
      items: cartProducts.value.map((i) => ({
        product_id: i.productId,
        qty: i.qty,
        price: i.product.price,
      })),
    })
    setCart([])
    ordered.value = true
  } catch {
    checkoutError.value = 'Chúng tôi chưa gửi được đơn hàng. Vui lòng thử lại sau ít phút.'
  } finally {
    checkingOut.value = false
  }
}

function backToShop() {
  ordered.value = false
  if (goToShop) goToShop()
  else emit('continue-shopping')
}
</script>

<template>
  <!-- Order confirmed -->
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
      Chúng tôi đang đóng gói và sẽ giao trong 48 giờ. Mã đơn và thông tin vận chuyển
      được gửi tới email của bạn.
    </p>

    <p v-if="orderResult?.id" class="mono mt-5 text-[13px]" style="color: var(--text-3)">
      Mã đơn: {{ orderResult.id }}
    </p>

    <button type="button" class="btn-primary px-7 py-3.5 rounded-2xl text-[15px] mt-8" @click="backToShop">
      Tiếp tục mua sắm
    </button>
  </section>

  <!-- Empty -->
  <section v-else-if="cartProducts.length === 0" class="max-w-lg mx-auto text-center py-10">
    <span
      class="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center"
      style="background: rgba(255,255,255,0.04); color: var(--text-2); border: 1px solid var(--line)"
    >
      <Icon name="bag" :size="28" />
    </span>
    <h1 class="page-title mt-6">Giỏ hàng đang trống</h1>
    <p class="lede mx-auto mt-3">
      Thêm vợt, giày hoặc ống cầu vào giỏ để đặt cùng một lần và tiết kiệm phí giao hàng.
    </p>
    <button type="button" class="btn-primary px-7 py-3.5 rounded-2xl text-[15px] mt-8" @click="backToShop">
      Xem cửa hàng
    </button>
  </section>

  <!-- Cart -->
  <div v-else>
    <header>
      <h1 class="page-title">Giỏ hàng</h1>
      <p class="lede mt-3">{{ cartProducts.length }} sản phẩm · giao miễn phí nội thành Hà Nội</p>
    </header>

    <div class="grid gap-6 lg:grid-cols-[1.6fr_1fr] mt-9 items-start">
      <ul class="space-y-3">
        <AnimatePresence>
          <motion.li
            v-for="({ productId, qty, product }, i) in cartProducts"
            :key="productId"
            class="surface p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            :initial="{ opacity: 0, y: 14 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, x: 24 }"
            :transition="{ delay: Math.min(i, 6) * 0.05 }"
          >
            <img
              :src="productCoverUrl(product)"
              :alt="`${product.brand} ${product.name}`"
              class="w-16 h-16 rounded-xl object-cover shrink-0 product-img-bg"
            />

            <div class="flex-1 min-w-0">
              <p class="text-[10.5px] uppercase tracking-[0.1em]" style="color: var(--text-3)">
                {{ product.brand }}
              </p>
              <p class="font-semibold text-[14px] leading-snug mt-0.5">{{ product.name }}</p>
              <p class="mono text-[13px] mt-1" style="color: var(--accent)">
                {{ formatCurrency(product.price) }}
              </p>
            </div>

            <div class="flex items-center justify-between gap-4">
              <div
                class="flex items-center gap-1 rounded-xl p-1"
                style="background: rgba(255,255,255,0.04); border: 1px solid var(--line)"
              >
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                  :aria-label="`Giảm số lượng ${product.name}`"
                  @click="updateQty(productId, -1)"
                >
                  <Icon name="minus" :size="15" />
                </button>
                <span class="mono w-7 text-center text-[13px]">{{ qty }}</span>
                <button
                  type="button"
                  class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                  :aria-label="`Tăng số lượng ${product.name}`"
                  @click="updateQty(productId, 1)"
                >
                  <Icon name="plus" :size="15" />
                </button>
              </div>

              <span class="mono text-[14px] font-medium sm:w-28 sm:text-right">
                {{ formatCurrency(product.price * qty) }}
              </span>

              <button
                type="button"
                class="icon-btn w-9 h-9"
                style="color: #f87171"
                :aria-label="`Xóa ${product.name} khỏi giỏ`"
                @click="removeItem(productId)"
              >
                <Icon name="trash" :size="16" />
              </button>
            </div>
          </motion.li>
        </AnimatePresence>
      </ul>

      <motion.aside
        class="surface p-6 lg:sticky lg:top-24"
        :initial="{ opacity: 0, y: 18 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.15 }"
      >
        <h2 class="font-heading font-bold text-[17px]">Tóm tắt đơn</h2>

        <dl class="space-y-2.5 mt-5 text-[13.5px]">
          <div class="flex justify-between">
            <dt style="color: var(--text-3)">Tạm tính</dt>
            <dd class="mono">{{ formatCurrency(total) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt style="color: var(--text-3)">Phí giao hàng</dt>
            <dd class="mono" style="color: var(--accent)">Miễn phí</dd>
          </div>
          <div class="flex justify-between">
            <dt style="color: var(--text-3)">Đổi điểm tích lũy</dt>
            <dd class="mono" style="color: var(--accent)">−{{ formatCurrency(pointsSaved) }}</dd>
          </div>
        </dl>

        <div class="flex items-baseline justify-between mt-5 pt-5" style="border-top: 1px solid var(--line)">
          <span class="font-heading font-bold text-[15px]">Thanh toán</span>
          <span class="mono text-2xl font-medium" style="color: var(--accent)">
            {{ formatCurrency(payable) }}
          </span>
        </div>

        <p
          v-if="checkoutError"
          class="mt-4 px-3.5 py-3 rounded-xl text-[13px]"
          style="background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); color: #fca5a5"
          role="alert"
        >
          {{ checkoutError }}
        </p>

        <motion.button
          type="button"
          class="w-full mt-5 py-3.5 rounded-2xl btn-primary text-[15px] flex items-center justify-center gap-2 disabled:opacity-50"
          :disabled="checkingOut"
          :while-tap="{ scale: 0.985 }"
          @click="checkout"
        >
          {{ checkingOut ? 'Đang xử lý' : 'Đặt hàng' }}
          <Icon v-if="!checkingOut" name="arrowRight" :size="17" />
        </motion.button>

        <button type="button" class="btn-text mt-4 mx-auto" @click="backToShop">
          Mua thêm sản phẩm
        </button>
      </motion.aside>
    </div>
  </div>
</template>
