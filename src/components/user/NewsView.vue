<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { motion } from 'motion-v'
import Icon from '../common/Icon.vue'
import { getCategories, getNewsList } from '../../api'
import { formatNewsDate, formatReadTime, articleTag } from '../../data/news'

const PER_PAGE = 9

const filter = ref('all')
const page = ref(1)
const categories = ref([])
const items = ref([])
const loading = ref(true)
const loadError = ref('')
const pagination = ref({
  current_page: 1,
  per_page: PER_PAGE,
  total: 0,
  last_page: 1,
  from: 0,
  to: 0,
  has_more_pages: false,
})

const filters = computed(() => [
  { id: 'all', label: 'Tất cả' },
  ...categories.value.map((c) => ({ id: String(c.id), label: c.name })),
])

const featured = computed(() => {
  if (page.value !== 1 || items.value.length === 0) return null
  return items.value.find((n) => Number(n.featured)) || items.value[0]
})

const list = computed(() =>
  featured.value ? items.value.filter((n) => n.id !== featured.value.id) : items.value,
)

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

const countLabel = computed(() => {
  const total = pagination.value.total || 0
  if (!total) return ''
  const from = pagination.value.from || 0
  const to = pagination.value.to || 0
  return `${from}–${to} / ${total.toLocaleString('vi-VN')} bài`
})

async function loadCategories() {
  try {
    categories.value = await getCategories()
  } catch {
    categories.value = []
  }
}

async function loadNews() {
  loading.value = true
  loadError.value = ''
  try {
    const params = { page: page.value, per_page: PER_PAGE }
    if (filter.value !== 'all') params.category_id = filter.value
    const res = await getNewsList(params)
    items.value = res.data
    if (res.pagination) {
      pagination.value = res.pagination
      page.value = res.pagination.current_page
    }
  } catch {
    items.value = []
    pagination.value = {
      current_page: 1,
      per_page: PER_PAGE,
      total: 0,
      last_page: 1,
      from: 0,
      to: 0,
      has_more_pages: false,
    }
    loadError.value = 'Không tải được tin tức.'
  } finally {
    loading.value = false
  }
}

function goToPage(p) {
  const last = pagination.value.last_page || 1
  const next = Math.min(Math.max(1, p), last)
  if (next === page.value) return
  page.value = next
  loadNews()
  document.getElementById('news-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function setFilter(id) {
  if (filter.value === id) return
  page.value = 1
  filter.value = id
}

watch(filter, loadNews)
onMounted(() => {
  loadCategories()
  loadNews()
})
</script>

<template>
  <div>
    <header class="max-w-3xl">
      <p class="eyebrow">Cộng đồng</p>
      <h1 class="page-title mt-2">Tin tức</h1>
      <p class="lede mt-3">Giải đấu, lịch CLB và cập nhật trang bị — mọi thứ bạn cần trước khi xuống sân.</p>
    </header>

    <div class="flex flex-wrap gap-2 mt-8" role="tablist" aria-label="Lọc tin">
      <button
        v-for="f in filters"
        :key="f.id"
        type="button"
        role="tab"
        class="px-4 py-2 rounded-full text-[13px] font-semibold transition-colors"
        :aria-selected="filter === f.id"
        :style="{
          background: filter === f.id ? 'var(--text)' : 'transparent',
          color: filter === f.id ? 'var(--bg)' : 'var(--text-2)',
          border: `1px solid ${filter === f.id ? 'var(--text)' : 'var(--line)'}`,
        }"
        @click="setFilter(f.id)"
      >
        {{ f.label }}
      </button>
    </div>

    <div v-if="loading" class="mt-10 space-y-8">
      <div class="skeleton min-h-[320px] sm:min-h-[420px]" style="border-radius: var(--r-lg)" />
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="n in 3" :key="n" class="space-y-3">
          <div class="skeleton aspect-[16/10]" style="border-radius: var(--r-md)" />
          <div class="skeleton h-3 w-1/3" />
          <div class="skeleton h-5 w-4/5" />
        </div>
      </div>
    </div>

    <p v-else-if="loadError" class="mt-16 text-center" style="color: var(--text-3)">
      {{ loadError }}
    </p>

    <template v-else>
      <motion.article
        v-if="featured"
        class="mt-10 relative overflow-hidden min-h-[320px] sm:min-h-[420px] flex items-end"
        style="border-radius: var(--r-lg)"
        :initial="{ opacity: 0, y: 18 }"
        :animate="{ opacity: 1, y: 0 }"
      >
        <RouterLink
          :to="{ name: 'news-detail', params: { id: featured.id } }"
          class="absolute inset-0 z-[1]"
          :aria-label="`Đọc bài: ${featured.title}`"
        />
        <img
          :src="featured.image"
          :alt="featured.title"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div
          class="absolute inset-0"
          style="background: linear-gradient(180deg, transparent 20%, rgba(0,0,0,0.78) 100%)"
        />
        <div class="relative z-10 p-6 sm:p-10 max-w-2xl text-white pointer-events-none">
          <p class="text-[11px] uppercase tracking-[0.14em] opacity-80">
            {{ articleTag(featured) }}
            <template v-if="featured.date"> · {{ formatNewsDate(featured.date) }}</template>
          </p>
          <h2 class="font-heading font-bold text-[28px] sm:text-[40px] leading-[1.05] mt-3">
            {{ featured.title }}
          </h2>
          <p class="mt-3 text-[15px] leading-relaxed opacity-90 max-w-xl">{{ featured.excerpt }}</p>
          <span class="btn-primary mt-6 px-6 py-3 rounded-full text-[14px] inline-flex pointer-events-none">
            Đọc bài
          </span>
        </div>
      </motion.article>

      <div id="news-grid" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8 scroll-mt-24">
        <RouterLink
          v-for="(item, i) in list"
          :key="item.id"
          :to="{ name: 'news-detail', params: { id: item.id } }"
          class="group block"
        >
          <motion.article
            :initial="{ opacity: 0, y: 16 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ delay: Math.min(i, 6) * 0.05 }"
          >
            <div class="overflow-hidden aspect-[16/10]" style="border-radius: var(--r-md)">
              <img
                :src="item.image"
                :alt="item.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                loading="lazy"
              />
            </div>
            <p class="mt-4 text-[11px] uppercase tracking-[0.12em]" style="color: var(--text-3)">
              {{ articleTag(item) }}
              <template v-if="item.date"> · {{ formatNewsDate(item.date) }}</template>
              <template v-if="formatReadTime(item.read)"> · {{ formatReadTime(item.read) }}</template>
            </p>
            <h3 class="font-heading font-bold text-[18px] leading-snug mt-2 group-hover:underline underline-offset-4">
              {{ item.title }}
            </h3>
            <p class="mt-2 text-[14px] leading-relaxed line-clamp-2" style="color: var(--text-2)">
              {{ item.excerpt }}
            </p>
          </motion.article>
        </RouterLink>
      </div>

      <p v-if="items.length === 0" class="mt-16 text-center" style="color: var(--text-3)">
        Chưa có bài trong mục này.
      </p>

      <nav
        v-if="pagination.last_page > 1"
        class="plp__pager"
        aria-label="Phân trang tin tức"
      >
        <p class="mono text-[12.5px]" style="color: var(--text-3)">
          {{ countLabel }}
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
    </template>
  </div>
</template>
