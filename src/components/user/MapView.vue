<script setup>
import { ref, computed, onMounted } from 'vue'
import { motion } from 'motion-v'
import { getCourts } from '../../api'
import Stars from '../common/Stars.vue'
import { formatCurrency } from '../../utils/labels'

const emit = defineEmits(['book'])

const courts = ref([])
const selected = ref(null)
const filter = ref('all')

const statusColors = { open: '#84cc16', busy: '#facc15', closed: '#ef4444' }
const statusLabels = { all: 'Tất cả', open: 'Đang mở', busy: 'Đông khách', closed: 'Đóng cửa' }
const filterKeys = ['all', 'open', 'busy', 'closed']

const shown = computed(() =>
  filter.value === 'all' ? courts.value : courts.value.filter((c) => c.status === filter.value),
)

const listCourts = computed(() => {
  if (!selected.value) return courts.value
  return [selected.value, ...courts.value.filter((c) => c.id !== selected.value.id)]
})

onMounted(async () => {
  courts.value = await getCourts()
})

function filterStyle(s) {
  if (filter.value !== s) {
    return {
      background: 'rgba(255,255,255,0.05)',
      color: '#94a3b8',
      border: '1px solid rgba(255,255,255,0.08)',
    }
  }
  return {
    background: s === 'all' ? '#84cc16' : statusColors[s],
    color: '#0a1200',
    border: '1px solid transparent',
    fontWeight: 700,
  }
}

function selectCourt(c) {
  selected.value = selected.value?.id === c.id ? null : c
}

function onBook(court, e) {
  e?.stopPropagation()
  emit('book', court)
}
</script>

<template>
  <div class="space-y-5">
    <motion.div :initial="{ opacity: 0, y: -10 }" :animate="{ opacity: 1, y: 0 }">
      <h1 class="page-title">
        Bản đồ sân cầu lông
      </h1>
      <p style="color: #64748b; margin-top: 4px; font-size: 14px">
        Tìm và đặt sân gần bạn tại Hà Nội
      </p>
    </motion.div>

    <motion.div
      class="flex gap-2 flex-wrap"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :transition="{ delay: 0.1 }"
    >
      <motion.button
        v-for="s in filterKeys"
        :key="s"
        class="pill transition-all"
        :style="filterStyle(s)"
        :while-hover="{ scale: 1.04 }"
        :while-tap="{ scale: 0.96 }"
        @click="filter = s"
      >
        {{ statusLabels[s] }}
      </motion.button>
    </motion.div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
      <motion.div
        class="lg:col-span-3 relative rounded-3xl overflow-hidden map-canvas"
        style="background: #0d1a2d; border: 1px solid rgba(255,255,255,0.07)"
        :initial="{ opacity: 0, scale: 0.98 }"
        :animate="{ opacity: 1, scale: 1 }"
        :transition="{ delay: 0.15 }"
      >
        <div
          class="absolute inset-0"
          style="background-image: linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px); background-size: 36px 36px"
        />
        <div
          class="absolute inset-0 pointer-events-none"
          style="background: radial-gradient(ellipse 60% 60% at 45% 45%, rgba(99,102,241,0.08), transparent)"
        />

        <svg class="absolute inset-0 w-full h-full">
          <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(148,163,184,0.12)" stroke-width="2" />
          <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(148,163,184,0.12)" stroke-width="2" />
          <line
            v-for="v in [20, 35, 65, 80]"
            :key="`h${v}`"
            x1="0%"
            :y1="`${v}%`"
            x2="100%"
            :y2="`${v}%`"
            stroke="rgba(148,163,184,0.05)"
            stroke-width="1"
          />
          <line
            v-for="v in [20, 35, 65, 80]"
            :key="`v${v}`"
            :x1="`${v}%`"
            y1="0%"
            :x2="`${v}%`"
            y2="100%"
            stroke="rgba(148,163,184,0.05)"
            stroke-width="1"
          />
          <ellipse
            cx="46%"
            cy="44%"
            rx="5%"
            ry="3.5%"
            fill="rgba(59,130,246,0.12)"
            stroke="rgba(59,130,246,0.2)"
            stroke-width="1"
          />
        </svg>
        <div
          style="position: absolute; left: 43%; top: 47%; font-size: 9px; color: rgba(99,149,255,0.6); font-family: 'DM Mono', monospace; letter-spacing: 0.05em"
        >
          Hồ Hoàn Kiếm
        </div>

        <motion.button
          v-for="(c, i) in shown"
          :key="c.id"
          class="absolute"
          :style="{
            left: `${c.x}%`,
            top: `${c.y}%`,
            transform: 'translate(-50%, -100%)',
            zIndex: selected?.id === c.id ? 10 : 1,
          }"
          :initial="{ scale: 0, opacity: 0 }"
          :animate="{ scale: 1, opacity: 1 }"
          :transition="{ delay: 0.3 + i * 0.06, type: 'spring', stiffness: 300, damping: 20 }"
          :while-hover="{ scale: 1.2 }"
          :while-tap="{ scale: 0.9 }"
          @click="selectCourt(c)"
        >
          <motion.div
            v-if="c.status !== 'closed'"
            class="absolute rounded-full"
            :style="{ inset: '-4px', background: statusColors[c.status], opacity: 0.3 }"
            :animate="{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }"
            :transition="{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }"
          />
          <motion.div
            class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold relative"
            :style="{
              background: selected?.id === c.id ? statusColors[c.status] : `${statusColors[c.status]}22`,
              border: `2px solid ${statusColors[c.status]}`,
              color: selected?.id === c.id ? '#0a1200' : statusColors[c.status],
            }"
            :animate="selected?.id === c.id ? { boxShadow: [`0 0 12px ${statusColors[c.status]}80`, `0 0 24px ${statusColors[c.status]}80`, `0 0 12px ${statusColors[c.status]}80`] } : {}"
            :transition="{ duration: 1.5, repeat: Infinity }"
          >
            {{ c.courts }}
          </motion.div>
        </motion.button>

        <div
          class="absolute bottom-3 left-3 rounded-xl px-3 py-2"
          style="background: rgba(7,11,20,0.85); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(8px)"
        >
          <div class="flex gap-3">
            <span
              v-for="(col, s) in statusColors"
              :key="s"
              class="flex items-center gap-1.5"
              style="font-size: 10px; color: #94a3b8"
            >
              <span
                :style="{ width: '6px', height: '6px', borderRadius: '50%', background: col, display: 'inline-block' }"
              />
              {{ s === 'open' ? 'Mở' : s === 'busy' ? 'Đông' : 'Đóng' }}
            </span>
          </div>
        </div>
        <div
          class="absolute top-3 right-3 rounded-xl px-3 py-1.5 mono text-xs"
          style="background: rgba(7,11,20,0.85); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(8px); color: #475569"
        >
          Hà Nội, VN
        </div>
      </motion.div>

      <div class="lg:col-span-2 space-y-2.5 overflow-y-auto max-h-none lg:max-h-[440px] pr-1">
        <motion.div
          v-for="(c, i) in listCourts"
          :key="c.id"
          class="rounded-2xl p-4 cursor-pointer transition-all group"
          :style="{
            background: selected?.id === c.id ? 'rgba(132,204,22,0.06)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${selected?.id === c.id ? 'rgba(132,204,22,0.25)' : 'rgba(255,255,255,0.07)'}`,
          }"
          :initial="{ opacity: 0, x: 20 }"
          :animate="{ opacity: 1, x: 0 }"
          :transition="{ delay: 0.2 + i * 0.06 }"
          :while-hover="{ y: -2 }"
          @click="selectCourt(c)"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1 min-w-0 pr-2">
              <div style="font-weight: 600; font-size: 13px; line-height: 1.35">{{ c.name }}</div>
              <div style="color: #64748b; font-size: 11px; margin-top: 2px" class="truncate">{{ c.address }}</div>
            </div>
            <span
              class="pill flex-shrink-0"
              :style="{
                background: `${statusColors[c.status]}15`,
                color: statusColors[c.status],
                border: `1px solid ${statusColors[c.status]}30`,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }"
            >
              <motion.span
                :style="{ width: '5px', height: '5px', borderRadius: '50%', background: statusColors[c.status], display: 'inline-block' }"
                :animate="c.status !== 'closed' ? { opacity: [1, 0.4, 1] } : {}"
                :transition="{ duration: 1.5, repeat: Infinity }"
              />
              {{ c.status === 'open' ? 'Mở' : c.status === 'busy' ? 'Đông' : 'Đóng' }}
            </span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Stars :rating="c.rating" />
              <span style="color: #475569; font-size: 11px">·</span>
              <span style="color: #475569; font-size: 11px">{{ c.courts }} sân</span>
            </div>
            <span class="mono text-xs" style="color: #84cc16; font-weight: 600">{{ formatCurrency(c.price) }}/h</span>
          </div>
          <motion.button
            class="w-full mt-3 py-2 rounded-xl text-xs font-bold btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="c.status === 'closed'"
            :while-hover="c.status !== 'closed' ? { scale: 1.02 } : {}"
            :while-tap="c.status !== 'closed' ? { scale: 0.97 } : {}"
            @click="onBook(c, $event)"
          >
            {{ c.status === 'closed' ? 'Đóng cửa' : 'Đặt sân ngay' }}
          </motion.button>
        </motion.div>
      </div>
    </div>

  </div>
</template>
