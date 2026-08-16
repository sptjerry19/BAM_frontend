<script setup>
import { ref, computed, onMounted, onUnmounted, provide, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { motion, AnimatePresence } from 'motion-v'
import { getMember, attachMemberEquipment, detachMemberEquipment } from '../../api'
import { levelColors, levelLabels } from '../../utils/labels'
import { useAuth } from '../../composables/useAuth'
import Icon from '../common/Icon.vue'
import ThemeToggle from '../common/ThemeToggle.vue'
import BookingModal from './BookingModal.vue'

const CART_KEY = 'jb_cart'
const FAV_KEY = 'jb_favorites'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const route = useRoute()
const router = useRouter()
const { user: authUser, isAuthenticated, logout } = useAuth()

const user = ref(null)
const cart = ref(readJson(CART_KEY, []))
const favorites = ref(readJson(FAV_KEY, []))
const bookingCourt = ref(null)
const menuOpen = ref(false)
const accountOpen = ref(false)

const publicNavItems = [
  { name: 'home', label: 'Trang chủ', icon: 'home' },
  { name: 'courts', label: 'Đặt sân', icon: 'court' },
  { name: 'shop', label: 'Cửa hàng', icon: 'shuttlecock' },
  { name: 'favorites', label: 'Yêu thích', icon: 'heart' },
]

const accountNavItems = [
  { name: 'equipment', label: 'Trang bị', icon: 'racket' },
  { name: 'profile', label: 'Hồ sơ', icon: 'user' },
]

const navItems = computed(() =>
  isAuthenticated.value ? [...publicNavItems, ...accountNavItems] : publicNavItems,
)

const bottomNavItems = computed(() => [
  { name: 'home', label: 'Trang chủ', icon: 'home' },
  { name: 'courts', label: 'Đặt sân', icon: 'court' },
  { name: 'shop', label: 'Cửa hàng', icon: 'shuttlecock' },
  { name: 'cart', label: 'Giỏ hàng', icon: 'bag' },
  ...(isAuthenticated.value
    ? [{ name: 'profile', label: 'Hồ sơ', icon: 'user' }]
    : [{ name: 'favorites', label: 'Yêu thích', icon: 'heart' }]),
])

const year = new Date().getFullYear()

const cartCount = computed(() => cart.value.reduce((s, i) => s + i.qty, 0))

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

/** Send guests to login; return true when the action may proceed. */
function requireAuth(redirectTo = route.fullPath) {
  if (isAuthenticated.value) return true
  router.push({
    name: 'login',
    query: redirectTo ? { redirect: redirectTo } : {},
  })
  return false
}

async function addToEquipment(productId) {
  if (!requireAuth(route.fullPath)) return
  if (!user.value?.id || !productId) return
  const equipment = user.value.equipment || []
  if (equipment.includes(productId)) return
  try {
    const updated = await attachMemberEquipment(user.value.id, productId)
    user.value = updated?.equipment ? updated : { ...user.value, equipment: [...equipment, productId] }
  } catch {
    user.value = { ...user.value, equipment: [...equipment, productId] }
  }
}

async function removeFromEquipment(productId) {
  if (!requireAuth(route.fullPath)) return
  if (!user.value?.id || !productId) return
  const equipment = (user.value.equipment || []).filter((id) => id !== productId)
  try {
    const updated = await detachMemberEquipment(user.value.id, productId)
    user.value = updated?.equipment !== undefined ? updated : { ...user.value, equipment }
  } catch {
    user.value = { ...user.value, equipment }
  }
}

function openBooking(court) {
  if (!requireAuth(`/courts`)) return
  bookingCourt.value = court
}

function closeBooking() {
  bookingCourt.value = null
}

function openProductDetail(p) {
  if (!p?.id) return
  router.push({ name: 'product-detail', params: { id: String(p.id) } })
}

provide('user', user)
provide('cart', cart)
provide('addToCart', addToCart)
provide('setCart', setCart)
provide('favorites', favorites)
provide('toggleFavorite', toggleFavorite)
provide('removeFavorite', removeFavorite)
provide('addToEquipment', addToEquipment)
provide('removeFromEquipment', removeFromEquipment)
provide('openProductDetail', openProductDetail)
provide('openBooking', openBooking)
provide('requireAuth', requireAuth)
provide('goToShop', () => router.push({ name: 'shop' }))

function badgeCount(name) {
  if (name === 'cart') return cartCount.value
  if (name === 'favorites') return favorites.value.length
  return 0
}

async function onLogout() {
  menuOpen.value = false
  accountOpen.value = false
  await logout()
  user.value = null
  router.push({ name: 'home' })
}

async function loadMember() {
  user.value = null
  if (!isAuthenticated.value || !authUser.value) return

  const memberId = authUser.value.member_id || authUser.value.member?.id
  if (memberId) {
    try {
      user.value = await getMember(memberId)
      return
    } catch {
      /* fallback below */
    }
  }
  if (authUser.value.member) {
    user.value = authUser.value.member
  } else {
    user.value = {
      id: authUser.value.member_id || `u_${authUser.value.id}`,
      name: authUser.value.name,
      email: authUser.value.email,
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(authUser.value.email || authUser.value.name)}`,
      level: 'beginner',
      points: 0,
      matches: 0,
      wins: 0,
      total_cost: 0,
      equipment: [],
      status: 'active',
    }
  }
}

function onWindowClick(e) {
  if (!accountOpen.value) return
  if (!e.target.closest?.('[data-account-menu]')) accountOpen.value = false
}

function onEscape(e) {
  if (e.key !== 'Escape') return
  menuOpen.value = false
  accountOpen.value = false
}

watch(
  cart,
  (items) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  },
  { deep: true },
)

watch(
  favorites,
  (items) => {
    localStorage.setItem(FAV_KEY, JSON.stringify(items))
  },
  { deep: true },
)

watch(menuOpen, (open) => {
  document.body.classList.toggle('is-locked', open)
})

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
    accountOpen.value = false
  },
)

watch(isAuthenticated, () => {
  loadMember()
})

onMounted(() => {
  window.addEventListener('click', onWindowClick)
  window.addEventListener('keydown', onEscape)
  loadMember()
})

onUnmounted(() => {
  window.removeEventListener('click', onWindowClick)
  window.removeEventListener('keydown', onEscape)
  document.body.classList.remove('is-locked')
})
</script>

<template>
  <div class="min-h-[100dvh]" style="background: var(--bg)">
    <a class="skip-link" href="#main">Bỏ qua tới nội dung</a>

    <div class="pre-nav" aria-label="Liên kết phụ">
      <div class="shell pre-nav__inner">
        <a href="#main">Tìm sân</a>
        <a href="#main">Hỗ trợ</a>
        <RouterLink
          v-if="!isAuthenticated"
          :to="{ name: 'login', query: { redirect: route.fullPath } }"
        >
          Đăng nhập
        </RouterLink>
        <RouterLink v-else :to="{ name: 'profile' }">Tài khoản</RouterLink>
        <ThemeToggle />
      </div>
    </div>

    <header class="top-nav">
      <div class="shell flex items-center gap-5 h-[60px] md:h-[64px]">
        <button
          type="button"
          class="icon-btn md:hidden border-0 bg-transparent"
          aria-label="Mở menu"
          @click.stop="menuOpen = true"
        >
          <Icon name="menu" :size="22" />
        </button>

        <RouterLink
          :to="{ name: 'home' }"
          class="shrink-0"
          aria-label="Về trang chủ JBadminton"
        >
          <span class="font-heading text-[22px] md:text-[24px] font-bold tracking-tight">
            JBadminton
          </span>
        </RouterLink>

        <nav class="hidden md:flex items-center gap-8 ml-8" aria-label="Điều hướng chính">
          <RouterLink
            v-for="item in navItems.filter((n) => n.name !== 'home')"
            :key="item.name"
            :to="{ name: item.name }"
            class="nav-link"
          >
            {{ item.label }}
            <span
              v-if="badgeCount(item.name) > 0"
              class="mono text-[10px] px-1.5 py-px rounded"
              style="background: var(--accent-soft); color: var(--text)"
            >
              {{ badgeCount(item.name) }}
            </span>
          </RouterLink>
        </nav>

        <div class="flex-1" />

        <div class="md:hidden">
          <ThemeToggle />
        </div>

        <RouterLink
          :to="{ name: 'favorites' }"
          class="icon-btn border-0 bg-transparent"
          :aria-label="`Yêu thích, ${favorites.length} mục`"
        >
          <Icon name="heart" :size="20" />
          <span v-if="favorites.length" class="count-badge">{{ favorites.length }}</span>
        </RouterLink>

        <RouterLink
          :to="{ name: 'cart' }"
          class="icon-btn border-0 bg-transparent"
          :aria-label="`Giỏ hàng, ${cartCount} sản phẩm`"
        >
          <Icon name="bag" :size="20" />
          <motion.span
            v-if="cartCount > 0"
            class="count-badge"
            :initial="{ scale: 0 }"
            :animate="{ scale: 1 }"
            :transition="{ type: 'spring', stiffness: 420, damping: 22 }"
          >
            {{ cartCount }}
          </motion.span>
        </RouterLink>

        <div v-if="isAuthenticated" class="relative hidden md:block" data-account-menu>
          <button
            type="button"
            class="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full transition-opacity hover:opacity-70"
            :aria-expanded="accountOpen"
            aria-haspopup="menu"
            @click="accountOpen = !accountOpen"
          >
            <img
              v-if="user"
              :src="user.avatar"
              :alt="`Ảnh đại diện của ${user.name}`"
              class="w-8 h-8 rounded-full object-cover"
            />
            <span v-else class="w-8 h-8 rounded-full skeleton" />
            <Icon name="chevronDown" :size="15" />
          </button>

          <AnimatePresence>
            <motion.div
              v-if="accountOpen"
              role="menu"
              class="absolute right-0 mt-2 w-60 p-2 glass-strong"
              style="border-radius: var(--r-md); z-index: var(--z-nav); border: 1px solid var(--line)"
              :initial="{ opacity: 0, y: -6, scale: 0.97 }"
              :animate="{ opacity: 1, y: 0, scale: 1 }"
              :exit="{ opacity: 0, y: -6, scale: 0.97 }"
              :transition="{ duration: 0.18 }"
            >
              <div v-if="user" class="px-3 py-2.5 mb-1" style="border-bottom: 1px solid var(--line)">
                <div class="text-[13px] font-semibold truncate">{{ user.name }}</div>
                <div class="flex items-center gap-2 mt-1">
                  <span class="mono text-[11px]" style="color: var(--text-2)">
                    {{ user.points.toLocaleString('vi-VN') }} điểm
                  </span>
                  <span style="color: var(--text-3)">·</span>
                  <span class="text-[11px]" style="color: var(--text-3)">{{ levelLabels[user.level] }}</span>
                </div>
              </div>
              <RouterLink
                :to="{ name: 'profile' }"
                role="menuitem"
                class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-colors hover:bg-[var(--accent-soft)]"
              >
                <Icon name="user" :size="17" />
                Hồ sơ của tôi
              </RouterLink>
              <RouterLink
                :to="{ name: 'equipment' }"
                role="menuitem"
                class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-colors hover:bg-[var(--accent-soft)]"
              >
                <Icon name="racket" :size="17" />
                Trang bị
              </RouterLink>
              <RouterLink
                :to="{ name: 'favorites' }"
                role="menuitem"
                class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-colors hover:bg-[var(--accent-soft)]"
              >
                <Icon name="heart" :size="17" />
                Yêu thích
              </RouterLink>
              <button
                type="button"
                role="menuitem"
                class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] text-left transition-colors hover:bg-[var(--accent-soft)]"
                style="color: #ef4444"
                @click="onLogout"
              >
                <Icon name="logout" :size="17" />
                Đăng xuất
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </header>

    <AnimatePresence>
      <motion.div
        v-if="menuOpen"
        key="user-backdrop"
        class="fixed inset-0 md:hidden modal-backdrop"
        style="z-index: var(--z-drawer)"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        @click="menuOpen = false"
      />
      <motion.aside
        v-if="menuOpen"
        key="user-drawer"
        class="fixed inset-y-0 right-0 w-[min(320px,90vw)] flex flex-col md:hidden"
        style="z-index: var(--z-drawer); background: var(--bg-1); border-left: 1px solid var(--line); box-shadow: var(--shadow-lg)"
        :initial="{ x: '100%' }"
        :animate="{ x: 0 }"
        :exit="{ x: '100%' }"
        :transition="{ type: 'spring', stiffness: 380, damping: 36 }"
      >
        <div class="p-5 flex items-start justify-between gap-3" style="border-bottom: 1px solid var(--line)">
          <div v-if="user" class="flex items-center gap-3 min-w-0">
            <img
              :src="user.avatar"
              :alt="`Ảnh đại diện của ${user.name}`"
              class="w-12 h-12 rounded-2xl object-cover shrink-0"
              :style="{ border: `2px solid ${levelColors[user.level]}55` }"
            />
            <div class="min-w-0">
              <div class="font-heading font-bold text-sm truncate">{{ user.name }}</div>
              <div class="mono text-xs" style="color: var(--accent)">
                {{ user.points.toLocaleString('vi-VN') }} điểm
              </div>
            </div>
          </div>
          <div v-else class="min-w-0">
            <div class="font-heading font-bold text-sm">Chào bạn</div>
            <div class="text-xs mt-1" style="color: var(--text-3)">Đăng nhập để đặt sân và mua hàng</div>
          </div>
          <button
            type="button"
            class="icon-btn shrink-0"
            aria-label="Đóng menu"
            @click="menuOpen = false"
          >
            <Icon name="close" :size="18" />
          </button>
        </div>

        <nav class="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Điều hướng di động">
          <RouterLink
            v-for="item in navItems"
            :key="item.name"
            :to="{ name: item.name }"
            class="drawer-link w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl"
          >
            <Icon :name="item.icon" :size="19" />
            <span class="flex-1 text-sm">{{ item.label }}</span>
            <span v-if="badgeCount(item.name) > 0" class="mono text-xs">{{ badgeCount(item.name) }}</span>
          </RouterLink>
        </nav>

        <div class="p-3 pb-[max(12px,env(safe-area-inset-bottom))]" style="border-top: 1px solid var(--line)">
          <button
            v-if="isAuthenticated"
            type="button"
            class="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl btn-ghost text-sm"
            @click="onLogout"
          >
            <Icon name="logout" :size="17" />
            Đăng xuất
          </button>
          <RouterLink
            v-else
            :to="{ name: 'login', query: { redirect: route.fullPath } }"
            class="btn-primary w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl text-sm"
            @click="menuOpen = false"
          >
            Đăng nhập
          </RouterLink>
        </div>
      </motion.aside>
    </AnimatePresence>

    <main id="main" class="pb-28 md:pb-0">
      <RouterView v-slot="{ Component, route: current }">
        <AnimatePresence mode="wait">
          <motion.div
            :key="current.path"
            :initial="{ opacity: 0, y: 14 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -8 }"
            :transition="{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }"
          >
            <component :is="Component" v-if="current.meta.fullBleed" />
            <div v-else class="shell py-9 sm:py-14">
              <component :is="Component" />
            </div>
          </motion.div>
        </AnimatePresence>
      </RouterView>
    </main>

    <footer class="site-footer">
      <div class="shell site-footer__grid">
        <nav aria-label="Mua sắm">
          <h2>Mua sắm</h2>
          <ul>
            <li><RouterLink :to="{ name: 'courts' }">Đặt sân</RouterLink></li>
            <li><RouterLink :to="{ name: 'shop' }">Cửa hàng</RouterLink></li>
            <li><RouterLink :to="{ name: 'favorites' }">Yêu thích</RouterLink></li>
            <li><RouterLink :to="{ name: 'cart' }">Giỏ hàng</RouterLink></li>
          </ul>
        </nav>
        <nav aria-label="Tài khoản">
          <h2>Tài khoản</h2>
          <ul>
            <li>
              <RouterLink
                :to="isAuthenticated ? { name: 'profile' } : { name: 'login' }"
              >
                {{ isAuthenticated ? 'Hồ sơ' : 'Đăng nhập' }}
              </RouterLink>
            </li>
            <li><RouterLink :to="{ name: 'equipment' }">Trang bị</RouterLink></li>
            <li><a href="#main">Đơn hàng</a></li>
          </ul>
        </nav>
        <nav aria-label="Hỗ trợ">
          <h2>Hỗ trợ</h2>
          <ul>
            <li><a href="#main">Liên hệ</a></li>
            <li><a href="#main">Đổi trả</a></li>
            <li><a href="#main">Chính sách</a></li>
            <li><a href="#main">Điều khoản</a></li>
          </ul>
        </nav>
        <div>
          <h2>JBadminton</h2>
          <p>
            Đặt sân theo giờ tại Hà Nội và mua trang bị chính hãng — một nơi.
          </p>
          <p class="site-footer__phone">024 7109 4482 · 6:00–22:30</p>
        </div>
      </div>
      <div class="shell site-footer__legal">
        <span>© {{ year }} JBadminton, Inc. All Rights Reserved</span>
        <span>Số 27 Trần Thái Tông, Cầu Giấy, Hà Nội</span>
      </div>
    </footer>

    <nav
      class="md:hidden fixed bottom-0 inset-x-0 bottom-nav-blur pb-safe"
      style="z-index: var(--z-sticky)"
      aria-label="Điều hướng dưới"
    >
      <div class="flex px-1.5 pt-2">
        <RouterLink
          v-for="item in bottomNavItems"
          :key="item.name"
          :to="{ name: item.name }"
          class="bottom-link relative flex flex-col items-center justify-center gap-1.5 py-2 rounded-2xl min-h-[54px] flex-1"
        >
          <Icon :name="item.icon" :size="20" />
          <span class="text-[10.5px] font-semibold leading-none">{{ item.label }}</span>
          <span
            v-if="badgeCount(item.name) > 0"
            class="absolute top-1 right-[22%] min-w-[16px] h-4 px-1 rounded-full mono text-[9.5px] font-bold flex items-center justify-center"
            style="background: var(--accent); color: #0a1200"
          >
            {{ badgeCount(item.name) }}
          </span>
        </RouterLink>
      </div>
    </nav>

    <AnimatePresence>
      <BookingModal v-if="bookingCourt" :court="bookingCourt" @close="closeBooking" />
    </AnimatePresence>
  </div>
</template>
