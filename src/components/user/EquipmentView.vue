<script setup>
import { ref, inject, onMounted, computed } from 'vue'
import { motion } from 'motion-v'
import { getProducts } from '../../api'
import Stars from '../common/Stars.vue'
import { categoryLabels, formatCurrency, catIcons } from '../../utils/labels'

const user = inject('user')
const products = ref([])

const myEquipment = computed(() => {
  const ids = user.value?.equipment || []
  return products.value.filter((p) => ids.includes(p.id))
})

const catGroups = computed(() => {
  const groups = {}
  myEquipment.value.forEach((p) => {
    if (!groups[p.category]) groups[p.category] = []
    groups[p.category].push(p)
  })
  return groups
})

onMounted(async () => {
  products.value = await getProducts()
})
</script>

<template>
  <div class="space-y-7">
    <motion.div :initial="{ opacity: 0, y: -10 }" :animate="{ opacity: 1, y: 0 }">
      <h1 class="font-heading" style="font-size: 30px; font-weight: 800; letter-spacing: -0.5px">
        Trang bị của tôi
      </h1>
      <p style="color: #64748b; margin-top: 4px; font-size: 14px">Quản lý dụng cụ cầu lông cá nhân</p>
    </motion.div>

    <motion.div
      v-for="(items, cat, gi) in catGroups"
      :key="cat"
      :initial="{ opacity: 0, y: 15 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ delay: gi * 0.1 }"
    >
      <div class="flex items-center gap-2 mb-4">
        <div class="w-1 h-5 rounded-full" style="background: #84cc16" />
        <h2 class="font-heading" style="font-weight: 700; font-size: 16px">{{ categoryLabels[cat] }}</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.div
          v-for="(p, i) in items"
          :key="p.id"
          class="rounded-2xl p-5 relative overflow-hidden group"
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(132,204,22,0.12)"
          :initial="{ opacity: 0, scale: 0.92 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ delay: gi * 0.1 + i * 0.07 }"
          :while-hover="{ y: -3, borderColor: 'rgba(132,204,22,0.3)' }"
        >
          <div
            class="absolute top-0 left-0 right-0 h-px"
            style="background: linear-gradient(90deg, transparent, rgba(132,204,22,0.3), transparent)"
          />
          <div class="flex items-center gap-4 mb-4">
            <motion.div
              class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style="background: rgba(132,204,22,0.1); border: 1px solid rgba(132,204,22,0.2)"
              :while-hover="{ rotate: [-5, 5, 0] }"
              :transition="{ duration: 0.4 }"
            >
              {{ catIcons[cat] || '◈' }}
            </motion.div>
            <div>
              <div style="font-weight: 700; font-size: 14px">{{ p.name }}</div>
              <div style="color: #64748b; font-size: 12px; margin-top: 2px">{{ p.brand }}</div>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <Stars :rating="p.rating" />
            <span class="mono text-sm" style="color: #84cc16; font-weight: 600">{{ formatCurrency(p.price) }}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>

    <motion.div
      class="rounded-2xl p-6 text-center cursor-pointer"
      style="border: 1px dashed rgba(255,255,255,0.1); background: rgba(255,255,255,0.02)"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :transition="{ delay: 0.4 }"
      :while-hover="{ borderColor: 'rgba(132,204,22,0.3)', background: 'rgba(132,204,22,0.04)' }"
    >
      <motion.div
        style="font-size: 28px; margin-bottom: 8px; color: #84cc16"
        :animate="{ y: [-3, 3, -3] }"
        :transition="{ duration: 2, repeat: Infinity }"
      >
        +
      </motion.div>
      <div style="font-size: 13px; color: #64748b">
        Thêm trang bị mới từ <span style="color: #84cc16; font-weight: 600">Cửa hàng</span>
      </div>
    </motion.div>
  </div>
</template>
