<script setup>
import { ref, onMounted, watch } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import AdminApp from './components/admin/AdminApp.vue'
import UserApp from './components/user/UserApp.vue'
import LoginView from './components/auth/LoginView.vue'
import RegisterView from './components/auth/RegisterView.vue'
import ForgotPasswordView from './components/auth/ForgotPasswordView.vue'
import { useAuth } from './composables/useAuth'

const { bootstrap, bootstrapped, isAuthenticated, isAdmin, logout, user } = useAuth()

const authPage = ref('login')

onMounted(() => {
  bootstrap()
})

watch(isAuthenticated, (ok) => {
  if (!ok) authPage.value = 'login'
})

function onGoto(page) {
  authPage.value = page
}

async function onLogout() {
  await logout()
  authPage.value = 'login'
}
</script>

<template>
  <div v-if="!bootstrapped" class="min-h-[100dvh] flex items-center justify-center" style="background: #070b14">
    <div class="text-sm" style="color: #64748b">Đang tải...</div>
  </div>

  <AnimatePresence v-else mode="wait">
    <motion.div
      v-if="isAuthenticated && isAdmin"
      key="admin"
      class="h-screen"
      :initial="{ opacity: 0, scale: 0.98 }"
      :animate="{ opacity: 1, scale: 1 }"
      :exit="{ opacity: 0, scale: 0.98 }"
      :transition="{ duration: 0.28 }"
    >
      <AdminApp :auth-user="user" @logout="onLogout" />
    </motion.div>

    <motion.div
      v-else-if="isAuthenticated"
      key="user"
      class="h-screen"
      :initial="{ opacity: 0, scale: 0.98 }"
      :animate="{ opacity: 1, scale: 1 }"
      :exit="{ opacity: 0, scale: 0.98 }"
      :transition="{ duration: 0.28 }"
    >
      <UserApp :auth-user="user" @logout="onLogout" />
    </motion.div>

    <motion.div
      v-else
      :key="authPage"
      :initial="{ opacity: 0, y: 12 }"
      :animate="{ opacity: 1, y: 0 }"
      :exit="{ opacity: 0, y: -8 }"
      :transition="{ duration: 0.28 }"
    >
      <LoginView v-if="authPage === 'login'" @goto="onGoto" />
      <RegisterView v-else-if="authPage === 'register'" @goto="onGoto" />
      <ForgotPasswordView v-else @goto="onGoto" />
    </motion.div>
  </AnimatePresence>
</template>
