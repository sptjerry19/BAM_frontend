<script setup>
/**
 * Shop — Nike-style product listing (filters + image-first grid).
 */
import { ref, inject, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getProducts } from '../../api'
import Icon from '../common/Icon.vue'
import CategoryDropdown from './CategoryDropdown.vue'
import { categoryLabels, formatCurrency, productCoverUrl } from '../../utils/labels'

const router = useRouter()
const cart = inject('cart')
const favorites = inject('favorites')
const addToCartFn = inject('addToCart')
const toggleFavorite = inject('toggleFavorite')

const products = ref([])
const filter = ref('all')
const search = ref('')
const searchQuery = ref('')
const page = ref(1)
const perPage = ref(12)
const loading = ref(true)
const addedId = ref(null)
const filtersOpen = ref(false)
const pagination = ref({
  current_page: 1,
  per_page: 12,
  total: 0,
  last_page: 1,
  from: 0,
  to: 0,
  has_more_pages: false,
})

/**
 * UI category tree. `children` prepare for future BE subcategories.
 * Leaves that already exist in BE (shirt, bag, …) are queried as-is;
 * synthetic leaves fall back to their parent id for the current API.
 */
const categoryTree = [
  { id: 'all', label: 'Tất cả' },
  {
    id: 'racket',
    label: 'Vợt',
    children: [
      { id: 'racket-offensive', label: 'Tấn công' },
      { id: 'racket-defensive', label: 'Phòng thủ' },
      { id: 'racket-allround', label: 'Toàn diện' },
    ],
  },
  {
    id: 'shoes',
    label: 'Giày',
    children: [
      { id: 'shoes-indoor', label: 'Trong nhà' },
      { id: 'shoes-training', label: 'Tập luyện' },
    ],
  },
  {
    id: 'apparel',
    label: 'Trang phục',
    children: [
      { id: 'shirt', label: 'Áo' },
      { id: 'shorts', label: 'Quần' },
    ],
  },
  {
    id: 'shuttlecock',
    label: 'Cầu',
    children: [
      { id: 'shuttlecock-feather', label: 'Cầu lông vũ' },
      { id: 'shuttlecock-nylon', label: 'Cầu nhựa' },
    ],
  },
  {
    id: 'accessories',
    label: 'Phụ kiện',
    children: [
      { id: 'bag', label: 'Túi' },
      { id: 'grip', label: 'Grip' },
    ],
  },
]

/** Categories the current products API already understands. */
const BE_CATEGORIES = new Set([
  'racket',
  'shoes',
  'shirt',
  'shorts',
  'shuttlecock',
  'bag',
  'grip',
])

/** Map UI selection → API `category` param (no BE changes). */
function apiCategoryFromFilter(uiId) {
  if (!uiId || uiId === 'all') return undefined
  if (BE_CATEGORIES.has(uiId)) return uiId

  for (const node of categoryTree) {
    if (node.id === 'all') continue
    if (node.id === uiId) {
      return BE_CATEGORIES.has(node.id) ? node.id : undefined
    }
    const child = (node.children || []).find((c) => c.id === uiId)
    if (child) {
      if (BE_CATEGORIES.has(child.id)) return child.id
      if (BE_CATEGORIES.has(node.id)) return node.id
    }
  }
  return undefined
}

function labelForFilter(uiId) {
  if (!uiId || uiId === 'all') return 'Cửa hàng trang bị'
  for (const node of categoryTree) {
    if (node.id === uiId) return node.label
    const child = (node.children || []).find((c) => c.id === uiId)
    if (child) return child.label
  }
  return 'Cửa hàng'
}

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

const heading = computed(() => labelForFilter(filter.value))

const countLabel = computed(() => {
  const total = pagination.value.total || 0
  return `(${total.toLocaleString('vi-VN')})`
})

let searchTimer = null

async function loadProducts() {
  loading.value = true
  try {
    const category = apiCategoryFromFilter(filter.value)
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
  const changed = filter.value !== id
  filter.value = id
  filtersOpen.value = false
  if (changed) {
    page.value = 1
    loadProducts()
  }
}

function openFilters() {
  filtersOpen.value = true
}

function closeFilters() {
  filtersOpen.value = false
}

watch(filtersOpen, (open) => {
  document.body.classList.toggle('is-locked', open)
})

watch(search, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchQuery.value = value.trim()
    page.value = 1
    loadProducts()
  }, 350)
})

onMounted(loadProducts)

onUnmounted(() => {
  clearTimeout(searchTimer)
  document.body.classList.remove('is-locked')
})

function resetFilters() {
  filter.value = 'all'
  search.value = ''
  searchQuery.value = ''
  page.value = 1
  filtersOpen.value = false
  loadProducts()
}

function openDetail(p) {
  router.push({ name: 'product-detail', params: { id: String(p.id) } })
}

function addToCart(productId) {
  addToCartFn(productId)
  addedId.value = productId
  setTimeout(() => {
    addedId.value = null
  }, 1200)
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
</script>

<template>
  <div class="plp">
    <header class="shell plp__head">
      <div>
        <h1 class="plp__title">
          {{ heading }}
          <span class="plp__count">{{ countLabel }}</span>
        </h1>
      </div>

      <div class="plp__tools">
        <div class="plp__search">
          <Icon name="search" :size="17" />
          <label class="sr-only" for="shop-search">Tìm sản phẩm</label>
          <input
            id="shop-search"
            v-model="search"
            type="search"
            placeholder="Tìm vợt, giày, thương hiệu..."
          />
        </div>
        <button
          type="button"
          class="plp__filter-toggle"
          aria-haspopup="dialog"
          :aria-expanded="filtersOpen"
          @click="openFilters"
        >
          <Icon name="menu" :size="16" />
          Bộ lọc
        </button>
      </div>
    </header>

    <div class="shell plp__body">
      <!-- Desktop sticky rail -->
      <aside class="plp__filters" aria-label="Bộ lọc danh mục">
        <div class="plp__filter-block">
          <h2>Danh mục</h2>
          <CategoryDropdown
            :model-value="filter"
            :tree="categoryTree"
            :api-ids="[...BE_CATEGORIES]"
            @update:model-value="setFilter"
          />
        </div>
      </aside>

      <!-- Mobile sheet: Teleport escapes transformed parents (route motion) -->
      <Teleport to="body">
        <div
          v-if="filtersOpen"
          class="plp__sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Bộ lọc danh mục"
        >
          <button
            type="button"
            class="plp__sheet-backdrop"
            aria-label="Đóng bộ lọc"
            @click="closeFilters"
          />
          <div class="plp__sheet-panel">
            <div class="plp__filters-head">
              <strong>Bộ lọc</strong>
              <button type="button" @click="closeFilters">Đóng</button>
            </div>
            <div class="plp__filter-block">
              <h2>Danh mục</h2>
              <CategoryDropdown
                :model-value="filter"
                :tree="categoryTree"
                :api-ids="[...BE_CATEGORIES]"
                @update:model-value="setFilter"
              />
            </div>
          </div>
        </div>
      </Teleport>

      <div id="shop-grid" class="plp__main scroll-mt-24">
        <div v-if="loading" class="plp__grid">
          <div v-for="n in 8" :key="n" class="skeleton plp__skel" />
        </div>

        <div v-else-if="!products.length" class="plp__empty">
          <p class="font-heading font-bold text-[18px]">Không tìm thấy sản phẩm nào</p>
          <p class="mt-2 text-[14px]" style="color: var(--text-3)">
            Thử từ khóa khác, hoặc bỏ bộ lọc danh mục đang chọn.
          </p>
          <button type="button" class="btn-text mt-5" @click="resetFilters">
            Xóa bộ lọc
            <Icon name="arrowRight" :size="16" />
          </button>
        </div>

        <div v-else class="plp__grid">
          <article
            v-for="p in products"
            :key="p.id"
            class="plp__card"
          >
            <button type="button" class="plp__media" @click="openDetail(p)">
              <img
                :src="productCoverUrl(p)"
                :alt="`${p.brand} ${p.name}`"
                loading="lazy"
              />
              <span v-if="discountPct(p) > 0" class="plp__badge">−{{ discountPct(p) }}%</span>
              <span v-else-if="p.featured" class="plp__badge plp__badge--soft">Bán chạy</span>
              <span v-if="p.stock === 0" class="plp__oos">Tạm hết hàng</span>
            </button>

            <button
              type="button"
              class="plp__heart"
              :class="{ 'is-on': isFavorite(p.id) }"
              :aria-pressed="isFavorite(p.id)"
              :aria-label="isFavorite(p.id) ? `Bỏ yêu thích` : `Yêu thích`"
              @click="toggleFavorite(p.id)"
            >
              <Icon name="heart" :size="18" />
            </button>

            <div class="plp__info">
              <button type="button" class="plp__name" @click="openDetail(p)">
                {{ p.name }}
              </button>
              <p class="plp__meta">
                {{ categoryLabels[p.category] || p.category }}
                <template v-if="p.brand"> · {{ p.brand }}</template>
              </p>
              <p class="plp__price">
                <span>{{ formatCurrency(p.price) }}</span>
                <span
                  v-if="p.original_price && p.original_price > p.price"
                  class="plp__was"
                >
                  {{ formatCurrency(p.original_price) }}
                </span>
              </p>
              <button
                type="button"
                class="plp__add"
                :disabled="p.stock === 0"
                @click="addToCart(p.id)"
              >
                {{
                  p.stock === 0
                    ? 'Hết hàng'
                    : addedId === p.id
                      ? 'Đã thêm'
                      : inCart(p.id)
                        ? `Trong giỏ · ${inCart(p.id).qty}`
                        : 'Thêm vào giỏ'
                }}
              </button>
            </div>
          </article>
        </div>

        <nav
          v-if="pagination.last_page > 1"
          class="plp__pager"
          aria-label="Phân trang sản phẩm"
        >
          <p class="mono text-[12.5px]" style="color: var(--text-3)">
            Trang {{ pagination.current_page }} / {{ pagination.last_page }}
          </p>
          <div class="flex flex-wrap items-center justify-center gap-1.5">
            <button
              type="button"
              class="icon-btn border-0 bg-transparent disabled:opacity-30"
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
              class="plp__page"
              :class="{ 'is-active': n === pagination.current_page }"
              :aria-current="n === pagination.current_page ? 'page' : undefined"
              :disabled="loading"
              @click="goToPage(n)"
            >
              {{ n }}
            </button>
            <button
              type="button"
              class="icon-btn border-0 bg-transparent disabled:opacity-30"
              aria-label="Trang sau"
              :disabled="!pagination.has_more_pages || loading"
              @click="goToPage(pagination.current_page + 1)"
            >
              <Icon name="arrowRight" :size="17" />
            </button>
          </div>
        </nav>
      </div>
    </div>
  </div>
</template>
