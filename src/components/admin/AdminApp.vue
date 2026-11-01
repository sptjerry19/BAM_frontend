<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { motion, AnimatePresence } from 'motion-v'
import { useAuth } from '../../composables/useAuth'
import Icon from '../common/Icon.vue'
import ThemeToggle from '../common/ThemeToggle.vue'
import LocaleToggle from '../common/LocaleToggle.vue'

const route = useRoute()
const router = useRouter()
const { logout } = useAuth()

const menuOpen = ref(false)
const isMobile = ref(false)

const navItems = [
  { name: 'admin-dashboard', label: 'Tổng quan', icon: 'chart' },
  { name: 'admin-courts', label: 'Quản lý sân', icon: 'court' },
  { name: 'admin-products', label: 'Sản phẩm', icon: 'bag' },
  { name: 'admin-members', label: 'Thành viên', icon: 'user' },
  { name: 'admin-news', label: 'Tin tức', icon: 'news' },
  { name: 'admin-social-reports', label: 'Báo cáo cộng đồng', icon: 'user' },
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
  <div class="admin-shell flex h-[100dvh] overflow-hidden" style="background: var(--bg)">
    <!-- Desktop sidebar -->
    <motion.aside
      class="admin-sidebar hidden md:flex w-[260px] flex-col shrink-0"
      :initial="{ x: -48, opacity: 0 }"
      :animate="{ x: 0, opacity: 1 }"
      :transition="{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }"
    >
      <div class="px-5 py-6" style="border-bottom: 1px solid var(--line)">
        <RouterLink :to="{ name: 'admin-dashboard' }" class="flex items-center gap-3 group">
          <span
            class="font-heading text-[20px] font-bold tracking-tight"
            style="color: var(--text)"
          >
            JBadminton
          </span>
        </RouterLink>
        <p class="mt-1 text-[12px]" style="color: var(--text-3)">Admin · Quản trị hệ thống</p>
      </div>

      <nav class="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Điều hướng quản trị">
        <RouterLink
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="admin-nav-link w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[14px] font-semibold"
        >
          <Icon :name="item.icon" :size="18" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="p-3 space-y-2" style="border-top: 1px solid var(--line)">
        <div class="px-3 py-2 flex items-center justify-between gap-2">
          <span class="text-[11px] uppercase tracking-[0.08em]" style="color: var(--text-3)">Giao diện</span>
          <div class="flex items-center gap-2">
            <LocaleToggle />
            <ThemeToggle />
          </div>
        </div>
        <button
          type="button"
          class="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl btn-ghost text-[14px] font-semibold"
          @click="onLogout"
        >
          <Icon name="logout" :size="17" />
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
        class="admin-sidebar fixed inset-y-0 left-0 z-50 w-[min(300px,88vw)] flex flex-col md:hidden safe-pad"
        style="box-shadow: var(--shadow-lg)"
        :initial="{ x: '-100%' }"
        :animate="{ x: 0 }"
        :exit="{ x: '-100%' }"
        :transition="{ type: 'spring', stiffness: 380, damping: 36 }"
      >
        <div class="p-5 flex items-center justify-between" style="border-bottom: 1px solid var(--line)">
          <div>
            <div class="font-heading text-[18px] font-bold tracking-tight">JBadminton</div>
            <div class="text-[12px] mt-0.5" style="color: var(--text-3)">Admin</div>
          </div>
          <button
            type="button"
            class="icon-btn"
            aria-label="Đóng menu"
            @click="menuOpen = false"
          >
            <Icon name="close" :size="18" />
          </button>
        </div>

        <nav class="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Điều hướng quản trị di động">
          <RouterLink
            v-for="item in navItems"
            :key="item.name"
            :to="{ name: item.name }"
            class="admin-nav-link w-full flex items-center gap-3 px-3.5 py-3.5 rounded-xl text-[14px] font-semibold"
          >
            <Icon :name="item.icon" :size="18" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <div class="p-3 pb-[max(12px,env(safe-area-inset-bottom))]" style="border-top: 1px solid var(--line)">
          <div class="px-3 py-2 mb-2 flex items-center justify-between gap-2">
            <LocaleToggle />
            <ThemeToggle />
          </div>
          <button
            type="button"
            class="w-full flex items-center gap-3 px-3.5 py-3.5 rounded-xl btn-ghost text-[14px] font-semibold"
            @click="onLogout"
          >
            <Icon name="logout" :size="17" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header class="admin-topbar md:hidden flex items-center gap-3 px-4 py-3 shrink-0 safe-pad-top">
        <button
          type="button"
          class="icon-btn"
          aria-label="Mở menu"
          @click="menuOpen = true"
        >
          <Icon name="menu" :size="20" />
        </button>
        <div class="flex-1 min-w-0">
          <div class="text-[14px] font-heading font-bold truncate">{{ currentNav.label }}</div>
          <div class="text-[11px] truncate" style="color: var(--text-3)">JBadminton Admin</div>
        </div>
        <LocaleToggle />
        <ThemeToggle />
      </header>

      <main class="admin-main flex-1 overflow-y-auto overscroll-contain">
        <div class="admin-main__inner">
          <RouterView v-slot="{ Component, route: current }">
            <AnimatePresence mode="wait">
              <motion.div
                :key="current.path"
                :initial="{ opacity: 0, y: 12 }"
                :animate="{ opacity: 1, y: 0 }"
                :exit="{ opacity: 0, y: -8 }"
                :transition="{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }"
              >
                <component :is="Component" />
              </motion.div>
            </AnimatePresence>
          </RouterView>
        </div>
      </main>
    </div>
  </div>
</template>
