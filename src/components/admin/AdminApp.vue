<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { motion, AnimatePresence } from 'motion-v'
import { useAuth } from '../../composables/useAuth'
import ThemeToggle from '../common/ThemeToggle.vue'
import LocaleToggle from '../common/LocaleToggle.vue'

const route = useRoute()
const router = useRouter()
const { logout } = useAuth()

const menuOpen = ref(false)
const isMobile = ref(false)

const navItems = [
  { name: 'admin-dashboard', label: 'Tổng quan', icon: '▦' },
  { name: 'admin-courts', label: 'Quản lý sân', icon: '⬡' },
  { name: 'admin-products', label: 'Sản phẩm', icon: '◈' },
  { name: 'admin-members', label: 'Thành viên', icon: '◉' },
]

const currentNav = computed(
  () => navItems.find((i) => i.name === route.name) || navItems[0],
)

function checkMobile() {
  isMobile.value = window.matchMedia('(max-width: 767px)').matches
  if (!isMobile.value) menuOpen.value = false
}

async function onLogout() {
  menuOpen.value = false
  await logout()
  router.push({ name: 'login' })
}

watch(menuOpen, (open) => {
  document.body.classList.toggle('is-locked', open)
})

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.body.classList.remove('is-locked')
})
</script>

<template>
  <div class="flex h-[100dvh] overflow-hidden" style="background: var(--bg)">
    <!-- Desktop sidebar -->
    <motion.aside
      class="hidden md:flex w-64 flex-col shrink-0"
      style="border-right: 1px solid var(--line); background: var(--bg-1)"
      :initial="{ x: -80, opacity: 0 }"
      :animate="{ x: 0, opacity: 1 }"
      :transition="{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }"
    >
      <div class="p-6" style="border-bottom: 1px solid var(--line)">
        <div class="flex items-center gap-3">
          <motion.div
            class="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style="background: linear-gradient(135deg, var(--accent-deep), var(--accent)); color: var(--on-accent)"
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
            <div style="font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800; font-size: 15px; color: var(--text)">
              Admin Panel
            </div>
            <div style="font-size: 11px; color: var(--text-3); margin-top: 2px">Badminton Manager</div>
          </div>
        </div>
      </div>

      <nav class="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Điều hướng quản trị">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="admin-nav-link w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
        >
          <span class="text-base leading-none">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="p-3 space-y-1" style="border-top: 1px solid var(--line)">
        <div class="px-4 py-2 flex items-center justify-between gap-2">
          <span class="text-xs" style="color: var(--text-3)">Giao diện</span>
          <div class="flex items-center gap-2">
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
        <button
          type="button"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl btn-ghost text-sm"
          @click="onLogout"
        >
          <span style="font-size: 16px">⎋</span>
          <span>Đăng xuất</span>
        </button>
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
        style="background: var(--bg-1); border-right: 1px solid var(--line); box-shadow: var(--shadow-lg)"
        :initial="{ x: '-100%' }"
        :animate="{ x: 0 }"
        :exit="{ x: '-100%' }"
        :transition="{ type: 'spring', stiffness: 380, damping: 36 }"
      >
        <div class="p-5 flex items-center justify-between" style="border-bottom: 1px solid var(--line)">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
              style="background: linear-gradient(135deg, var(--accent-deep), var(--accent)); color: var(--on-accent)"
            >
              🏸
            </div>
            <div>
              <div style="font-family: 'Be Vietnam Pro', sans-serif; font-weight: 800; font-size: 15px">Admin Panel</div>
              <div style="font-size: 11px; color: var(--text-3)">Badminton Manager</div>
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

        <nav class="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Điều hướng quản trị di động">
          <RouterLink
            v-for="item in navItems"
            :key="item.name"
            :to="{ name: item.name }"
            class="admin-nav-link w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium"
          >
            <span class="text-base">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <div class="p-3 pb-[max(12px,env(safe-area-inset-bottom))]" style="border-top: 1px solid var(--line)">
          <button
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl btn-ghost text-sm"
            @click="onLogout"
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
        style="border-bottom: 1px solid var(--line); background: var(--nav-bg); backdrop-filter: blur(12px)"
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
          <div class="text-sm font-heading font-bold truncate" style="color: var(--accent)">
            {{ currentNav.label }}
          </div>
          <div class="text-[11px] truncate" style="color: var(--text-3)">Admin · Badminton Manager</div>
        </div>
        <LocaleToggle />
        <ThemeToggle />
        <button
          type="button"
          class="w-11 h-11 rounded-xl btn-ghost flex items-center justify-center text-base"
          title="Đăng xuất"
          @click="onLogout"
        >
          ⎋
        </button>
      </header>

      <main class="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8 pb-[max(16px,env(safe-area-inset-bottom))]">
        <RouterView v-slot="{ Component, route: current }">
          <AnimatePresence mode="wait">
            <motion.div
              :key="current.path"
              :initial="{ opacity: 0, y: 12 }"
              :animate="{ opacity: 1, y: 0 }"
              :exit="{ opacity: 0, y: -12 }"
              :transition="{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }"
            >
              <component :is="Component" />
            </motion.div>
          </AnimatePresence>
        </RouterView>
      </main>
    </div>
  </div>
</template>
