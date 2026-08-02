<script setup>
import { ref, inject, onMounted, computed } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import { getProducts, createOrder } from '../../api'
import { formatCurrency, catIcons } from '../../utils/labels'

const user = inject('user')
const cart = inject('cart')
const setCart = inject('setCart')

const products = ref([])
const ordered = ref(false)
const checkingOut = ref(false)
const orderResult = ref(null)

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

onMounted(async () => {
  products.value = await getProducts()
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
  checkingOut.value = true
  try {
    orderResult.value = await createOrder({
      member_id: user.value?.id || 'm1',
      status: 'paid',
      items: cartProducts.value.map((i) => ({
        product_id: i.productId,
        qty: i.qty,
        price: i.product.price,
      })),
    })
    setCart([])
    ordered.value = true
  } finally {
    checkingOut.value = false
  }
}

function continueShopping() {
  ordered.value = false
}
</script>

<template>
  <div v-if="ordered" class="flex flex-col items-center justify-center min-h-72 text-center">
    <motion.div
      :initial="{ scale: 0 }"
      :animate="{ scale: 1 }"
      :transition="{ type: 'spring', stiffness: 300, damping: 18 }"
    >
      <motion.div
        class="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl"
        style="background: rgba(132,204,22,0.15); border: 2px solid rgba(132,204,22,0.35)"
        :animate="{ boxShadow: ['0 0 20px rgba(132,204,22,0.3)', '0 0 40px rgba(132,204,22,0.5)', '0 0 20px rgba(132,204,22,0.3)'] }"
        :transition="{ duration: 2, repeat: Infinity }"
      >
        ✓
      </motion.div>
    </motion.div>
    <motion.h2
      class="font-heading"
      style="font-size: 24px; font-weight: 800; color: #84cc16"
      :initial="{ opacity: 0, y: 10 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ delay: 0.2 }"
    >
      Đặt hàng thành công!
    </motion.h2>
    <motion.p
      style="color: #64748b; margin-top: 8px; font-size: 14px"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :transition="{ delay: 0.35 }"
    >
      Đơn hàng đang được xử lý và giao đến bạn.
    </motion.p>
    <motion.button
      class="mt-6 btn-ghost px-6 py-2.5 rounded-xl text-sm"
      :initial="{ opacity: 0, y: 10 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ delay: 0.5 }"
      :while-hover="{ scale: 1.04 }"
      :while-tap="{ scale: 0.96 }"
      @click="continueShopping"
    >
      Tiếp tục mua sắm
    </motion.button>
  </div>

  <div v-else-if="cartProducts.length === 0" class="flex flex-col items-center justify-center min-h-72 text-center">
    <motion.div
      :initial="{ scale: 0.5, opacity: 0 }"
      :animate="{ scale: 1, opacity: 0.25 }"
      style="font-size: 72px; margin-bottom: 16px"
    >
      🛒
    </motion.div>
    <h2 class="font-heading" style="font-size: 20px; font-weight: 700; color: #f0f4ff">Giỏ hàng trống</h2>
    <p style="color: #64748b; font-size: 13px; margin-top: 6px">Hãy thêm sản phẩm từ cửa hàng nhé!</p>
  </div>

  <div v-else class="space-y-6 max-w-2xl">
    <motion.div :initial="{ opacity: 0, y: -10 }" :animate="{ opacity: 1, y: 0 }">
      <h1 class="page-title">Giỏ hàng</h1>
      <p style="color: #64748b; margin-top: 4px; font-size: 14px">{{ cartProducts.length }} sản phẩm</p>
    </motion.div>

    <div class="space-y-3">
      <AnimatePresence>
        <motion.div
          v-for="({ productId, qty, product }, i) in cartProducts"
          :key="productId"
          class="rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07)"
          :initial="{ opacity: 0, x: -20 }"
          :animate="{ opacity: 1, x: 0 }"
          :exit="{ opacity: 0, x: 20, height: 0 }"
          :transition="{ delay: i * 0.05 }"
        >
          <div class="flex items-start gap-3 min-w-0">
            <div
              class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07)"
            >
              {{ catIcons[product.category] || '◈' }}
            </div>
            <div class="flex-1 min-w-0">
              <div style="font-weight: 600; font-size: 14px" class="leading-snug">{{ product.name }}</div>
              <div style="color: #64748b; font-size: 12px; margin-top: 2px">{{ product.brand }}</div>
              <div class="mono text-sm mt-1" style="color: #84cc16; font-weight: 600">{{ formatCurrency(product.price) }}</div>
            </div>
          </div>
          <div class="flex items-center justify-between gap-3 w-full sm:w-auto sm:contents">
            <div class="flex items-center gap-2">
              <motion.button
                class="w-9 h-9 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center btn-ghost text-sm"
                :while-hover="{ scale: 1.1 }"
                :while-tap="{ scale: 0.9 }"
                @click="updateQty(productId, -1)"
              >
                −
              </motion.button>
              <span class="mono w-7 text-center text-sm font-medium">{{ qty }}</span>
              <motion.button
                class="w-9 h-9 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center btn-ghost text-sm"
                :while-hover="{ scale: 1.1 }"
                :while-tap="{ scale: 0.9 }"
                @click="updateQty(productId, 1)"
              >
                +
              </motion.button>
            </div>
            <div class="flex items-center gap-2">
              <div class="mono font-semibold text-sm sm:w-28 sm:text-right">{{ formatCurrency(product.price * qty) }}</div>
              <motion.button
                class="text-sm w-9 h-9 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center btn-ghost"
                style="color: #ef4444"
                :while-hover="{ scale: 1.1, background: 'rgba(239,68,68,0.15)' }"
                :while-tap="{ scale: 0.9 }"
                @click="removeItem(productId)"
              >
                ✕
              </motion.button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>

    <motion.div
      class="rounded-3xl p-6"
      style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07)"
      :initial="{ opacity: 0, y: 15 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ delay: 0.3 }"
    >
      <div class="space-y-2.5 mb-5">
        <div
          v-for="[k, v, c] in [
            ['Tạm tính', formatCurrency(total), '#f0f4ff'],
            ['Phí vận chuyển', 'Miễn phí', '#84cc16'],
            ['Điểm tiết kiệm', '−' + formatCurrency(pointsSaved), '#6366f1'],
          ]"
          :key="k"
          class="flex justify-between text-sm"
        >
          <span style="color: #64748b">{{ k }}</span>
          <span class="mono font-medium" :style="{ color: c }">{{ v }}</span>
        </div>
        <div style="height: 1px; background: rgba(255,255,255,0.07); margin: 8px 0" />
        <div class="flex justify-between">
          <span style="font-weight: 700; font-size: 15px">Tổng cộng</span>
          <span class="mono text-xl font-medium" style="color: #84cc16">{{ formatCurrency(total) }}</span>
        </div>
      </div>
      <motion.button
        class="w-full py-3.5 rounded-2xl btn-primary text-sm flex items-center justify-center gap-2"
        style="font-size: 15px"
        :disabled="checkingOut"
        :while-hover="{ scale: 1.02 }"
        :while-tap="{ scale: 0.97 }"
        @click="checkout"
      >
        <span>{{ checkingOut ? 'Đang xử lý...' : 'Đặt hàng ngay' }}</span>
        <span v-if="!checkingOut">→</span>
      </motion.button>
    </motion.div>
  </div>
</template>
