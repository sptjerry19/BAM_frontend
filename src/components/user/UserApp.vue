<script setup>
import { ref, computed, onMounted, onUnmounted, provide, watch } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import { getMember } from '../../api'
import { levelColors } from '../../utils/labels'
import MapView from './MapView.vue'
import ProfileView from './ProfileView.vue'
import EquipmentView from './EquipmentView.vue'
import ShopView from './ShopView.vue'
import CartView from './CartView.vue'
import FavoritesView from './FavoritesView.vue'
import BookingModal from './BookingModal.vue'

const emit = defineEmits(['switch-portal'])

const page = ref('map')
const user = ref(null)
const cart = ref([])
const favorites = ref(['p1', 'p3'])
const bookingCourt = ref(null)
const menuOpen = ref(false)
const isMobile = ref(false)

const navItems = [
  { id: 'map', label: 'Bản đồ sân', short: 'Bản đồ', icon: '◎', color: '#6366f1' },
  { id: 'profile', label: 'Hồ sơ', short: 'Hồ sơ', icon: '◉', color: '#84cc16' },
  { id: 'equipment', label: 'Trang bị', short: 'Trang bị', icon: '⊞', color: '#f59e0b' },
  { id: 'shop', label: 'Cửa hàng', short: 'Shop', icon: '◈', color: '#ec4899' },
  { id: 'cart', label: 'Giỏ hàng', short: 'Giỏ', icon: '⬡', color: '#06b6d4' },
  { id: 'favorites', label: 'Yêu thích', short: 'Thích', icon: '♡', color: '#ef4444' },
]

const bottomNavIds = ['map', 'shop', 'cart', 'profile', 'more']
const morePages = ['equipment', 'favorites']

const cartCount = computed(() => cart.value.reduce((s, i) => s + i.qty, 0))
const currentNav = computed(() => navItems.find((i) => i.id === page.value) || navItems[0])
const moreActive = computed(() => morePages.includes(page.value))

function addToCart(productId) {
  const existing = cart.value.find((i) => i.productId === productId)
  if (existing) existing.qty++
  else cart.value.push({ productId, qty: 1 })
}

function setCart(items) {
  cart.value = items
}

function toggleFavorite(id) {
  const idx = favorites.value.indexOf(id)
  if (idx >= 0) favorites.value.splice(idx, 1)
  else favorites.value.push(id)
}

function removeFavorite(id) {
  const idx = favorites.value.indexOf(id)
  if (idx >= 0) favorites.value.splice(idx, 1)
}

provide('user', user)
provide('cart', cart)
provide('addToCart', addToCart)
provide('setCart', setCart)
provide('favorites', favorites)
provide('toggleFavorite', toggleFavorite)
provide('removeFavorite', removeFavorite)

function checkMobile() {
  isMobile.value = window.matchMedia('(max-width: 767px)').matches
  if (!isMobile.value) menuOpen.value = false
}

function selectPage(id) {
  page.value = id
  menuOpen.value = false
}

function onBottomNav(id) {
  if (id === 'more') {
    menuOpen.value = true
    return
  }
  selectPage(id)
}

function badgeCount(item) {
  if (item.id === 'cart' && cartCount.value > 0) return cartCount.value
  if (item.id === 'favorites' && favorites.value.length > 0) return favorites.value.length
  return 0
}

function onBook(court) {
  bookingCourt.value = court
}

function closeBooking() {
  bookingCourt.value = null
}

watch(menuOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  user.value = await getMember('m1')
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
      class="hidden md:flex w-64 flex-shrink-0 flex-col"
      style="border-right: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02)"
      :initial="{ x: -80, opacity: 0 }"
      :animate="{ x: 0, opacity: 1 }"
      :transition="{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }"
    >
      <div class="px-5 py-5" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
        <div v-if="user" class="flex items-center gap-3">
          <div class="relative">
            <img
              :src="user.avatar"
              :alt="user.name"
              class="w-10 h-10 rounded-2xl object-cover"
              :style="{ border: `2px solid ${levelColors[user.level]}40` }"
            />
            <div
              class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style="border-color: #070b14; background: #84cc16"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-heading font-bold text-sm truncate">{{ user.name }}</div>
            <div class="mono text-xs" style="color: #84cc16; margin-top: 1px">
              {{ user.points.toLocaleString() }} pts
            </div>
          </div>
        </div>
        <div v-else class="h-10 shimmer rounded-2xl" />
      </div>

      <nav class="flex-1 p-3 space-y-1 pt-4 overflow-y-auto">
        <motion.button
          v-for="item in navItems"
          :key="item.id"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left relative overflow-hidden"
          :style="page !== item.id ? { color: '#64748b' } : {}"
          :whileHover="page !== item.id ? { color: '#94a3b8', background: 'rgba(255,255,255,0.04)' } : {}"
          :whileTap="{ scale: 0.97 }"
          @click="selectPage(item.id)"
        >
          <motion.div
            v-if="page === item.id"
            layout-id="user-nav"
            class="absolute inset-0 rounded-xl"
            :style="{
              background: `linear-gradient(90deg, ${item.color}15, ${item.color}06)`,
              borderLeft: `2px solid ${item.color}`,
            }"
            :transition="{ type: 'spring', stiffness: 400, damping: 30 }"
          />
          <span class="relative text-base">{{ item.icon }}</span>
          <span
            class="relative flex-1 text-sm font-medium"
            :style="page === item.id ? { color: item.color } : {}"
          >
            {{ item.label }}
          </span>
          <motion.span
            v-if="badgeCount(item) > 0"
            class="relative w-5 h-5 rounded-full flex items-center justify-center mono text-xs font-bold"
            :style="{ background: item.color, color: '#0a1200' }"
            :initial="{ scale: 0 }"
            :animate="{ scale: 1 }"
            :transition="{ type: 'spring', stiffness: 400, damping: 20 }"
          >
            {{ badgeCount(item) }}
          </motion.span>
        </motion.button>
      </nav>

      <div class="p-3" style="border-top: 1px solid rgba(255,255,255,0.06)">
        <motion.button
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl btn-ghost text-sm"
          :whileHover="{ scale: 1.02 }"
          :whileTap="{ scale: 0.97 }"
          @click="emit('switch-portal')"
        >
          <span style="font-size: 16px">⇄</span> Chuyển sang Admin
        </motion.button>
      </div>
    </motion.aside>

    <!-- Mobile full menu drawer -->
    <AnimatePresence>
      <motion.div
        v-if="menuOpen"
        key="user-backdrop"
        class="fixed inset-0 z-40 md:hidden modal-backdrop"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        @click="menuOpen = false"
      />
      <motion.aside
        v-if="menuOpen"
        key="user-drawer"
        class="fixed inset-y-0 left-0 z-50 w-[min(300px,88vw)] flex flex-col md:hidden"
        style="background: #0a101c; border-right: 1px solid rgba(255,255,255,0.08); box-shadow: 20px 0 60px rgba(0,0,0,0.45)"
        :initial="{ x: '-100%' }"
        :animate="{ x: 0 }"
        :exit="{ x: '-100%' }"
        :transition="{ type: 'spring', stiffness: 380, damping: 36 }"
      >
        <div class="p-5 flex items-start justify-between gap-3" style="border-bottom: 1px solid rgba(255,255,255,0.06)">
          <div v-if="user" class="flex items-center gap-3 min-w-0">
            <img
              :src="user.avatar"
              :alt="user.name"
              class="w-12 h-12 rounded-2xl object-cover shrink-0"
              :style="{ border: `2px solid ${levelColors[user.level]}40` }"
            />
            <div class="min-w-0">
              <div class="font-heading font-bold text-sm truncate">{{ user.name }}</div>
              <div class="mono text-xs" style="color: #84cc16">{{ user.points.toLocaleString() }} pts</div>
            </div>
          </div>
          <button
            type="button"
            class="btn-ghost w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            aria-label="Đóng menu"
            @click="menuOpen = false"
          >
            ✕
          </button>
        </div>

        <nav class="flex-1 p-3 space-y-1 overflow-y-auto">
          <button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left"
            :style="{
              color: page === item.id ? item.color : '#94a3b8',
              background: page === item.id ? `${item.color}12` : 'transparent',
              borderLeft: page === item.id ? `2px solid ${item.color}` : '2px solid transparent',
            }"
            @click="selectPage(item.id)"
          >
            <span class="text-base w-5 text-center">{{ item.icon }}</span>
            <span class="flex-1 text-sm font-medium">{{ item.label }}</span>
            <span
              v-if="badgeCount(item) > 0"
              class="w-5 h-5 rounded-full flex items-center justify-center mono text-xs font-bold"
              :style="{ background: item.color, color: '#0a1200' }"
            >
              {{ badgeCount(item) }}
            </span>
          </button>
        </nav>

        <div class="p-3 pb-[max(12px,env(safe-area-inset-bottom))]" style="border-top: 1px solid rgba(255,255,255,0.06)">
          <button
            type="button"
            class="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl btn-ghost text-sm"
            @click="emit('switch-portal'); menuOpen = false"
          >
            <span>⇄</span>
            <span>Chuyển sang Admin</span>
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>

    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Mobile top bar -->
      <header
        class="md:hidden flex items-center gap-3 px-4 py-3 shrink-0"
        style="border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(7,11,20,0.92); backdrop-filter: blur(12px); padding-top: max(12px, env(safe-area-inset-top))"
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
          <div v-if="user" class="text-[11px] truncate" style="color: #64748b">
            {{ user.name }} · {{ user.points.toLocaleString() }} pts
          </div>
        </div>
        <button
          type="button"
          class="relative w-11 h-11 rounded-xl btn-ghost flex items-center justify-center"
          @click="selectPage('cart')"
        >
          ⬡
          <span
            v-if="cartCount > 0"
            class="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style="background: #06b6d4; color: #0a1200"
          >
            {{ cartCount }}
          </span>
        </button>
      </header>

      <main
        class="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8"
        :class="isMobile ? 'pb-24' : 'pb-[max(16px,env(safe-area-inset-bottom))]'"
      >
        <AnimatePresence mode="wait">
          <motion.div
            :key="page"
            :initial="{ opacity: 0, y: 12 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -8 }"
            :transition="{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }"
          >
            <MapView v-if="page === 'map'" @book="onBook" />
            <ProfileView v-else-if="page === 'profile'" />
            <EquipmentView v-else-if="page === 'equipment'" />
            <ShopView v-else-if="page === 'shop'" />
            <CartView v-else-if="page === 'cart'" />
            <FavoritesView v-else-if="page === 'favorites'" />
          </motion.div>
        </AnimatePresence>
      </main>

      <!-- Mobile bottom nav -->
      <nav
        class="md:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-5 gap-0.5 px-2 pt-2"
        style="background: rgba(7,11,20,0.94); border-top: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(16px); padding-bottom: max(8px, env(safe-area-inset-bottom))"
      >
        <button
          v-for="id in bottomNavIds"
          :key="id"
          type="button"
          class="relative flex flex-col items-center justify-center gap-1 py-2 rounded-xl min-h-[56px] transition-colors"
          :style="{
            color:
              id === 'more'
                ? moreActive || menuOpen
                  ? '#f0f4ff'
                  : '#64748b'
                : page === id
                  ? navItems.find((n) => n.id === id)?.color
                  : '#64748b',
            background:
              id !== 'more' && page === id
                ? `${navItems.find((n) => n.id === id)?.color}14`
                : 'transparent',
          }"
          @click="onBottomNav(id)"
        >
          <span class="text-lg leading-none">
            {{ id === 'more' ? '☰' : navItems.find((n) => n.id === id)?.icon }}
          </span>
          <span class="text-[10px] font-semibold leading-none">
            {{ id === 'more' ? 'Menu' : navItems.find((n) => n.id === id)?.short }}
          </span>
          <span
            v-if="id === 'cart' && cartCount > 0"
            class="absolute top-1.5 right-[18%] min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style="background: #06b6d4; color: #0a1200"
          >
            {{ cartCount }}
          </span>
        </button>
      </nav>
    </div>

    <AnimatePresence>
      <BookingModal v-if="bookingCourt" :court="bookingCourt" @close="closeBooking" />
    </AnimatePresence>
  </div>
</template>
