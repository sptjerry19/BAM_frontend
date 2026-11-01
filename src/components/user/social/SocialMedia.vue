<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { social, socialError } from '../../../api/social'
const props = defineProps({
  asset: Object,
  alt: { type: String, default: 'Ảnh chia sẻ' },
  autoplay: Boolean,
})
const emit = defineEmits(['open', 'play', 'ended', 'progress'])
const current = ref(props.asset),
  error = ref(''),
  busy = ref(false),
  video = ref(null)
let attempts = 0,
  disposed = false,
  position = 0
watch(
  () => props.asset,
  (value) => {
    current.value = value
    attempts = 0
    error.value = ''
  },
)
async function refresh(automatic = false) {
  if (busy.value || (automatic && attempts >= 1)) return
  attempts++
  busy.value = true
  error.value = ''
  position = video.value?.currentTime || 0
  try {
    const data = await social.get(`/social-media/${props.asset.id}/access`)
    if (!disposed) current.value = data
  } catch (e) {
    if (!disposed) error.value = socialError(e)
  } finally {
    busy.value = false
  }
}
async function retry() {
  busy.value = true
  try {
    await social.post(`/social-media/${props.asset.id}/retry`)
    busy.value = false
    await refresh()
  } catch (e) {
    error.value = socialError(e)
  } finally {
    busy.value = false
  }
}
onBeforeUnmount(() => {
  disposed = true
})
</script>
<template>
  <div class="min-w-0">
    <div
      v-if="current.status !== 'ready'"
      class="p-6 text-sm text-[var(--text-3)]"
    >
      <p>
        {{
          current.status === 'processing'
            ? 'Video đang được xử lý…'
            : 'Không xử lý được video. Kiểm tra định dạng và thời lượng.'
        }}
      </p>
      <button class="btn-text mt-3 mr-3" :disabled="busy" @click="refresh()">
        Làm mới</button
      ><button
        v-if="current.can_manage && current.status === 'failed'"
        class="btn-text mt-3"
        :disabled="busy"
        @click="retry"
      >
        Thử xử lý lại
      </button>
    </div>
    <video
      v-else-if="current.mime.startsWith('video/')"
      ref="video"
      :src="current.url"
      :poster="current.poster"
      controls
      :autoplay="autoplay"
      preload="metadata"
      class="w-full max-h-[70dvh] rounded-lg"
      @error="refresh(true)"
      @loadedmetadata="position && (video.currentTime = position)"
      @play="emit('play')"
      @timeupdate="
        video?.duration &&
        emit(
          'progress',
          Math.min(100, (video.currentTime / video.duration) * 100),
        )
      "
      @ended="emit('ended')"
    /><button v-else class="w-full" @click="emit('open')">
      <img
        :src="current.url"
        :alt="alt"
        loading="lazy"
        class="w-full max-h-[70dvh] object-contain rounded-lg"
        @error="refresh(true)"
      />
    </button>
    <p v-if="error" class="p-3 text-xs text-red-400" role="alert">
      {{ error }} <button class="underline" @click="refresh()">Thử lại</button>
    </p>
  </div>
</template>
