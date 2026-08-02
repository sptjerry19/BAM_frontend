<script setup>
import { ref, inject, onMounted, computed } from 'vue'
import { motion } from 'motion-v'
import { getProducts, getCourts } from '../../api'
import Stars from '../common/Stars.vue'
import { formatCurrency, catIcons } from '../../utils/labels'

const favorites = inject('favorites')
const removeFavorite = inject('removeFavorite')
const addToCartFn = inject('addToCart')

const products = ref([])
const courts = ref([])
const addedId = ref(null)

const favProducts = computed(() =>
  products.value.filter((p) => favorites.value.includes(p.id)),
)

const favCourts = computed(() =>
  courts.value.filter((c) => favorites.value.includes(c.id)),
)

onMounted(async () => {
  ;[products.value, courts.value] = await Promise.all([getProducts(), getCourts()])
})

function addToCart(productId) {
  addToCartFn(productId)
  addedId.value = productId
  setTimeout(() => { addedId.value = null }, 1200)
}
</script>

<template>
  <div v-if="favorites.length === 0" class="flex flex-col items-center justify-center min-h-72 text-center">
    <motion.div
      :initial="{ scale: 0.5, opacity: 0 }"
      :animate="{ scale: 1, opacity: 0.2 }"
      style="font-size: 72px; margin-bottom: 16px"
    >
      ♡
    </motion.div>
    <h2 class="font-heading" style="font-size: 20px; font-weight: 700">Chưa có mục yêu thích</h2>
    <p style="color: #64748b; font-size: 13px; margin-top: 6px">Hãy thêm sản phẩm hoặc sân vào danh sách</p>
  </div>

  <div v-else class="space-y-7">
    <motion.div :initial="{ opacity: 0, y: -10 }" :animate="{ opacity: 1, y: 0 }">
      <h1 class="font-heading" style="font-size: 30px; font-weight: 800; letter-spacing: -0.5px">Yêu thích</h1>
      <p style="color: #64748b; margin-top: 4px; font-size: 14px">{{ favorites.length }} mục đã lưu</p>
    </motion.div>

    <div v-if="favProducts.length > 0">
      <h2 class="font-heading" style="font-weight: 700; font-size: 17px; margin-bottom: 14px">Sản phẩm</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          v-for="(p, i) in favProducts"
          :key="p.id"
          class="rounded-2xl p-5 group"
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(239,68,68,0.12)"
          :initial="{ opacity: 0, scale: 0.9 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ delay: i * 0.07 }"
          :while-hover="{ y: -3, borderColor: 'rgba(239,68,68,0.25)' }"
        >
          <div class="flex items-start gap-3 mb-4">
            <div
              class="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
              style="background: rgba(255,255,255,0.05)"
            >
              {{ catIcons[p.category] || '◈' }}
            </div>
            <div class="flex-1 min-w-0">
              <div style="font-weight: 600; font-size: 13px; line-height: 1.35">{{ p.name }}</div>
              <div style="color: #64748b; font-size: 11px; margin-top: 2px">{{ p.brand }}</div>
            </div>
            <motion.button
              class="w-7 h-7 rounded-full flex items-center justify-center"
              style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.25)"
              :while-hover="{ scale: 1.15, background: 'rgba(239,68,68,0.25)' }"
              :while-tap="{ scale: 0.85 }"
              @click="removeFavorite(p.id)"
            >
              ♥
            </motion.button>
          </div>
          <div class="flex items-center justify-between">
            <span class="mono text-sm" style="color: #84cc16; font-weight: 600">{{ formatCurrency(p.price) }}</span>
            <motion.button
              class="btn-primary text-xs px-3 py-1.5 rounded-xl"
              :while-hover="{ scale: 1.04 }"
              :while-tap="{ scale: 0.96 }"
              @click="addToCart(p.id)"
            >
              {{ addedId === p.id ? '✓ Đã thêm' : 'Thêm giỏ' }}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>

    <div v-if="favCourts.length > 0">
      <h2 class="font-heading" style="font-weight: 700; font-size: 17px; margin-bottom: 14px">Sân cầu lông</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          v-for="(c, i) in favCourts"
          :key="c.id"
          class="rounded-2xl p-5"
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(239,68,68,0.12)"
          :initial="{ opacity: 0, scale: 0.9 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ delay: i * 0.07 }"
          :while-hover="{ y: -3 }"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1 min-w-0 pr-3">
              <div style="font-weight: 600; font-size: 14px">{{ c.name }}</div>
              <div style="color: #64748b; font-size: 11px; margin-top: 2px">{{ c.address }}</div>
            </div>
            <motion.button
              class="w-7 h-7 rounded-full flex items-center justify-center"
              style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.25)"
              :while-hover="{ scale: 1.15 }"
              :while-tap="{ scale: 0.85 }"
              @click="removeFavorite(c.id)"
            >
              ♥
            </motion.button>
          </div>
          <div class="flex items-center justify-between">
            <Stars :rating="c.rating" />
            <span class="mono text-xs font-semibold" style="color: #84cc16">{{ formatCurrency(c.price) }}/h</span>
          </div>
        </motion.div>
      </div>
    </div>
  </div>
</template>
