<script setup>
import { ref, inject, onMounted, computed, watch } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import { getProducts } from '../../api'
import Stars from '../common/Stars.vue'
import Icon from '../common/Icon.vue'
import { categoryLabels, formatCurrency, productCoverUrl } from '../../utils/labels'

const cart = inject('cart')
const favorites = inject('favorites')
const addToCartFn = inject('addToCart')
const toggleFavorite = inject('toggleFavorite')
const openProductDetail = inject('openProductDetail', null)

const emit = defineEmits(['product-detail'])

const products = ref([])
const filter = ref('all')
const search = ref('')
const searchQuery = ref('')
const page = ref(1)
const perPage = ref(12)
const loading = ref(true)
const addedId = ref(null)
const pagination = ref({
  current_page: 1,
  per_page: 12,
  total: 0,
  last_page: 1,
  from: 0,
  to: 0,
  has_more_pages: false,
})

const cats = [
  { id: 'all', label: 'Tất cả' },
  { id: 'racket', label: 'Vợt' },
  { id: 'shoes', label: 'Giày' },
  { id: 'shirt', label: 'Áo' },
  { id: 'shorts', label: 'Quần' },
  { id: 'shuttlecock', label: 'Cầu' },
  { id: 'bag', label: 'Túi' },
  { id: 'grip', label: 'Grip' },
]

const pageNumbers = computed(() => {
  const last = pagination.value.last_page || 1
  const current = pagination.value.current_page || 1
  const windowSize = 5
  let start = Math.max(1, current - Math.floor(windowSize / 2))
  const end = Math.min(last, start + windowSize - 1)
  start = Math.max(1, end - windowSize + 1)

  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

const rangeLabel = computed(() => {
  const { from, to, total } = pagination.value
  if (!total) return 'Chưa có sản phẩm nào'
  return `${from}–${to} trong ${total.toLocaleString('vi-VN')} sản phẩm`
})

let searchTimer = null

async function loadProducts() {
  loading.value = true
  try {
    const category = filter.value === 'all' ? undefined : filter.value
    const res = await getProducts(category, {
      page: page.value,
      per_page: perPage.value,
      ...(searchQuery.value ? { search: searchQuery.value } : {}),
    })
    products.value = res.data
    if (res.pagination) {
      pagination.value = res.pagination
      page.value = res.pagination.current_page
    }
  } finally {
    loading.value = false
  }
}

function goToPage(p) {
  const last = pagination.value.last_page || 1
  const next = Math.min(Math.max(1, p), last)
  if (next === page.value) return
  page.value = next
  loadProducts()
  document.getElementById('shop-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function setFilter(id) {
  if (filter.value === id) return
  filter.value = id
  page.value = 1
  loadProducts()
}

function resetFilters() {
  filter.value = 'all'
  search.value = ''
  searchQuery.value = ''
  page.value = 1
  loadProducts()
}

watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchQuery.value = value.trim()
    page.value = 1
    loadProducts()
  }, 350)
})

onMounted(loadProducts)

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

function discountPct(p) {
  if (!p.original_price || p.original_price <= p.price) return 0
  return Math.round((1 - p.price / p.original_price) * 100)
}

function isOwned(p) {
  return addedId.value === p.id || Boolean(inCart(p.id))
}

function cartBtnLabel(p, justAdded, inCartItem) {
  if (p.stock === 0) return 'Tạm hết hàng'
  if (justAdded) return 'Đã thêm'
  if (inCartItem) return `Trong giỏ · ${inCartItem.qty}`
  return 'Thêm vào giỏ'
}

function onProductClick(p) {
  if (openProductDetail) openProductDetail(p)
  else emit('product-detail', p)
}
</script>

<template>
  <div>
    <header class="flex flex-wrap items-end justify-between gap-6">
      <div>
        <span class="eyebrow">
          <Icon name="spark" :size="14" />
          Hàng chính hãng · bảo hành 12 tháng
        </span>
        <h1 class="page-title mt-4">Cửa hàng trang bị</h1>
        <p class="lede mt-3">
          Vợt, giày, cầu và phụ kiện được chọn theo lối chơi. Giao trong 48 giờ nội thành,
          đổi trả 14 ngày nếu chưa dùng.
        </p>
      </div>

      <div class="relative w-full sm:w-80">
        <span class="absolute left-3.5 top-1/2 -translate-y-1/2" style="color: var(--text-3)">
          <Icon name="search" :size="17" />
        </span>
        <label class="sr-only" for="shop-search">Tìm sản phẩm</label>
        <input
          id="shop-search"
          v-model="search"
          type="search"
          placeholder="Tìm vợt, giày, thương hiệu..."
          class="input-field rounded-2xl w-full pl-11 pr-4 py-3 text-sm"
        />
      </div>
    </header>

    <div class="flex flex-wrap gap-2 mt-8" role="group" aria-label="Lọc theo danh mục">
      <button
        v-for="c in cats"
        :key="c.id"
        type="button"
        class="chip"
        :aria-pressed="filter === c.id"
        @click="setFilter(c.id)"
      >
        {{ c.label }}
      </button>
    </div>

    <div class="flex items-center justify-between gap-3 mt-7 text-[13px]" style="color: var(--text-3)">
      <span class="mono">{{ rangeLabel }}</span>
      <span v-if="loading" style="color: var(--accent)">Đang tải</span>
    </div>

    <div id="shop-grid" class="scroll-mt-24 mt-4">
      <div v-if="loading" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div v-for="n in 8" :key="n" class="skeleton h-[330px]" style="border-radius: var(--r-lg)" />
      </div>

      <div
        v-else-if="products.length === 0"
        class="surface-quiet px-6 py-20 text-center"
      >
        <span
          class="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
          style="background: var(--accent-soft); color: var(--accent)"
        >
          <Icon name="search" :size="23" />
        </span>
        <p class="font-heading font-bold text-[17px] mt-4">Không tìm thấy sản phẩm nào</p>
        <p class="mt-1.5 text-[13.5px]" style="color: var(--text-3)">
          Thử từ khóa khác, hoặc bỏ bộ lọc danh mục đang chọn.
        </p>
        <button type="button" class="btn-text mt-5 mx-auto" @click="resetFilters">
          Xóa bộ lọc
          <Icon name="arrowRight" :size="16" />
        </button>
      </div>

      <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          <motion.article
            v-for="(p, i) in products"
            :key="p.id"
            class="surface spotlight lift overflow-hidden flex flex-col"
            :initial="{ opacity: 0, y: 18 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, scale: 0.96 }"
            :transition="{ delay: Math.min(i, 8) * 0.035, duration: 0.4, ease: [0.22, 1, 0.36, 1] }"
          >
            <div
              class="relative h-44 overflow-hidden cursor-pointer product-img-bg"
              @click="onProductClick(p)"
            >
              <img
                :src="productCoverUrl(p)"
                :alt="`${p.brand} ${p.name}`"
                class="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                loading="lazy"
              />

              <div class="absolute top-3 left-3 flex gap-1.5">
                <span
                  v-if="discountPct(p) > 0"
                  class="tag"
                  style="background: rgba(248,113,113,0.18); color: #fca5a5; backdrop-filter: blur(6px)"
                >
                  −{{ discountPct(p) }}%
                </span>
                <span
                  v-if="p.featured"
                  class="tag"
                  style="background: rgba(250,204,21,0.16); color: #fde047; backdrop-filter: blur(6px)"
                >
                  bán chạy
                </span>
              </div>

              <button
                type="button"
                class="icon-btn absolute top-2.5 right-2.5 w-9 h-9"
                :style="{
                  color: isFavorite(p.id) ? '#f87171' : 'var(--text-2)',
                  background: isFavorite(p.id) ? 'rgba(248,113,113,0.16)' : 'color-mix(in srgb, var(--bg) 55%, transparent)',
                }"
                :aria-pressed="isFavorite(p.id)"
                :aria-label="isFavorite(p.id) ? `Bỏ ${p.name} khỏi yêu thích` : `Lưu ${p.name} vào yêu thích`"
                @click.stop="toggleFavorite(p.id)"
              >
                <Icon name="heart" :size="17" />
              </button>

              <span
                v-if="p.stock === 0"
                class="absolute inset-x-0 bottom-0 py-1.5 text-center text-[11px] font-semibold"
                style="background: color-mix(in srgb, var(--bg) 82%, transparent); color: var(--text-2)"
              >
                Tạm hết hàng
              </span>
            </div>

            <div class="p-4 flex flex-col flex-1">
              <p class="text-[10.5px] uppercase tracking-[0.1em]" style="color: var(--text-3)">
                {{ p.brand }} · {{ categoryLabels[p.category] }}
              </p>
              <h3
                class="font-semibold text-[14px] leading-snug mt-1.5 cursor-pointer line-clamp-2"
                @click="onProductClick(p)"
              >
                {{ p.name }}
              </h3>

              <div class="mt-2">
                <Stars :rating="p.rating" />
              </div>

              <div class="flex items-baseline gap-2 mt-3">
                <span class="mono text-[16px] font-medium" style="color: var(--accent)">
                  {{ formatCurrency(p.price) }}
                </span>
                <span
                  v-if="p.original_price && p.original_price > p.price"
                  class="mono text-[12px] line-through"
                  style="color: var(--text-3)"
                >
                  {{ formatCurrency(p.original_price) }}
                </span>
              </div>

              <!-- Pinned so CTAs align across cards of different title lengths -->
              <motion.button
                type="button"
                class="w-full mt-auto py-3 rounded-xl text-[13px] font-bold disabled:opacity-35 disabled:cursor-not-allowed"
                :class="isOwned(p) ? 'btn-owned' : 'btn-primary'"
                :disabled="p.stock === 0"
                :while-tap="p.stock > 0 ? { scale: 0.98 } : {}"
                @click.stop="addToCart(p.id)"
              >
                {{ cartBtnLabel(p, addedId === p.id, inCart(p.id)) }}
              </motion.button>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </div>

    <nav
      v-if="pagination.last_page > 1"
      class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10"
      aria-label="Phân trang sản phẩm"
    >
      <p class="mono text-[12.5px]" style="color: var(--text-3)">
        Trang {{ pagination.current_page }} / {{ pagination.last_page.toLocaleString('vi-VN') }}
      </p>

      <div class="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          class="icon-btn disabled:opacity-30"
          aria-label="Trang trước"
          :disabled="pagination.current_page <= 1 || loading"
          @click="goToPage(pagination.current_page - 1)"
        >
          <Icon name="arrowLeft" :size="17" />
        </button>

        <button
          v-for="n in pageNumbers"
          :key="n"
          type="button"
          class="w-10 h-10 rounded-xl mono text-[13px] transition-colors"
          :style="n === pagination.current_page
            ? { background: 'var(--accent)', color: '#0a1200', fontWeight: 700 }
            : { background: 'rgba(255,255,255,0.04)', color: 'var(--text-2)', border: '1px solid var(--line)' }"
          :aria-current="n === pagination.current_page ? 'page' : undefined"
          :disabled="loading"
          @click="goToPage(n)"
        >
          {{ n }}
        </button>

        <button
          type="button"
          class="icon-btn disabled:opacity-30"
          aria-label="Trang sau"
          :disabled="!pagination.has_more_pages || loading"
          @click="goToPage(pagination.current_page + 1)"
        >
          <Icon name="arrowRight" :size="17" />
        </button>
      </div>
    </nav>
  </div>
</template>
