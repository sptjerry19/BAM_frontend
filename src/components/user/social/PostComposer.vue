<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { social, socialError, uploadSocialMedia } from '../../../api/social'
import { getCourts } from '../../../api'
const emit = defineEmits(['posted'])
const courtId = ref(''),
  courtSearch = ref(''),
  courts = ref([]),
  courtPicker = ref(false)
async function findCourts() {
  try {
    courts.value = (
      await getCourts({ search: courtSearch.value, per_page: 12 })
    ).data
  } catch (e) {
    error.value = socialError(e)
  }
}
function toggleCourtPicker() {
  courtPicker.value = !courtPicker.value
  if (courtPicker.value) findCourts()
}
const body = ref(''),
  audience = ref('public'),
  images = ref([]),
  busy = ref(false),
  error = ref('')
function pick(event) {
  for (const file of Array.from(event.target.files || [])) {
    if (images.value.length >= 10) break
    const video = file.type.startsWith('video/')
    if (file.size > (video ? 50 : 5) * 1024 * 1024) {
      error.value = 'Ảnh tối đa 5 MB, video tối đa 50 MB và 5 phút.'
      continue
    }
    images.value.push({ file, url: URL.createObjectURL(file), uploaded: null })
  }
  event.target.value = ''
}
function remove(i) {
  URL.revokeObjectURL(images.value[i].url)
  images.value.splice(i, 1)
}
onBeforeUnmount(() => images.value.forEach((x) => URL.revokeObjectURL(x.url)))
async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    for (const item of images.value)
      if (!item.uploaded)
        item.uploaded = await uploadSocialMedia(item.file, 'post')
    await social.post('/posts', {
      body: body.value,
      audience: audience.value,
      media_ids: images.value.map((x) => x.uploaded.id),
      court_id: courtId.value || null,
    })
    body.value = ''
    courtId.value = ''
    courtPicker.value = false
    while (images.value.length) remove(0)
    emit('posted')
  } catch (e) {
    error.value = socialError(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <form class="surface p-5 space-y-4" @submit.prevent="submit">
    <label class="font-semibold block" for="new-post"
      >Chia sẻ với cộng đồng</label
    >
    <textarea
      id="new-post"
      v-model="body"
      class="social-input min-h-28"
      maxlength="10000"
      placeholder="Buổi cầu hôm nay của bạn thế nào?"
      :disabled="busy"
    />
    <div v-if="images.length" class="flex gap-2 overflow-x-auto">
      <div
        v-for="(item, i) in images"
        :key="item.url"
        class="shrink-0 relative"
      >
        <video
          v-if="item.file.type.startsWith('video/')"
          :src="item.url"
          class="w-24 h-24 rounded-lg object-cover"
          muted
        /><img
          v-else
          :src="item.url"
          alt="Ảnh đính kèm"
          class="w-24 h-24 rounded-lg object-cover"
        /><button
          type="button"
          class="absolute top-0 right-0 bg-black/70 text-white px-2 rounded"
          :disabled="busy"
          :aria-label="`Bỏ ảnh ${i + 1}`"
          @click="remove(i)"
        >
          ×
        </button>
      </div>
    </div>
    <div v-if="courtPicker" class="space-y-3">
      <div class="flex gap-2">
        <input
          v-model="courtSearch"
          class="social-input"
          placeholder="Tìm sân để check-in"
          aria-label="Tìm sân"
        /><button
          type="button"
          class="btn-ghost px-3 rounded-lg"
          @click="findCourts"
        >
          Tìm
        </button>
      </div>
      <select v-model="courtId" class="social-input" aria-label="Sân check-in">
        <option value="">Không chọn sân</option>
        <option v-for="court in courts" :key="court.id" :value="court.id">
          {{ court.name }}
        </option>
      </select>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="btn-ghost px-3 py-2 rounded-xl text-sm"
        :disabled="busy"
        @click="toggleCourtPicker"
      >
        Check-in sân
      </button>
      <label class="btn-ghost px-3 py-2 rounded-xl text-sm cursor-pointer"
        >Thêm ảnh/video<input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          multiple
          class="sr-only"
          :disabled="busy"
          @change="pick"
      /></label>
      <select
        v-model="audience"
        aria-label="Ai được xem bài viết"
        class="social-input !w-auto text-sm"
        :disabled="busy"
      >
        <option value="public">Công khai</option>
        <option value="friends">Bạn bè</option>
        <option value="only_me">Chỉ mình tôi</option>
      </select>
      <button
        class="btn-primary px-5 py-2 rounded-xl ml-auto disabled:opacity-50"
        :disabled="busy || (!body.trim() && !images.length && !courtId)"
      >
        {{ busy ? 'Đang đăng…' : 'Đăng bài' }}
      </button>
    </div>
    <p v-if="error" role="alert" class="text-sm text-red-400">{{ error }}</p>
  </form>
</template>
