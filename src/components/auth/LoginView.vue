<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { motion } from 'motion-v'
import AuthShell from './AuthShell.vue'
import FormField from '../common/FormField.vue'
import { useAuth } from '../../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { login, loading, apiErrorMessage } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')

async function onSubmit() {
  error.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = 'Vui lòng nhập email và mật khẩu'
    return
  }
  try {
    const account = await login(email.value.trim(), password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    if (redirect) router.replace(redirect)
    else router.replace({ name: account?.role === 'admin' ? 'admin-dashboard' : 'courts' })
  } catch (err) {
    error.value = apiErrorMessage(err, 'Đăng nhập thất bại')
  }
}
</script>

<template>
  <AuthShell title="Đăng nhập" subtitle="Chào mừng trở lại câu lạc bộ">
    <form class="space-y-4" @submit.prevent="onSubmit">
      <FormField v-model="email" label="Email" type="email" placeholder="you@email.com" />
      <FormField v-model="password" label="Mật khẩu" type="password" placeholder="••••••••" />

      <div class="flex justify-end">
        <RouterLink
          :to="{ name: 'forgot-password' }"
          class="text-xs font-semibold"
          style="color: #84cc16"
        >
          Quên mật khẩu?
        </RouterLink>
      </div>

      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

      <motion.button
        type="submit"
        class="btn-primary w-full py-3 rounded-xl text-sm font-bold min-h-[48px] disabled:opacity-50"
        :disabled="loading"
        :whileTap="{ scale: 0.98 }"
      >
        {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
      </motion.button>
    </form>

    <p class="text-center text-sm mt-5" style="color: #64748b">
      Chưa có tài khoản?
      <RouterLink :to="{ name: 'register' }" class="font-semibold ml-1" style="color: #84cc16">
        Đăng ký
      </RouterLink>
    </p>

    <div
      class="mt-5 rounded-xl p-3 text-xs space-y-1"
      style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); color: #64748b"
    >
      <div class="font-semibold mb-1" style="color: #94a3b8">Tài khoản demo</div>
      <div>Admin: <span class="mono" style="color: #84cc16">admin@badminton.local</span> / password123</div>
      <div>User: <span class="mono" style="color: #84cc16">nvan.an@gmail.com</span> / password123</div>
    </div>
  </AuthShell>
</template>
