<script setup>
import { ref, onMounted, computed } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import AdminApp from './components/admin/AdminApp.vue'
import UserApp from './components/user/UserApp.vue'
import { getStats } from './api'

const portal = ref('select')
const stats = ref({ courts: 6, products: 10, members: 6 })

const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  duration: Math.random() * 4 + 3,
  delay: Math.random() * 3,
}))

const portals = [
  {
    key: 'admin',
    icon: '⚙️',
    title: 'Admin Portal',
    desc: 'Quản lý sân, sản phẩm và thành viên trong câu lạc bộ',
    label: 'Vào trang Admin',
    color: '#84cc16',
    glow: 'rgba(132,204,22,0.25)',
    features: ['Quản lý sân', 'Bán hàng', 'Thành viên'],
  },
  {
    key: 'user',
    icon: '🏸',
    title: 'User Portal',
    desc: 'Xem sân trên bản đồ, hồ sơ cá nhân và mua sắm trang bị',
    label: 'Vào trang thành viên',
    color: '#6366f1',
    glow: 'rgba(99,102,241,0.25)',
    features: ['Bản đồ sân', 'Hồ sơ', 'Cửa hàng'],
  },
]

onMounted(async () => {
  try {
    const data = await getStats()
    stats.value = {
      courts: data.courtCount ?? data.courtStatuses?.length ?? 6,
      products: data.productCount ?? 10,
      members: data.memberCount ?? data.activeMembers ?? 6,
    }
  } catch {
    /* defaults */
  }
})

function setPortal(p) {
  portal.value = p
}

const statRows = computed(() => [
  [String(stats.value.courts), 'Sân cầu lông'],
  [String(stats.value.products), 'Sản phẩm'],
  [String(stats.value.members), 'Thành viên'],
])
</script>

<template>
  <AnimatePresence mode="wait">
    <motion.div
      v-if="portal === 'admin'"
      key="admin"
      class="h-screen"
      :initial="{ opacity: 0, scale: 0.97 }"
      :animate="{ opacity: 1, scale: 1 }"
      :exit="{ opacity: 0, scale: 0.97 }"
      :transition="{ duration: 0.3 }"
    >
      <AdminApp @switch-portal="setPortal('user')" />
    </motion.div>

    <motion.div
      v-else-if="portal === 'user'"
      key="user"
      class="h-screen"
      :initial="{ opacity: 0, scale: 0.97 }"
      :animate="{ opacity: 1, scale: 1 }"
      :exit="{ opacity: 0, scale: 0.97 }"
      :transition="{ duration: 0.3 }"
    >
      <UserApp @switch-portal="setPortal('admin')" />
    </motion.div>

    <motion.div
      v-else
      key="select"
      class="min-h-[100dvh] mesh-bg grid-dots flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-y-auto overflow-x-hidden"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :exit="{ opacity: 0, scale: 1.05 }"
      :transition="{ duration: 0.4 }"
    >
      <div
        class="absolute top-1/4 left-1/5 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style="background: radial-gradient(circle, #84cc16, transparent 70%)"
      />
      <div
        class="absolute bottom-1/4 right-1/5 w-80 h-80 rounded-full pointer-events-none blur-3xl"
        style="background: radial-gradient(circle, #6366f1, transparent 70%); opacity: 0.08"
      />

      <motion.div
        v-for="p in particles"
        :key="p.id"
        class="absolute rounded-full pointer-events-none"
        :style="{
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          background: p.id % 3 === 0 ? '#84cc16' : p.id % 3 === 1 ? '#6366f1' : '#facc15',
        }"
        :animate="{ y: [-8, 8, -8], opacity: [0.2, 0.7, 0.2] }"
        :transition="{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }"
      />

      <motion.div
        class="relative mb-12 text-center"
        :initial="{ y: -30, opacity: 0 }"
        :animate="{ y: 0, opacity: 1 }"
        :transition="{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }"
      >
        <motion.div
          class="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl relative"
          style="background: linear-gradient(135deg, #84cc16, #a3e635)"
          :animate="{
            boxShadow: [
              '0 0 20px rgba(132,204,22,0.4)',
              '0 0 50px rgba(132,204,22,0.6)',
              '0 0 20px rgba(132,204,22,0.4)',
            ],
          }"
          :transition="{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }"
        >
          🏸
          <div
            class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#facc15] flex items-center justify-center"
            style="font-size: 8px; font-weight: 700; color: #0a1200"
          >
            ✓
          </div>
        </motion.div>
        <h1 class="font-heading font-extrabold tracking-tight leading-tight" style="font-size: clamp(32px, 10vw, 42px); letter-spacing: -1.5px">
          <span class="grad-lime">Badminton</span>
          <br />
          <span style="color: #f0f4ff">Manager</span>
        </h1>
        <motion.p
          class="text-sm mt-3 mono"
          style="color: #475569; letter-spacing: 0.05em"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :transition="{ delay: 0.5 }"
        >
          Hệ thống quản lý câu lạc bộ cầu lông toàn diện
        </motion.p>
      </motion.div>

      <motion.div
        class="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl"
        :initial="{ y: 30, opacity: 0 }"
        :animate="{ y: 0, opacity: 1 }"
        :transition="{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }"
      >
        <motion.button
          v-for="(card, i) in portals"
          :key="card.key"
          class="relative rounded-3xl p-5 sm:p-7 text-left overflow-hidden group cursor-pointer"
          style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(20px)"
          :initial="{ opacity: 0, y: 20 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: 0.4 + i * 0.1 }"
          :whileHover="{ y: -4, scale: 1.02 }"
          :whileTap="{ scale: 0.98 }"
          @click="setPortal(card.key)"
        >
          <div
            class="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            :style="{ background: `radial-gradient(circle at 30% 30%, ${card.glow}, transparent 60%)` }"
          />
          <div
            class="absolute top-0 left-6 right-6 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            :style="{ background: `linear-gradient(90deg, transparent, ${card.color}, transparent)` }"
          />

          <div
            class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 relative"
            :style="{ background: `${card.color}18`, border: `1px solid ${card.color}30` }"
          >
            {{ card.icon }}
          </div>

          <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 800; margin-bottom: 8px">
            {{ card.title }}
          </h2>
          <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-bottom: 16px">{{ card.desc }}</p>

          <div class="flex gap-2 mb-5 flex-wrap">
            <span
              v-for="f in card.features"
              :key="f"
              class="pill"
              :style="{ background: `${card.color}12`, color: card.color, border: `1px solid ${card.color}25` }"
            >
              {{ f }}
            </span>
          </div>

          <div
            class="flex items-center gap-2 text-sm font-semibold"
            :style="{ color: card.color, fontFamily: `'Plus Jakarta Sans', sans-serif` }"
          >
            {{ card.label }}
            <span>→</span>
          </div>
        </motion.button>
      </motion.div>

      <motion.div
        class="flex items-center gap-5 sm:gap-8 mt-8 sm:mt-10 text-center flex-wrap justify-center"
        :initial="{ opacity: 0, y: 10 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.7 }"
      >
        <div v-for="[n, l] in statRows" :key="l">
          <div class="mono text-xl font-medium grad-lime">{{ n }}</div>
          <div style="color: #475569; font-size: 11px; margin-top: 2px">{{ l }}</div>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
</template>
