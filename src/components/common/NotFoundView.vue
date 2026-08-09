<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { motion } from 'motion-v'
import Icon from './Icon.vue'
import { useAuth } from '../../composables/useAuth'

const route = useRoute()
const { isAuthenticated, isAdmin } = useAuth()

const homeTarget = computed(() => {
  if (!isAuthenticated.value) return { name: 'login' }
  return isAdmin.value ? { name: 'admin-dashboard' } : { name: 'courts' }
})

const suggestions = computed(() => {
  if (!isAuthenticated.value) return []
  if (isAdmin.value) {
    return [
      { to: { name: 'admin-dashboard' }, label: 'Tổng quan' },
      { to: { name: 'admin-courts' }, label: 'Quản lý sân' },
      { to: { name: 'admin-products' }, label: 'Sản phẩm' },
    ]
  }
  return [
    { to: { name: 'courts' }, label: 'Đặt sân' },
    { to: { name: 'shop' }, label: 'Cửa hàng' },
    { to: { name: 'cart' }, label: 'Giỏ hàng' },
  ]
})
</script>

<template>
  <main class="min-h-[100dvh] mesh-bg grain flex items-center justify-center px-6 py-16">
    <motion.div
      class="w-full max-w-lg text-center"
      :initial="{ opacity: 0, y: 18 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }"
    >
      <span
        class="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center float"
        style="background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent-line)"
      >
        <Icon name="shuttlecock" :size="30" />
      </span>

      <p class="mono mt-7 text-[13px]" style="color: var(--text-3)">Lỗi 404</p>
      <h1 class="page-title mt-2">Cầu bay ra ngoài sân</h1>
      <p class="lede mx-auto mt-4">
        Đường dẫn <span class="mono" style="color: var(--text-2)">{{ route.fullPath }}</span>
        không tồn tại hoặc đã được đổi tên.
      </p>

      <RouterLink
        :to="homeTarget"
        class="btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-[15px] mt-8"
      >
        <Icon name="arrowLeft" :size="17" />
        Quay lại trang chính
      </RouterLink>

      <nav v-if="suggestions.length" class="mt-9" aria-label="Trang gợi ý">
        <p class="text-[11px] uppercase tracking-[0.14em]" style="color: var(--text-3)">
          Hoặc thử
        </p>
        <ul class="flex flex-wrap justify-center gap-2 mt-3.5">
          <li v-for="item in suggestions" :key="item.label">
            <RouterLink :to="item.to" class="chip">{{ item.label }}</RouterLink>
          </li>
        </ul>
      </nav>
    </motion.div>
  </main>
</template>
