<script setup>
import { ref, onMounted } from 'vue'
import { motion } from 'motion-v'
import { getStats } from '../../api'
import AnimatedNumber from '../common/AnimatedNumber.vue'
import StatusPill from '../common/StatusPill.vue'
import Stars from '../common/Stars.vue'
import Icon from '../common/Icon.vue'
import { formatCurrency, productCoverUrl, levelColors } from '../../utils/labels'

const stats = ref(null)
const loading = ref(true)

const statCards = [
  { key: 'totalRevenue', label: 'Tổng doanh thu', icon: 'bolt', format: 'currency' },
  { key: 'activeMembers', label: 'Thành viên hoạt động', icon: 'user', format: 'number' },
  { key: 'openCourts', label: 'Sân đang mở', icon: 'court', format: 'number' },
  { key: 'totalMatches', label: 'Tổng trận đấu', icon: 'shuttlecock', format: 'number' },
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
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__head">
      <p class="eyebrow">Quản trị</p>
      <h1 class="page-title mt-2">Tổng quan</h1>
      <p class="lede mt-3">Theo dõi doanh thu, sân và thành viên đang hoạt động.</p>
    </header>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <div v-for="i in 4" :key="i" class="surface h-32 shimmer" />
    </div>

    <div v-else-if="stats" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <motion.div
        v-for="(card, i) in statCards"
        :key="card.key"
        class="surface admin-stat p-5 sm:p-6"
        :initial="{ opacity: 0, y: 14 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: i * 0.06, duration: 0.35 }"
      >
        <div class="flex items-start justify-between mb-5">
          <div class="admin-stat__icon">
            <Icon :name="card.icon" :size="18" />
          </div>
          <span class="mono text-[11px]" style="color: var(--text-3)">Live</span>
        </div>
        <div class="font-heading text-[26px] font-bold tracking-tight mono leading-none">
          <AnimatedNumber
            v-if="card.format === 'currency'"
            :value="stats[card.key]"
            suffix=" ₫"
          />
          <AnimatedNumber v-else :value="stats[card.key]" />
        </div>
        <div class="text-[13px] mt-2" style="color: var(--text-2)">{{ card.label }}</div>
      </motion.div>
    </div>

    <div v-if="stats" class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <motion.section
        class="surface p-5 sm:p-6"
        :initial="{ opacity: 0, y: 14 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.28 }"
      >
        <h2 class="font-heading font-bold text-[18px]">Thành viên hoạt động</h2>
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div
            v-for="member in stats.activeMembersList"
            :key="member.id"
            class="admin-row flex items-center gap-3 rounded-xl px-3 py-2.5"
          >
            <img
              :src="member.avatar"
              :alt="member.name"
              class="w-10 h-10 rounded-full object-cover shrink-0"
              style="border: 2px solid var(--line)"
            />
            <div class="flex-1 min-w-0">
              <div class="text-[13px] font-semibold truncate">{{ member.name }}</div>
              <div
                class="text-[11px] mono mt-0.5"
                :style="{ color: levelColors[member.level] || 'var(--text-3)' }"
              >
                {{ Number(member.points || 0).toLocaleString('vi-VN') }} điểm
              </div>
            </div>
            <StatusPill :status="member.status" />
          </div>
        </div>
      </motion.section>

      <motion.section
        class="surface p-5 sm:p-6"
        :initial="{ opacity: 0, y: 14 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.34 }"
      >
        <h2 class="font-heading font-bold text-[18px]">Trạng thái sân</h2>
        <div class="mt-5 space-y-4">
          <div v-for="court in stats.courtStatuses" :key="court.id">
            <div class="flex items-center justify-between gap-3 mb-2">
              <span class="text-[14px] font-medium truncate">{{ court.name }}</span>
              <StatusPill :status="court.status" />
            </div>
            <div class="h-1.5 rounded-full overflow-hidden" style="background: var(--bg-2)">
              <motion.div
                class="h-full rounded-full"
                style="background: var(--text)"
                :initial="{ width: 0 }"
                :animate="{ width: statusBarWidth(court.status) }"
                :transition="{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }"
              />
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        class="surface p-5 sm:p-6 lg:col-span-2"
        :initial="{ opacity: 0, y: 14 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.4 }"
      >
        <h2 class="font-heading font-bold text-[18px]">Sản phẩm nổi bật</h2>
        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <article
            v-for="product in stats.featuredProducts"
            :key="product.id"
            class="admin-product overflow-hidden rounded-2xl"
            style="border: 1px solid var(--line); background: var(--bg-2)"
          >
            <img
              :src="productCoverUrl(product)"
              :alt="product.name"
              class="w-full h-64 object-cover"
            />
            <div class="p-3.5">
              <div class="text-[14px] font-semibold truncate">{{ product.name }}</div>
              <div class="mono text-[14px] font-medium mt-1">{{ formatCurrency(product.price) }}</div>
              <Stars :rating="product.rating" class="mt-2" />
            </div>
          </article>
        </div>
      </motion.section>
    </div>
  </div>
</template>
