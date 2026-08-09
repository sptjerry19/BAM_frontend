<script setup>
import { ref, onMounted } from 'vue'
import { motion } from 'motion-v'
import { getStats } from '../../api'
import AnimatedNumber from '../common/AnimatedNumber.vue'
import StatusPill from '../common/StatusPill.vue'
import Stars from '../common/Stars.vue'
import { formatCurrency, productCoverUrl, levelColors } from '../../utils/labels'

const stats = ref(null)
const loading = ref(true)

const statCards = [
  { key: 'totalRevenue', label: 'Tổng doanh thu', icon: '💰', color: '#84cc16', format: 'currency' },
  { key: 'activeMembers', label: 'Thành viên HĐ', icon: '👥', color: '#6366f1', format: 'number' },
  { key: 'openCourts', label: 'Sân đang mở', icon: '🏟️', color: '#f59e0b', format: 'number' },
  { key: 'totalMatches', label: 'Tổng trận đấu', icon: '🏸', color: '#ec4899', format: 'number' },
]

onMounted(async () => {
  try {
    stats.value = await getStats()
  } finally {
    loading.value = false
  }
})

function statusBarWidth(status) {
  if (status === 'open') return '75%'
  if (status === 'busy') return '95%'
  return '0%'
}

function statusBarColor(status) {
  if (status === 'open') return '#84cc16'
  if (status === 'busy') return '#facc15'
  return '#ef4444'
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="page-title">Tổng quan</h1>
      <p class="mt-1 text-sm" style="color: #64748b">
        Chào mừng trở lại, <span style="color: #84cc16; font-weight: 600">Admin</span> 👋
      </p>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <div v-for="i in 4" :key="i" class="glass rounded-2xl p-6 h-32 shimmer" />
    </div>

    <div v-else-if="stats" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <motion.div
        v-for="(card, i) in statCards"
        :key="card.key"
        class="glass rounded-2xl p-6 relative overflow-hidden group cursor-default"
        :initial="{ opacity: 0, y: 16 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }"
        :whileHover="{ y: -3 }"
      >
        <div
          class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          :style="{ background: `radial-gradient(circle at 30% 30%, ${card.color}18, transparent 65%)` }"
        />
        <div class="flex items-start justify-between mb-4 relative">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            :style="{ background: `${card.color}18`, border: `1px solid ${card.color}30` }"
          >
            {{ card.icon }}
          </div>
          <span class="mono text-xs" style="color: #84cc16">↑ 12%</span>
        </div>
        <div
          class="text-2xl font-bold mb-1 relative"
          :style="{ color: card.color, fontFamily: `'Be Vietnam Pro', sans-serif` }"
        >
          <AnimatedNumber
            v-if="card.format === 'currency'"
            :value="stats[card.key]"
            suffix=" ₫"
          />
          <AnimatedNumber v-else :value="stats[card.key]" />
        </div>
        <div class="text-xs relative" style="color: #64748b">{{ card.label }}</div>
      </motion.div>
    </div>

    <div v-if="stats" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <motion.div
        class="glass rounded-2xl p-6"
        :initial="{ opacity: 0, y: 16 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.35, duration: 0.4 }"
      >
        <h2 style="font-family: 'Be Vietnam Pro', sans-serif; font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 16px">
          Thành viên hoạt động
        </h2>
        <div class="space-y-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div
            v-for="member in stats.activeMembersList"
            :key="member.id"
            class="flex items-center gap-3 table-row rounded-xl px-3 py-2.5"
          >
            <div class="relative shrink-0">
              <img :src="member.avatar" :alt="member.name" class="w-10 h-10 rounded-full object-cover" />
              <span
                class="absolute bottom-0 w-2.5 h-2.5 rounded-full border-2"
                style="background: var(--accent); border-color: var(--bg)"
              />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate" style="color: var(--text)">{{ member.name }}</div>
              <div
                class="text-xs mono"
                :style="{ color: levelColors[member.level] || '#64748b' }"
              >
                {{ member.points }} điểm
              </div>
            </div>
            <StatusPill :status="member.status" />
          </div>
        </div>
      </motion.div>

      <motion.div
        class="glass rounded-2xl p-6 grid grid-cols-2 lg:grid-cols-4"
        :initial="{ opacity: 0, y: 16 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.42, duration: 0.4 }"
      >
        <h2 style="font-family: 'Be Vietnam Pro', sans-serif; font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 16px">
          Trạng thái sân
        </h2>
        <div class="space-y-4">
          <div v-for="court in stats.courtStatuses" :key="court.id">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm truncate mr-2" style="color: var(--text)">{{ court.name }}</span>
              <StatusPill :status="court.status" />
            </div>
            <div class="h-1.5 rounded-full overflow-hidden" style="background: rgba(255,255,255,0.06)">
              <motion.div
                class="h-full rounded-full"
                :style="{ background: statusBarColor(court.status) }"
                :initial="{ width: 0 }"
                :animate="{ width: statusBarWidth(court.status) }"
                :transition="{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        class="glass rounded-2xl p-6 lg:col-span-2"
        :initial="{ opacity: 0, y: 16 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.5, duration: 0.4 }"
      >
        <h2 style="font-family: 'Be Vietnam Pro', sans-serif; font-size: 16px; font-weight: 800; color: var(--text); margin-bottom: 16px">
          Sản phẩm nổi bật
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            v-for="(product, i) in stats.featuredProducts"
            :key="product.id"
            class="glass rounded-xl overflow-hidden"
            :initial="{ opacity: 0, y: 12 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ delay: 0.55 + i * 0.06 }"
            :whileHover="{ y: -3 }"
          >
            <img
              :src="productCoverUrl(product)"
              :alt="product.name"
              class="w-full h-32 object-cover"
            />
            <div class="p-3">
              <div class="text-sm font-medium truncate" style="color: var(--text)">{{ product.name }}</div>
              <div class="text-sm font-bold mt-1 mono" style="color: #84cc16">{{ formatCurrency(product.price) }}</div>
              <Stars :rating="product.rating" class="mt-1.5" />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  </div>
</template>
