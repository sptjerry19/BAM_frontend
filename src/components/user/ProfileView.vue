<script setup>
import { inject, computed } from 'vue'
import { motion } from 'motion-v'
import { levelLabels, levelColors, formatCurrency } from '../../utils/labels'

const user = inject('user')

const winRate = computed(() =>
  user.value?.matches ? Math.round((user.value.wins / user.value.matches) * 100) : 0,
)

const months = [
  { m: 'Tháng 5', v: 680000 },
  { m: 'Tháng 6', v: 920000 },
  { m: 'Tháng 7', v: 750000 },
  { m: 'Tháng 8', v: 430000 },
]
const maxCost = Math.max(...months.map((x) => x.v))

const stats = computed(() => {
  if (!user.value) return []
  return [
    { label: 'Điểm tích lũy', value: user.value.points, unit: 'pts', color: 'var(--accent)', delay: 0.2, isCost: false },
    { label: 'Số trận đánh', value: user.value.matches, unit: 'trận', color: 'var(--text)', delay: 0.25, isCost: false },
    { label: 'Trận thắng', value: user.value.wins, unit: 'trận', color: 'var(--text)', delay: 0.3, isCost: false },
    { label: 'Tổng chi tiêu', value: user.value.total_cost, unit: '', color: 'var(--text)', delay: 0.35, isCost: true },
  ]
})

const bars = computed(() => [
  { label: `Thắng (${user.value?.wins ?? 0})`, pct: winRate.value, color: '#a3e635' },
  { label: `Thua (${(user.value?.matches ?? 0) - (user.value?.wins ?? 0)})`, pct: 100 - winRate.value, color: '#5f6d84' },
])

function formatJoinDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN')
}
</script>

<template>
  <div v-if="user" class="space-y-6 max-w-3xl">
    <header>
      <h1 class="page-title">Hồ sơ của bạn</h1>
      <p class="lede mt-3">Theo dõi điểm tích lũy, phong độ và chi phí sân theo từng tháng.</p>
    </header>

    <motion.div
      class="surface overflow-hidden relative"
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ delay: 0.1 }"
    >
      <div
        class="h-28 relative overflow-hidden court-lines"
        style="background: linear-gradient(135deg, rgba(163,230,53,0.18), rgba(163,230,53,0.04), transparent)"
      >
        <div
          class="absolute inset-0"
          style="background-image: radial-gradient(circle, rgba(132,204,22,0.07) 1px, transparent 1px); background-size: 20px 20px"
        />
        <div class="absolute top-4 right-5">
          <span
            class="pill text-sm"
            :style="{
              background: `${levelColors[user.level]}20`,
              color: levelColors[user.level],
              border: `1px solid ${levelColors[user.level]}30`,
              fontSize: '12px',
              padding: '4px 12px',
            }"
          >
            {{ levelLabels[user.level] }}
          </span>
        </div>
      </div>
      <div class="px-6 pb-6">
        <div class="flex items-end gap-4 -mt-10 mb-5">
          <motion.img
            :src="user.avatar"
            :alt="user.name"
            class="w-20 h-20 rounded-2xl object-cover z-10"
            :style="{ border: `3px solid ${levelColors[user.level]}40` }"
            :while-hover="{ scale: 1.05 }"
          />
          <div class="mb-1">
            <h2 class="font-heading" style="font-size: 22px; font-weight: 800">{{ user.name }}</h2>
            <div style="color: #64748b; font-size: 13px; margin-top: 2px">{{ user.email }}</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div
            v-for="[k, v] in [['Điện thoại', user.phone], ['Tham gia', formatJoinDate(user.join_date)]]"
            :key="k"
            class="rounded-xl p-3"
            style="background: rgba(255,255,255,0.04)"
          >
            <div style="color: #475569; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px">
              {{ k }}
            </div>
            <div style="font-weight: 600; font-size: 13px">{{ v }}</div>
          </div>
        </div>
      </div>
    </motion.div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <motion.div
        v-for="s in stats"
        :key="s.label"
        class="rounded-2xl p-4 text-center"
        style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07)"
        :initial="{ opacity: 0, y: 15 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: s.delay }"
        :while-hover="{ y: -2, borderColor: `${s.color}30` }"
      >
        <div class="mono text-2xl font-medium" :style="{ color: s.color }">
          {{ s.isCost ? formatCurrency(s.value).replace('₫', '') : s.value.toLocaleString() }}
        </div>
        <div style="color: #64748b; font-size: 11px; margin-top: 3px">{{ s.label }}</div>
      </motion.div>
    </div>

    <motion.div
      class="rounded-3xl p-6"
      style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07)"
      :initial="{ opacity: 0, y: 15 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ delay: 0.4 }"
    >
      <h3 class="font-heading" style="font-weight: 700; margin-bottom: 18px; font-size: 16px">
        Tỷ lệ thắng/thua
      </h3>
      <div class="space-y-3">
        <div v-for="b in bars" :key="b.label">
          <div class="flex justify-between mb-1.5">
            <span style="font-size: 12px; color: #94a3b8">{{ b.label }}</span>
            <span class="mono text-sm" :style="{ color: b.color, fontWeight: 600 }">{{ b.pct }}%</span>
          </div>
          <div class="h-2.5 rounded-full overflow-hidden" style="background: rgba(255,255,255,0.06)">
            <motion.div
              class="h-full rounded-full"
              :style="{ background: `linear-gradient(90deg, ${b.color}, ${b.color}aa)` }"
              :initial="{ width: 0 }"
              :animate="{ width: `${b.pct}%` }"
              :transition="{ delay: 0.5, duration: 1, ease: 'easeOut' }"
            />
          </div>
        </div>
      </div>
    </motion.div>

    <motion.div
      class="rounded-3xl p-6"
      style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07)"
      :initial="{ opacity: 0, y: 15 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ delay: 0.5 }"
    >
      <h3 class="font-heading" style="font-weight: 700; margin-bottom: 18px; font-size: 16px">
        Chi phí hàng tháng
      </h3>
      <div class="flex items-end gap-3 h-28">
        <div v-for="(row, i) in months" :key="row.m" class="flex-1 flex flex-col items-center gap-2 h-full">
          <motion.div
            class="w-full rounded-t-lg relative overflow-hidden mt-auto"
            style="background: rgba(132,204,22,0.15); border: 1px solid rgba(132,204,22,0.2)"
            :initial="{ height: 0 }"
            :animate="{ height: `${(row.v / maxCost) * 100}%` }"
            :transition="{ delay: 0.55 + i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }"
            :while-hover="{ background: 'rgba(132,204,22,0.3)' }"
          >
            <div class="absolute inset-0 shimmer" />
          </motion.div>
          <div style="color: #475569; font-size: 10px; text-align: center">{{ row.m.replace('Tháng ', 'T') }}</div>
        </div>
      </div>
      <div class="flex justify-between mt-3">
        <div
          v-for="row in months"
          :key="`${row.m}-val`"
          class="flex-1 text-center mono"
          style="font-size: 10px; color: #475569"
        >
          {{ (row.v / 1000).toFixed(0) }}K
        </div>
      </div>
    </motion.div>
  </div>
  <div v-else class="space-y-6 max-w-3xl">
    <div class="skeleton h-11 w-64" />
    <div class="skeleton h-56" style="border-radius: var(--r-lg)" />
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div v-for="n in 4" :key="n" class="skeleton h-24" style="border-radius: var(--r-md)" />
    </div>
  </div>
</template>
