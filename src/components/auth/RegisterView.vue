<script setup>
import { ref } from 'vue'
import { motion } from 'motion-v'
import AuthShell from './AuthShell.vue'
import FormField from '../common/FormField.vue'
import { useAuth } from '../../composables/useAuth'

const emit = defineEmits(['goto'])

const { register, loading, apiErrorMessage } = useAuth()

const form = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  password_confirmation: '',
})
const error = ref('')

async function onSubmit() {
  error.value = ''
  if (!form.value.name.trim() || !form.value.email.trim() || !form.value.password) {
    error.value = 'Vui lòng điền đầy đủ thông tin bắt buộc'
    return
  }
  if (form.value.password !== form.value.password_confirmation) {
    error.value = 'Xác nhận mật khẩu không khớp'
    return
  }
  try {
    await register({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      phone: form.value.phone.trim() || null,
      password: form.value.password,
      password_confirmation: form.value.password_confirmation,
    })
  } catch (err) {
    error.value = apiErrorMessage(err, 'Đăng ký thất bại')
  }
}
</script>

<template>
  <AuthShell title="Đăng ký" subtitle="Tạo tài khoản thành viên mới">
    <form class="space-y-4" @submit.prevent="onSubmit">
      <FormField v-model="form.name" label="Họ tên *" placeholder="Nguyễn Văn A" />
      <FormField v-model="form.email" label="Email *" type="email" placeholder="you@email.com" />
      <FormField v-model="form.phone" label="Số điện thoại" placeholder="0901 234 567" />
      <FormField v-model="form.password" label="Mật khẩu *" type="password" placeholder="Ít nhất 8 ký tự" />
      <FormField
        v-model="form.password_confirmation"
        label="Xác nhận mật khẩu *"
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
        {{ loading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản' }}
      </motion.button>
    </form>

    <p class="text-center text-sm mt-5" style="color: #64748b">
      Đã có tài khoản?
      <button type="button" class="font-semibold ml-1" style="color: #84cc16" @click="emit('goto', 'login')">
        Đăng nhập
      </button>
    </p>
  </AuthShell>
</template>
