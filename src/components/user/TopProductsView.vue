<script setup>
import { inject, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { motion } from 'motion-v'
import { getBestsellers } from '../../api'
import Icon from '../common/Icon.vue'
import { categoryLabels, formatCurrency, productCoverUrl } from '../../utils/labels'

const router = useRouter()
const openProductDetail = inject('openProductDetail', null)
const addToCart = inject('addToCart', null)

const products = ref([])
const loading = ref(true)
const loadError = ref('')

onMounted(async () => {
  loading.value = true
  loadError.value = ''
  try {
    products.value = await getBestsellers(10)
  } catch {
    loadError.value = 'Không tải được danh sách. Thử lại sau.'
    products.value = []
  } finally {
    loading.value = false
  }
})

function onOpen(p) {
  if (openProductDetail) openProductDetail(p)
  else router.push({ name: 'product-detail', params: { id: String(p.id) } })
}

function onAdd(p) {
  if (addToCart) addToCart(p.id)
}
</script>

<template>
  <div>
    <header class="max-w-3xl">
      <p class="eyebrow">Bán chạy</p>
      <h1 class="page-title mt-2">Top 10 sản phẩm</h1>
      <p class="lede mt-3">
        Những món được đặt nhiều nhất tại JBadminton.
      </p>
    </header>

    <div v-if="loading" class="mt-10 space-y-3">
      <div v-for="i in 6" :key="i" class="surface h-24 shimmer" />
    </div>

    <p v-else-if="loadError" class="lede mt-10">{{ loadError }}</p>

    <p v-else-if="!products.length" class="lede mt-10">Chưa có sản phẩm bán chạy.</p>

    <ol v-else class="mt-10 space-y-3">
      <motion.li
        v-for="(p, i) in products"
        :key="p.id"
        class="surface p-3 sm:p-4 flex items-center gap-3 sm:gap-5"
        :initial="{ opacity: 0, y: 14 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: Math.min(i, 9) * 0.04 }"
      >
        <span
          class="mono w-8 sm:w-10 shrink-0 text-center font-bold text-[18px] sm:text-[22px]"
          :style="{ color: i < 3 ? 'var(--accent)' : 'var(--text-3)' }"
        >
          {{ String(i + 1).padStart(2, '0') }}
        </span>

        <button
          type="button"
          class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 product-img-bg"
          :aria-label="`Xem ${p.name}`"
          @click="onOpen(p)"
        >
          <img
            :src="productCoverUrl(p)"
            :alt="p.name"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </button>

        <div class="min-w-0 flex-1">
          <p class="text-[10.5px] uppercase tracking-[0.1em]" style="color: var(--text-3)">
            {{ p.brand }} · {{ categoryLabels[p.category] || p.category }}
          </p>
          <button
            type="button"
            class="font-semibold text-[14px] sm:text-[15px] leading-snug mt-0.5 text-left line-clamp-2 hover:underline underline-offset-2"
            @click="onOpen(p)"
          >
            {{ p.name }}
          </button>
          <p class="mono text-[12.5px] mt-1.5" style="color: var(--text-3)">
            {{ Number(p.sold_count || 0).toLocaleString('vi-VN') }} đã bán · ★ {{ p.rating }}
          </p>
        </div>

        <div class="shrink-0 text-right flex flex-col items-end gap-2">
          <p class="mono text-[14px] sm:text-[16px] font-medium" style="color: var(--accent)">
            {{ formatCurrency(p.price) }}
          </p>
          <button
            type="button"
            class="icon-btn w-9 h-9"
            :aria-label="`Thêm ${p.name} vào giỏ`"
            @click="onAdd(p)"
          >
            <Icon name="bag" :size="16" />
          </button>
        </div>
      </motion.li>
    </ol>

    <div class="mt-10 text-center">
      <button
        type="button"
        class="btn-primary px-7 py-3.5 rounded-2xl text-[15px]"
        @click="router.push({ name: 'shop' })"
      >
        Xem toàn bộ cửa hàng
      </button>
    </div>
  </div>
</template>
