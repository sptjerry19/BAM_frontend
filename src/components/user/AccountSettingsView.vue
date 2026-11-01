<script setup>
import { ref } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { updateProfile } from '../../api'
import '../../styles/social.css'
const { user, replaceUser, apiErrorMessage } = useAuth()
const form = ref({
    name: user.value?.name || '',
    email: user.value?.email || '',
    phone: user.value?.member?.phone || '',
    current_password: '',
    password: '',
    password_confirmation: '',
  }),
  busy = ref(false),
  error = ref(''),
  notice = ref('')
async function save() {
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    replaceUser(await updateProfile(form.value))
    form.value.current_password = ''
    form.value.password = ''
    form.value.password_confirmation = ''
    notice.value = 'Đã lưu thông tin tài khoản.'
  } catch (e) {
    error.value = apiErrorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="shell max-w-2xl py-8">
    <RouterLink to="/profile" class="btn-text text-sm"
      >Về trang cá nhân</RouterLink
    >
    <h1 class="text-3xl font-bold mt-5 mb-6">Cài đặt tài khoản</h1>
    <form class="surface p-6 space-y-5" @submit.prevent="save">
      <label
        v-for="(label, key) in {
          name: 'Họ tên',
          email: 'Email đăng nhập',
          phone: 'Điện thoại',
          current_password: 'Mật khẩu hiện tại',
          password: 'Mật khẩu mới',
          password_confirmation: 'Xác nhận mật khẩu mới',
        }"
        :key="key"
        class="block text-sm"
        >{{ label
        }}<input
          v-model="form[key]"
          class="social-input mt-2"
          :type="
            key.includes('password')
              ? 'password'
              : key === 'email'
                ? 'email'
                : 'text'
          "
          :required="['name', 'email'].includes(key)"
          :autocomplete="
            key === 'current_password'
              ? 'current-password'
              : key.includes('password')
                ? 'new-password'
                : key
          "
      /></label>
      <p class="text-xs text-[var(--text-3)]">
        Để trống mật khẩu nếu không đổi. Cài đặt quyền xem email/điện thoại nằm
        trong Chỉnh sửa hồ sơ.
      </p>
      <p v-if="error" role="alert" class="text-red-400 text-sm">{{ error }}</p>
      <p v-if="notice" role="status" class="text-[var(--accent)] text-sm">
        {{ notice }}
      </p>
      <button class="btn-primary px-5 py-3 rounded-xl" :disabled="busy">
        {{ busy ? 'Đang lưu…' : 'Lưu thay đổi' }}
      </button>
    </form>
  </div>
</template>
