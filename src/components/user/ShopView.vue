<script setup>
import { ref, inject, onMounted, computed } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import { getProducts } from '../../api'
import Stars from '../common/Stars.vue'
import { categoryLabels, catIcons, formatCurrency } from '../../utils/labels'

const cart = inject('cart')
const favorites = inject('favorites')
const addToCartFn = inject('addToCart')
const toggleFavorite = inject('toggleFavorite')
const openProductDetail = inject('openProductDetail', null)

const emit = defineEmits(['product-detail'])

const products = ref([])
const filter = ref('all')
const search = ref('')
const addedId = ref(null)

const cats = [
  { id: 'all', label: 'Tất cả' },
  { id: 'racket', label: '🏸 Vợt' },
  { id: 'shoes', label: '👟 Giày' },
  { id: 'shirt', label: '👕 Áo' },
  { id: 'shorts', label: '🩳 Quần' },
  { id: 'shuttlecock', label: 'Cầu' },
  { id: 'bag', label: '🎒 Túi' },
  { id: 'grip', label: 'Grip' },
]

const filtered = computed(() =>
  products.value
    .filter((p) => filter.value === 'all' || p.category === filter.value)
    .filter((p) => {
      if (!search.value) return true
      const q = search.value.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    }),
)

onMounted(async () => {
  products.value = await getProducts()
})

function addToCart(productId) {
  addToCartFn(productId)
  addedId.value = productId
  setTimeout(() => { addedId.value = null }, 1200)
}

function isFavorite(id) {
  return favorites.value.includes(id)
}

function inCart(id) {
  return cart.value.find((x) => x.productId === id)
}

function catFilterStyle(id) {
  if (filter.value !== id) {
    return { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)' }
  }
  return { background: '#84cc16', color: '#0a1200', border: '1px solid transparent', fontWeight: 700 }
}

function cartBtnStyle(p, justAdded, inCartItem) {
  if (justAdded) {
    return { background: 'rgba(132,204,22,0.15)', color: '#84cc16', border: '1px solid rgba(132,204,22,0.3)' }
  }
  if (inCartItem) {
    return { background: 'rgba(132,204,22,0.1)', color: '#84cc16', border: '1px solid rgba(132,204,22,0.25)' }
  }
  return { background: 'linear-gradient(135deg, #84cc16, #a3e635)', color: '#0a1200', border: 'none' }
}

function cartBtnLabel(p, justAdded, inCartItem) {
  if (p.stock === 0) return 'Hết hàng'
  if (justAdded) return '✓ Đã thêm!'
  if (inCartItem) return `Giỏ hàng (${inCartItem.qty})`
  return 'Thêm vào giỏ'
}

function onProductClick(p) {
  if (openProductDetail) openProductDetail(p)
  else emit('product-detail', p)
}
</script>

<template>
  <div class="space-y-6">
    <motion.div :initial="{ opacity: 0, y: -10 }" :animate="{ opacity: 1, y: 0 }">
      <h1 class="font-heading" style="font-size: 30px; font-weight: 800; letter-spacing: -0.5px">Cửa hàng</h1>
      <p style="color: #64748b; margin-top: 4px; font-size: 14px">Trang bị cầu lông chính hãng · Giao hàng miễn phí</p>
    </motion.div>

    <motion.div
      class="flex flex-wrap gap-2 items-center"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :transition="{ delay: 0.1 }"
    >
      <div class="relative w-full">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style="color: #475569">🔍</span>
        <input
          v-model="search"
          type="text"
          placeholder="Tìm sản phẩm..."
          class="input-field rounded-xl pl-9 pr-4 py-2.5 text-sm w-52 w-full"
        />
      </div>
      <motion.button
        v-for="c in cats"
        :key="c.id"
        class="pill transition-all"
        :style="catFilterStyle(c.id)"
        :while-hover="{ scale: 1.04 }"
        :while-tap="{ scale: 0.96 }"
        @click="filter = c.id"
      >
        {{ c.label }}
      </motion.button>
    </motion.div>

    <motion.div layout class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        <motion.div
          v-for="(p, i) in filtered"
          :key="p.id"
          layout
          class="rounded-2xl overflow-hidden group relative"
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07)"
          :initial="{ opacity: 0, scale: 0.9 }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{ opacity: 0, scale: 0.85 }"
          :transition="{ delay: i * 0.04 }"
          :while-hover="{ y: -4, borderColor: 'rgba(255,255,255,0.14)' }"
        >
          <div
            class="relative h-36 flex items-center justify-center overflow-hidden cursor-pointer product-img-bg"
            @click="onProductClick(p)"
          >
            <motion.div
              style="font-size: 56px; opacity: 0.35"
              :animate="{ y: [-3, 3, -3] }"
              :transition="{ duration: 3 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }"
            >
              {{ catIcons[p.category] || '◈' }}
            </motion.div>
            <div
              class="absolute inset-x-0 bottom-0 h-12"
              style="background: linear-gradient(to top, rgba(255,255,255,0.04), transparent)"
            />
            <div class="absolute top-2 left-2 flex gap-1.5">
              <span
                v-if="p.original_price && p.original_price > p.price"
                class="pill"
                style="background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); font-size: 10px"
              >
                -{{ Math.round((1 - p.price / p.original_price) * 100) }}%
              </span>
              <span
                v-if="p.featured"
                class="pill"
                style="background: rgba(250,204,21,0.2); color: #facc15; border: 1px solid rgba(250,204,21,0.3); font-size: 10px"
              >
                🔥 Hot
              </span>
            </div>
            <motion.button
              class="absolute top-2 right-2 w-10 h-10 sm:w-7 sm:h-7 rounded-full flex items-center justify-center"
              :style="{
                background: isFavorite(p.id) ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)',
                color: isFavorite(p.id) ? '#ef4444' : '#64748b',
                border: `1px solid ${isFavorite(p.id) ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
              }"
              :while-hover="{ scale: 1.15 }"
              :while-tap="{ scale: 0.85 }"
              @click.stop="toggleFavorite(p.id)"
            >
              <motion.span
                style="font-size: 13px"
                :animate="isFavorite(p.id) ? { scale: [1, 1.4, 1] } : {}"
                :transition="{ duration: 0.3 }"
              >
                {{ isFavorite(p.id) ? '♥' : '♡' }}
              </motion.span>
            </motion.button>
          </div>

          <div class="p-4 cursor-pointer" @click="onProductClick(p)">
            <div style="color: #475569; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px">
              {{ p.brand }} · {{ categoryLabels[p.category] }}
            </div>
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; line-height: 1.35">{{ p.name }}</div>
            <Stars :rating="p.rating" />
            <div class="flex items-baseline gap-2 mt-2 mb-3">
              <span class="mono text-base" style="color: #84cc16; font-weight: 600">{{ formatCurrency(p.price) }}</span>
              <span
                v-if="p.original_price"
                class="mono text-xs line-through"
                style="color: #475569"
              >
                {{ formatCurrency(p.original_price) }}
              </span>
            </div>
            <motion.button
              class="w-full py-3 sm:py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden min-h-[44px]"
              :style="cartBtnStyle(p, addedId === p.id, inCart(p.id))"
              :disabled="p.stock === 0"
              :while-hover="p.stock > 0 ? { scale: 1.02 } : {}"
              :while-tap="p.stock > 0 ? { scale: 0.97 } : {}"
              @click.stop="addToCart(p.id)"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  :key="addedId === p.id ? 'added' : 'normal'"
                  :initial="{ opacity: 0, y: 6 }"
                  :animate="{ opacity: 1, y: 0 }"
                  :exit="{ opacity: 0, y: -6 }"
                  :transition="{ duration: 0.2 }"
                >
                  {{ cartBtnLabel(p, addedId === p.id, inCart(p.id)) }}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  </div>
</template>
