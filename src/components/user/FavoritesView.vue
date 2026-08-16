<script setup>
import { ref, inject, onMounted, computed } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import { getProducts, getCourts } from '../../api'
import Stars from '../common/Stars.vue'
import Icon from '../common/Icon.vue'
import { formatCurrency, productCoverUrl, productImageUrl, categoryLabels } from '../../utils/labels'

const favorites = inject('favorites')
const removeFavorite = inject('removeFavorite')
const addToCartFn = inject('addToCart')
const openProductDetail = inject('openProductDetail', null)
const goToShop = inject('goToShop', null)

const emit = defineEmits(['product-detail'])

const products = ref([])
const courts = ref([])
const addedId = ref(null)
const loading = ref(true)

const favProducts = computed(() =>
  products.value.filter((p) => favorites.value.includes(p.id)),
)

const favCourts = computed(() =>
  courts.value.filter((c) => favorites.value.includes(c.id)),
)

onMounted(async () => {
  try {
    const [productsRes, courtsRes] = await Promise.all([
      getProducts(undefined, { per_page: 100 }),
      getCourts(),
    ])
    products.value = productsRes.data
    courts.value = courtsRes
  } finally {
    loading.value = false
  }
})

function addToCart(productId) {
  addToCartFn(productId)
  addedId.value = productId
  setTimeout(() => { addedId.value = null }, 1200)
}

function onProductClick(p) {
  if (openProductDetail) openProductDetail(p)
  else emit('product-detail', p)
}
</script>

<template>
  <section v-if="favorites.length === 0" class="max-w-lg mx-auto text-center py-10">
    <span
      class="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center"
      style="background: rgba(255,255,255,0.04); color: var(--text-2); border: 1px solid var(--line)"
    >
      <Icon name="heart" :size="28" />
    </span>
    <h1 class="page-title mt-6">Chưa có gì được lưu</h1>
    <p class="lede mx-auto mt-3">
      Chạm biểu tượng trái tim trên sản phẩm hoặc sân để lưu lại và so sánh giá sau.
    </p>
    <button
      v-if="goToShop"
      type="button"
      class="btn-primary px-7 py-3.5 rounded-2xl text-[15px] mt-8"
      @click="goToShop()"
    >
      Khám phá cửa hàng
    </button>
  </section>

  <div v-else class="space-y-12">
    <header>
      <h1 class="page-title">Đã lưu</h1>
      <p class="lede mt-3">
        {{ favProducts.length }} sản phẩm và {{ favCourts.length }} cụm sân trong danh sách của bạn.
      </p>
    </header>

    <div v-if="loading" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="n in 3" :key="n" class="skeleton h-40" style="border-radius: var(--r-lg)" />
    </div>

    <section v-if="!loading && favProducts.length > 0" aria-labelledby="fav-products">
      <h2 id="fav-products" class="section-head">Sản phẩm</h2>

      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        <AnimatePresence>
          <motion.article
            v-for="(p, i) in favProducts"
            :key="p.id"
            class="surface lift overflow-hidden flex"
            :initial="{ opacity: 0, y: 16 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, scale: 0.95 }"
            :transition="{ delay: Math.min(i, 6) * 0.05 }"
          >
            <img
              :src="productCoverUrl(p)"
              :alt="`${p.brand} ${p.name}`"
              class="w-28 shrink-0 object-cover cursor-pointer product-img-bg"
              loading="lazy"
              @click="onProductClick(p)"
            />

            <div class="p-4 flex flex-col flex-1 min-w-0">
              <div class="flex items-start gap-2">
                <div class="min-w-0 flex-1">
                  <p class="text-[10.5px] uppercase tracking-[0.1em]" style="color: var(--text-3)">
                    {{ p.brand }} · {{ categoryLabels[p.category] }}
                  </p>
                  <h3
                    class="font-semibold text-[13.5px] leading-snug mt-1 cursor-pointer line-clamp-2"
                    @click="onProductClick(p)"
                  >
                    {{ p.name }}
                  </h3>
                </div>
                <button
                  type="button"
                  class="icon-btn w-8 h-8 shrink-0"
                  style="color: #f87171; background: rgba(248,113,113,0.12)"
                  :aria-label="`Bỏ lưu ${p.name}`"
                  @click="removeFavorite(p.id)"
                >
                  <Icon name="close" :size="14" />
                </button>
              </div>

              <div class="flex items-center justify-between gap-2 mt-auto pt-3">
                <span class="mono text-[14px] font-medium" style="color: var(--accent)">
                  {{ formatCurrency(p.price) }}
                </span>
                <button
                  type="button"
                  class="text-[12px] font-bold px-3 py-2 rounded-lg"
                  :class="addedId === p.id ? 'btn-owned' : 'btn-primary'"
                  @click.stop="addToCart(p.id)"
                >
                  {{ addedId === p.id ? 'Đã thêm' : 'Thêm giỏ' }}
                </button>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>

    <section v-if="!loading && favCourts.length > 0" aria-labelledby="fav-courts">
      <h2 id="fav-courts" class="section-head">Sân cầu lông</h2>

      <div class="grid gap-5 sm:grid-cols-2 mt-6">
        <motion.article
          v-for="(c, i) in favCourts"
          :key="c.id"
          class="surface lift overflow-hidden"
          :initial="{ opacity: 0, y: 16 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: Math.min(i, 6) * 0.05 }"
        >
          <div class="relative h-32 overflow-hidden">
            <img
              :src="productImageUrl(c.image)"
              :alt="`Sân cầu lông ${c.name}`"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div
              class="absolute inset-0"
              style="background: linear-gradient(200deg, color-mix(in srgb, var(--bg) 10%, transparent), color-mix(in srgb, var(--bg) 80%, transparent))"
            />
            <button
              type="button"
              class="icon-btn absolute top-2.5 right-2.5 w-8 h-8"
              style="color: #f87171; background: color-mix(in srgb, var(--bg) 60%, transparent)"
              :aria-label="`Bỏ lưu ${c.name}`"
              @click="removeFavorite(c.id)"
            >
              <Icon name="close" :size="14" />
            </button>
            <h3 class="absolute left-4 bottom-3 font-heading font-bold text-[15px]">{{ c.name }}</h3>
          </div>

          <div class="p-4 flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <Stars :rating="c.rating" />
              <span class="text-[12px] truncate" style="color: var(--text-3)">{{ c.district }}</span>
            </div>
            <span class="mono text-[13px] font-medium shrink-0" style="color: var(--accent)">
              {{ formatCurrency(c.price) }}<span class="text-[11px]">/h</span>
            </span>
          </div>
        </motion.article>
      </div>
    </section>
  </div>
</template>
