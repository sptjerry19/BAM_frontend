<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { motion, AnimatePresence, LayoutGroup } from 'motion-v'
import AdminDashboard from './AdminDashboard.vue'
import CourtsManager from './CourtsManager.vue'
import ProductsManager from './ProductsManager.vue'
import MembersManager from './MembersManager.vue'

const emit = defineEmits(['logout'])

defineProps({
  authUser: { type: Object, default: null },
})

const page = ref('dashboard')
const menuOpen = ref(false)
const isMobile = ref(false)

const navItems = [
  { id: 'dashboard', label: 'Tổng quan', icon: '▦', color: '#84cc16' },
  { id: 'courts', label: 'Quản lý sân', icon: '⬡', color: '#6366f1' },
  { id: 'products', label: 'Sản phẩm', icon: '◈', color: '#f59e0b' },
  { id: 'members', label: 'Thành viên', icon: '◉', color: '#ec4899' },
]

const pageComponents = {
  dashboard: AdminDashboard,
  courts: CourtsManager,
  products: ProductsManager,
  members: MembersManager,
}

const CurrentPage = computed(() => pageComponents[page.value])
const currentNav = computed(() => navItems.find((i) => i.id === page.value) || navItems[0])

function checkMobile() {
  isMobile.value = window.matchMedia('(max-width: 767px)').matches
  if (!isMobile.value) menuOpen.value = false
}

function selectPage(id) {
  page.value = id
  menuOpen.value = false
}

watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="flex h-[100dvh] overflow-hidden" style="background: #070b14">
    <!-- Desktop sidebar -->
    <motion.aside
      class="hidden md:flex w-64 flex-col shrink-0"
      style="border-right: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02)"
      :initial="{ x: -80, opacity: 0 }"
      :animate="{ x: 0, opacity: 1 }"
      :transition="{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }"
    >
      <div class="p-6" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
        <div class="flex items-center gap-3">
          <motion.div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style="background: linear-gradient(135deg, #84cc16, #a3e635)"
            :animate="{
              boxShadow: [
                '0 0 12px rgba(132,204,22,0.35)',
                '0 0 28px rgba(132,204,22,0.55)',
                '0 0 12px rgba(132,204,22,0.35)',
              ],
            }"
            :transition="{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }"
          >
            🏸
          </motion.div>
          <div>
            <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 15px; color: #f0f4ff">
              Admin Panel
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px">Badminton Manager</div>
          </div>
        </div>
      </div>

      <LayoutGroup>
        <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
          <motion.button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium relative overflow-hidden"
            :style="{ color: page === item.id ? item.color : '#64748b' }"
            :whileHover="{ x: 2 }"
            :whileTap="{ scale: 0.98 }"
            @click="selectPage(item.id)"
          >
            <motion.div
              v-if="page === item.id"
              layoutId="nav-active"
              class="absolute inset-0 rounded-xl"
              :style="{
                background: `linear-gradient(90deg, ${item.color}26, ${item.color}0a)`,
                borderLeft: `2px solid ${item.color}`,
              }"
              :transition="{ type: 'spring', damping: 30, stiffness: 350 }"
            />
            <span class="relative z-10 text-base leading-none">{{ item.icon }}</span>
            <span class="relative z-10">{{ item.label }}</span>
          </motion.button>
        </nav>
      </LayoutGroup>

      <div class="p-3" style="border-top: 1px solid rgba(255,255,255,0.06)">
        <motion.button
          type="button"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl btn-ghost text-sm"
          :whileHover="{ scale: 1.02 }"
          :whileTap="{ scale: 0.97 }"
          @click="emit('logout')"
        >
          <span style="font-size: 16px">⎋</span>
          <span>Đăng xuất</span>
        </motion.button>
      </div>
    </motion.aside>

    <!-- Mobile drawer -->
    <AnimatePresence>
      <motion.div
        v-if="menuOpen"
        key="admin-backdrop"
        class="fixed inset-0 z-40 md:hidden modal-backdrop"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        @click="menuOpen = false"
      />
      <motion.aside
        v-if="menuOpen"
        key="admin-drawer"
        class="fixed inset-y-0 left-0 z-50 w-[min(288px,86vw)] flex flex-col md:hidden safe-pad"
        style="background: #0a101c; border-right: 1px solid rgba(255,255,255,0.08); box-shadow: 20px 0 60px rgba(0,0,0,0.45)"
        :initial="{ x: '-100%' }"
        :animate="{ x: 0 }"
        :exit="{ x: '-100%' }"
        :transition="{ type: 'spring', stiffness: 380, damping: 36 }"
      >
        <div class="p-5 flex items-center justify-between" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style="background: linear-gradient(135deg, #84cc16, #a3e635)"
            >
              🏸
            </div>
            <div>
              <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 15px">Admin Panel</div>
              <div style="font-size: 11px; color: #64748b">Badminton Manager</div>
            </div>
          </div>
          <button
            type="button"
            class="btn-ghost w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            aria-label="Đóng menu"
            @click="menuOpen = false"
          >
            ✕
          </button>
        </div>

        <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
          <motion.button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium relative overflow-hidden"
            :style="{
              color: page === item.id ? item.color : '#94a3b8',
              background: page === item.id ? `${item.color}12` : 'transparent',
              borderLeft: page === item.id ? `2px solid ${item.color}` : '2px solid transparent',
            }"
            :whileTap="{ scale: 0.98 }"
            @click="selectPage(item.id)"
          >
            <span class="text-base">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </motion.button>
        </nav>

        <div class="p-3 pb-[max(12px,env(safe-area-inset-bottom))]" style="border-top: 1px solid rgba(255,255,255,0.06)">
          <button
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl btn-ghost text-sm"
            @click="emit('logout'); menuOpen = false"
          >
            <span>⎋</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Mobile top bar -->
      <header
        class="md:hidden flex items-center gap-3 px-4 py-3 shrink-0 safe-pad-top"
        style="border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(7,11,20,0.92); backdrop-filter: blur(12px)"
      >
        <motion.button
          type="button"
          class="w-11 h-11 rounded-xl btn-ghost flex flex-col items-center justify-center gap-[5px]"
          aria-label="Mở menu"
          :whileTap="{ scale: 0.94 }"
          @click="menuOpen = true"
        >
          <span class="block w-5 h-0.5 rounded-full bg-current" />
          <span class="block w-5 h-0.5 rounded-full bg-current" />
          <span class="block w-4 h-0.5 rounded-full bg-current self-start ml-[11px]" />
        </motion.button>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-heading font-bold truncate" :style="{ color: currentNav.color }">
            {{ currentNav.label }}
          </div>
          <div class="text-[11px] truncate" style="color: #64748b">Admin · Badminton Manager</div>
        </div>
        <button
          type="button"
          class="w-11 h-11 rounded-xl btn-ghost flex items-center justify-center text-base"
          title="Đăng xuất"
          @click="emit('logout')"
        >
          ⎋
        </button>
      </header>

      <main class="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 pb-[max(16px,env(safe-area-inset-bottom))]">
        <AnimatePresence mode="wait">
          <motion.div
            :key="page"
            :initial="{ opacity: 0, y: 12 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -12 }"
            :transition="{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }"
          >
            <component :is="CurrentPage" />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  </div>
</template>
