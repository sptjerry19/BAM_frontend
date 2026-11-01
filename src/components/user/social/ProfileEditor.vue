<script setup>
import { ref } from 'vue'
import { social, socialError, uploadSocialMedia } from '../../../api/social'
import { useAuth } from '../../../composables/useAuth'
import { getMe } from '../../../api'
const props = defineProps({ profile: Object })
const emit = defineEmits(['saved', 'close'])
const { replaceUser } = useAuth()
const fields = {
  name: 'Họ tên',
  username: 'Tên người dùng',
  bio: 'Tiểu sử',
  city: 'Thành phố',
  work: 'Công việc',
  education: 'Học vấn',
  website: 'Liên kết',
  interests: 'Sở thích',
  handed: 'Tay thuận',
  playing_style: 'Lối chơi',
  club: 'Câu lạc bộ',
}
const form = ref(
  Object.fromEntries(
    Object.keys(fields).map((k) => [k, props.profile[k] || '']),
  ),
)
const privacy = ref(
  Object.fromEntries(
    ['about', 'email', 'phone', 'equipment', 'friends'].map((k) => [
      k,
      props.profile.privacy?.[k] ||
        (['email', 'phone'].includes(k) ? 'only_me' : 'public'),
    ]),
  ),
)
const privacyLabels = {
  about: 'Thông tin giới thiệu',
  email: 'Email',
  phone: 'Điện thoại',
  equipment: 'Trang bị',
  friends: 'Danh sách bạn bè',
}
const coverPosition = ref(props.profile.cover_position ?? 50),
  busy = ref(false),
  error = ref('')
async function save() {
  busy.value = true
  error.value = ''
  try {
    await social.patch('/me/profile', {
      ...form.value,
      cover_position: Number(coverPosition.value),
    })
    await social.patch('/me/privacy', privacy.value)
    replaceUser(await getMe())
    emit('saved')
  } catch (e) {
    error.value = socialError(e)
  } finally {
    busy.value = false
  }
}
async function image(event, purpose) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  busy.value = true
  error.value = ''
  try {
    await uploadSocialMedia(file, purpose)
    replaceUser(await getMe())
    emit('saved')
  } catch (e) {
    error.value = socialError(e)
  } finally {
    busy.value = false
  }
}
async function remove(purpose) {
  busy.value = true
  try {
    await social.delete(`/me/profile-image/${purpose}`)
    replaceUser(await getMe())
    emit('saved')
  } catch (e) {
    error.value = socialError(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <section class="surface p-5 sm:p-7">
    <header class="flex justify-between gap-4 mb-5">
      <h2 class="font-heading font-bold text-xl">Chỉnh sửa hồ sơ</h2>
      <button class="btn-text" @click="emit('close')">Đóng</button>
    </header>
    <div class="flex flex-wrap gap-3 mb-5">
      <template
        v-for="(label, purpose) in { avatar: 'Ảnh đại diện', cover: 'Ảnh bìa' }"
        :key="purpose"
        ><label class="btn-ghost px-3 py-2 rounded-xl text-sm cursor-pointer"
          >Đổi {{ label.toLowerCase()
          }}<input
            class="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            :disabled="busy"
            @change="image($event, purpose)" /></label
        ><button
          class="text-sm btn-text"
          :disabled="busy"
          @click="remove(purpose)"
        >
          Xóa {{ label.toLowerCase() }}
        </button></template
      >
    </div>
    <form class="space-y-5" @submit.prevent="save">
      <div class="grid sm:grid-cols-2 gap-4">
        <label v-for="(label, key) in fields" :key="key" class="text-sm"
          >{{ label
          }}<select
            v-if="key === 'handed'"
            v-model="form[key]"
            class="social-input mt-2"
          >
            <option value="">Chưa chọn</option>
            <option value="left">Trái</option>
            <option value="right">Phải</option>
            <option value="both">Cả hai</option></select
          ><textarea
            v-else-if="key === 'bio'"
            v-model="form[key]"
            class="social-input mt-2"
            maxlength="500" /><input
            v-else
            v-model="form[key]"
            class="social-input mt-2"
            :type="key === 'website' ? 'url' : 'text'"
            :required="key === 'name'"
            :maxlength="key === 'username' ? 50 : 255"
        /></label>
      </div>
      <label class="text-sm block"
        >Vị trí ảnh bìa: {{ coverPosition }}%<input
          v-model="coverPosition"
          type="range"
          min="0"
          max="100"
          class="w-full mt-2"
      /></label>
      <fieldset class="border-t border-[var(--line)] pt-5">
        <legend class="font-semibold">Ai được xem?</legend>
        <div class="grid sm:grid-cols-2 gap-4 mt-3">
          <label
            v-for="(label, key) in privacyLabels"
            :key="key"
            class="text-sm"
            >{{ label
            }}<select v-model="privacy[key]" class="social-input mt-2">
              <option value="public">Công khai</option>
              <option value="friends">Bạn bè</option>
              <option value="only_me">Chỉ mình tôi</option>
            </select></label
          >
        </div>
      </fieldset>
      <p v-if="error" role="alert" class="text-sm text-red-400">{{ error }}</p>
      <div class="flex flex-wrap items-center gap-4">
        <button class="btn-primary px-5 py-3 rounded-xl" :disabled="busy">
          {{ busy ? 'Đang lưu…' : 'Lưu thay đổi' }}</button
        ><RouterLink to="/settings/account" class="btn-text text-sm"
          >Email, điện thoại và mật khẩu</RouterLink
        >
      </div>
    </form>
  </section>
</template>
