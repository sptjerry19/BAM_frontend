<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { motion } from 'motion-v'
import AuthShell from './AuthShell.vue'
import FormField from '../common/FormField.vue'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const { forgotPassword, resetPassword, loading, apiErrorMessage } = useAuth()

let redirectTimer = null
onUnmounted(() => clearTimeout(redirectTimer))

const step = ref('request')
const email = ref('')
const token = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const error = ref('')
const success = ref('')

async function onRequest() {
  error.value = ''
  success.value = ''
  if (!email.value.trim()) {
    error.value = 'Vui lòng nhập email'
    return
  }
  try {
    const data = await forgotPassword(email.value.trim())
    token.value = data?.reset_token || ''
    success.value = 'Đã tạo mã đặt lại mật khẩu. Nhập mật khẩu mới bên dưới.'
    step.value = 'reset'
  } catch (err) {
    error.value = apiErrorMessage(err, 'Không thể gửi yêu cầu')
  }
}

async function onReset() {
  error.value = ''
  success.value = ''
  if (!token.value || !password.value) {
    error.value = 'Vui lòng nhập mã và mật khẩu mới'
    return
  }
  if (password.value !== passwordConfirmation.value) {
    error.value = 'Xác nhận mật khẩu không khớp'
    return
  }
  try {
    await resetPassword({
      email: email.value.trim(),
      token: token.value.trim(),
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
    success.value = 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập.'
    redirectTimer = setTimeout(() => router.replace({ name: 'login' }), 1200)
  } catch (err) {
    error.value = apiErrorMessage(err, 'Không thể đặt lại mật khẩu')
  }
}
</script>

<template>
  <AuthShell
    :title="step === 'request' ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'"
    subtitle="Khôi phục quyền truy cập tài khoản"
  >
    <form v-if="step === 'request'" class="space-y-4" @submit.prevent="onRequest">
      <p class="text-sm" style="color: #94a3b8">
        Nhập email đã đăng ký. Hệ thống sẽ tạo mã để bạn đặt mật khẩu mới.
      </p>
      <FormField v-model="email" label="Email" type="email" placeholder="you@email.com" />
      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
      <motion.button
        type="submit"
        class="btn-primary w-full py-3 rounded-xl text-sm font-bold min-h-[48px] disabled:opacity-50"
        :disabled="loading"
        :whileTap="{ scale: 0.98 }"
      >
        {{ loading ? 'Đang xử lý...' : 'Tiếp tục' }}
      </motion.button>
    </form>

    <form v-else class="space-y-4" @submit.prevent="onReset">
      <p v-if="success" class="text-sm" style="color: #84cc16">{{ success }}</p>
      <FormField v-model="email" label="Email" type="email" />
      <FormField v-model="token" label="Mã đặt lại" placeholder="Mã được tạo từ bước trước" />
      <FormField v-model="password" label="Mật khẩu mới" type="password" placeholder="Ít nhất 8 ký tự" />
      <FormField
        v-model="passwordConfirmation"
        label="Xác nhận mật khẩu"
        type="password"
        placeholder="Nhập lại mật khẩu"
      />
      <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
      <motion.button
        type="submit"
        class="btn-primary w-full py-3 rounded-xl text-sm font-bold min-h-[48px] disabled:opacity-50"
        :disabled="loading"
        :whileTap="{ scale: 0.98 }"
      >
        {{ loading ? 'Đang lưu...' : 'Đặt lại mật khẩu' }}
      </motion.button>
    </form>

    <p class="text-center text-sm mt-5" style="color: #64748b">
      <RouterLink :to="{ name: 'login' }" class="font-semibold" style="color: #84cc16">
        ← Quay lại đăng nhập
      </RouterLink>
    </p>
  </AuthShell>
</template>
