<script setup>
import { ref, watch, onBeforeUnmount, computed } from 'vue'
import { social, socialError, uploadSocialMedia } from '../../../api/social'
import SocialMedia from './SocialMedia.vue'
import { useAuth } from '../../../composables/useAuth'
const props = defineProps({ profile: Object, readOnly: Boolean })
const editingHighlight = ref(null)
function newHighlight() {
  editingHighlight.value = null
  highlightName.value = ''
  highlightIds.value = []
  archive.value = true
  highlightForm.value = !highlightForm.value
}
function editHighlight(highlight) {
  editingHighlight.value = highlight.id
  highlightName.value = highlight.name
  audience.value = highlight.audience
  highlightIds.value = highlight.stories.map((s) => s.id)
  archive.value = true
  highlightForm.value = true
}
const auth = useAuth()
const isAuthenticated = computed(
  () => auth.isAuthenticated.value && !props.readOnly,
)
const replyText = ref(''),
  replyNotice = ref(''),
  pendingReply = ref(null)
async function reply() {
  busy.value = true
  replyNotice.value = ''
  error.value = ''
  try {
    const conversation = await social.post('/conversations', {
      user_id: props.profile.id,
    })
    if (!pendingReply.value)
      pendingReply.value = {
        body: `Phản hồi tin #${viewing.value[selected.value].id}: ${replyText.value}`,
        client_message_id: crypto.randomUUID(),
      }
    await social.post(
      `/conversations/${conversation.id}/messages`,
      pendingReply.value,
    )
    pendingReply.value = null
    replyText.value = ''
    replyNotice.value = 'Đã gửi phản hồi qua tin nhắn.'
  } catch (e) {
    error.value = socialError(e)
  } finally {
    busy.value = false
  }
}
const stories = ref([]),
  highlights = ref([]),
  archive = ref(false),
  selected = ref(-1),
  viewing = ref([]),
  views = ref(null),
  error = ref(''),
  busy = ref(false),
  showForm = ref(false),
  body = ref(''),
  file = ref(null),
  preview = ref(''),
  audience = ref('public'),
  highlightName = ref(''),
  highlightIds = ref([]),
  highlightForm = ref(false),
  progress = ref(0)
let timer,
  version = 0
async function load() {
  const current = ++version
  try {
    const [s, h] = await Promise.all([
      social.get(`/profiles/${props.profile.id}/stories`, {
        archive: archive.value ? 1 : 0,
      }),
      social.get(`/profiles/${props.profile.id}/highlights`),
    ])
    if (current !== version) return
    stories.value = s
    highlights.value = h
  } catch (e) {
    if (current === version) error.value = socialError(e)
  }
}
watch(() => [props.profile.id, archive.value], load, { immediate: true })
function pick(event) {
  const f = event.target.files?.[0]
  event.target.value = ''
  if (!f) return
  file.value = f
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = URL.createObjectURL(f)
}
async function create() {
  busy.value = true
  error.value = ''
  try {
    const m = await uploadSocialMedia(file.value, 'story')
    await social.post('/stories', {
      body: body.value,
      audience: audience.value,
      media_ids: [m.id],
    })
    showForm.value = false
    body.value = ''
    file.value = null
    URL.revokeObjectURL(preview.value)
    preview.value = ''
    await load()
  } catch (e) {
    error.value = socialError(e)
  } finally {
    busy.value = false
  }
}
function pause() {
  clearInterval(timer)
}
function next() {
  if (selected.value < viewing.value.length - 1)
    open(viewing.value, selected.value + 1)
  else close()
}
function close() {
  clearInterval(timer)
  selected.value = -1
  views.value = null
}
function open(list, index) {
  clearInterval(timer)
  viewing.value = list
  selected.value = index
  views.value = null
  progress.value = 0
  replyText.value = ''
  replyNotice.value = ''
  pendingReply.value = null
  const s = list[index]
  if (!s) return close()
  if (isAuthenticated.value && !s.can_manage)
    social.put(`/stories/${s.id}/view`).catch(() => {})
  timer = setInterval(() => {
    progress.value += 2
    if (progress.value >= 100) {
      if (selected.value < viewing.value.length - 1)
        open(viewing.value, selected.value + 1)
      else close()
    }
  }, 100)
}
async function showViews() {
  clearInterval(timer)
  try {
    views.value = await social.get(
      `/stories/${viewing.value[selected.value].id}/views`,
    )
  } catch (e) {
    error.value = socialError(e)
  }
}
async function saveHighlight() {
  busy.value = true
  try {
    await (editingHighlight.value
      ? social.patch(`/highlights/${editingHighlight.value}`, {
          name: highlightName.value,
          audience: audience.value,
          story_ids: highlightIds.value,
        })
      : social.post('/highlights', {
          name: highlightName.value,
          audience: audience.value,
          story_ids: highlightIds.value,
        }))
    highlightForm.value = false
    editingHighlight.value = null
    highlightIds.value = []
    highlightName.value = ''
    await load()
  } catch (e) {
    error.value = socialError(e)
  } finally {
    busy.value = false
  }
}
onBeforeUnmount(() => {
  clearInterval(timer)
  if (preview.value) URL.revokeObjectURL(preview.value)
})
</script>
<template>
  <section class="surface p-5">
    <header class="flex flex-wrap justify-between gap-3">
      <h2 class="text-xl font-bold">Tin & nổi bật</h2>
      <div v-if="profile.is_owner" class="flex flex-wrap gap-3 text-sm">
        <button class="btn-text" @click="showForm = !showForm">Thêm tin</button
        ><button class="btn-text" @click="archive = !archive">
          {{ archive ? 'Tin hiện tại' : 'Kho lưu trữ' }}</button
        ><button class="btn-text" @click="newHighlight">Tạo nổi bật</button>
      </div>
    </header>
    <form v-if="showForm" class="mt-5 space-y-3" @submit.prevent="create">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        required
        aria-label="Ảnh cho tin"
        @change="pick"
      /><video
        v-if="file?.type.startsWith('video/')"
        :src="preview"
        controls
        class="max-h-48 rounded-lg"
      /><img
        v-else-if="preview"
        :src="preview"
        alt="Xem trước tin"
        class="max-h-48 rounded-lg"
      /><textarea
        v-model="body"
        class="social-input"
        maxlength="500"
        placeholder="Nội dung tin"
        aria-label="Nội dung tin"
      /><select
        v-model="audience"
        class="social-input"
        aria-label="Quyền xem tin"
      >
        <option value="public">Công khai</option>
        <option value="friends">Bạn bè</option>
        <option value="only_me">Chỉ mình tôi</option></select
      ><button
        class="btn-primary px-4 py-2 rounded-lg"
        :disabled="busy || !file"
      >
        {{ busy ? 'Đang đăng…' : 'Đăng tin 24 giờ' }}
      </button>
    </form>
    <form
      v-if="highlightForm"
      class="mt-4 space-y-3"
      @submit.prevent="saveHighlight"
    >
      <input
        v-model="highlightName"
        class="social-input"
        required
        maxlength="100"
        placeholder="Tên nhóm nổi bật"
        aria-label="Tên nhóm nổi bật"
      /><select
        v-model="audience"
        class="social-input"
        aria-label="Quyền xem nổi bật"
      >
        <option value="public">Công khai</option>
        <option value="friends">Bạn bè</option>
        <option value="only_me">Chỉ mình tôi</option>
      </select>
      <p class="text-xs text-[var(--text-3)]">
        Chọn tin từ kho lưu trữ bên dưới. Quyền xem tin gốc vẫn được giữ.
      </p>
      <button
        class="btn-primary px-4 py-2 rounded-lg"
        :disabled="busy || !highlightIds.length"
      >
        {{ editingHighlight ? 'Lưu nhóm' : 'Tạo nhóm' }}
      </button>
    </form>
    <p v-if="error" class="mt-3 text-sm text-red-400" role="alert">
      {{ error }} <button class="underline" @click="load()">Thử lại</button>
    </p>
    <div class="flex gap-3 overflow-x-auto mt-4">
      <article v-for="(s, i) in stories" :key="s.id" class="relative shrink-0">
        <button class="w-28 text-left" @click="open(stories, i)">
          <video
            v-if="s.media[0]?.mime.startsWith('video/')"
            :src="s.media[0].url"
            :poster="s.media[0].poster"
            class="w-28 h-40 rounded-xl object-cover"
            muted
          /><img
            v-else-if="s.media[0]"
            :src="s.media[0].url"
            alt="Tin của chủ hồ sơ"
            class="w-28 h-40 rounded-xl object-cover"
          />
          <p class="mt-2 text-xs truncate">
            {{ s.body || (archive ? 'Tin đã lưu' : 'Xem tin') }}
          </p></button
        ><input
          v-if="highlightForm"
          v-model="highlightIds"
          :value="s.id"
          type="checkbox"
          class="absolute top-2 left-2"
          :aria-label="`Chọn tin ${i + 1}`"
        />
      </article>
    </div>
    <p v-if="!stories.length" class="mt-4 text-sm text-[var(--text-3)]">
      {{ archive ? 'Chưa có tin trong kho lưu trữ.' : 'Chưa có tin mới.' }}
    </p>
    <div class="flex gap-4 overflow-x-auto mt-5">
      <div v-for="h in highlights" :key="h.id" class="shrink-0">
        <button class="text-sm font-semibold" @click="open(h.stories, 0)">
          <img
            v-if="h.stories[0]?.media[0]"
            :src="h.stories[0].media[0].url"
            :alt="h.name"
            class="w-16 h-16 rounded-full object-cover mb-2"
          />{{ h.name }}</button
        ><button
          v-if="profile.is_owner"
          class="block text-xs btn-text mt-1"
          @click="
            ($event) => {
              social
                .delete(`/highlights/${h.id}`)
                .then(load)
                .catch((e) => (error = socialError(e)))
            }
          "
        >
          Xóa nhóm
        </button>
        <button
          v-if="profile.is_owner"
          class="block text-xs btn-text mt-2"
          @click="editHighlight(h)"
        >
          Sửa nhóm
        </button>
      </div>
    </div>
    <div
      v-if="selected >= 0 && viewing[selected]"
      class="social-overlay"
      @click.self="close"
      @keydown.esc="close"
    >
      <section
        class="social-dialog !max-w-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Xem tin"
      >
        <div class="h-1 bg-[var(--bg-2)] mb-4">
          <div
            class="h-1 bg-[var(--accent)]"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <div class="flex justify-between mb-3">
          <button
            :disabled="selected === 0"
            @click="open(viewing, selected - 1)"
          >
            Trước</button
          ><button
            :disabled="selected === viewing.length - 1"
            @click="open(viewing, selected + 1)"
          >
            Sau</button
          ><button @click="close">Đóng</button>
        </div>
        <SocialMedia
          v-if="viewing[selected].media[0]"
          :key="viewing[selected].id"
          :asset="viewing[selected].media[0]"
          alt="Tin của chủ hồ sơ"
          autoplay
          @play="pause"
          @ended="next"
          @progress="progress = $event"
        />
        <p class="mt-3 whitespace-pre-wrap">{{ viewing[selected].body }}</p>
        <div
          v-if="viewing[selected].can_manage"
          class="flex gap-4 text-sm mt-4"
        >
          <button class="btn-text" @click="showViews">Người xem</button
          ><button
            class="btn-text"
            @click="
              ($event) => {
                social
                  .delete(`/stories/${viewing[selected].id}`)
                  .then(() => {
                    close()
                    load()
                  })
                  .catch((e) => (error = socialError(e)))
              }
            "
          >
            Xóa tin
          </button>
        </div>
        <button
          v-else-if="isAuthenticated"
          class="btn-text mt-4 text-sm"
          @click="
            ($event) => {
              social
                .put(`/stories/${viewing[selected].id}/reaction`, {
                  reaction: 'love',
                })
                .catch((e) => (error = socialError(e)))
            }
          "
        >
          Yêu thích
        </button>
        <ul v-if="views" class="mt-4 space-y-2 text-sm">
          <li v-if="!views.length">Chưa có người xem.</li>
          <li v-for="v in views" :key="v.id">
            {{ v.name }} <span v-if="v.reaction">· {{ v.reaction }}</span>
          </li>
        </ul>
        <form
          v-if="isAuthenticated && !viewing[selected].can_manage"
          class="mt-4 space-y-3"
          @focusin="pause"
          @submit.prevent="reply"
        >
          <label class="text-sm block" for="story-reply">Phản hồi riêng</label>
          <textarea
            id="story-reply"
            v-model="replyText"
            class="social-input"
            maxlength="1000"
            :disabled="busy || !!pendingReply"
            placeholder="Viết phản hồi…"
          />
          <button
            class="btn-primary px-4 py-2 rounded-xl text-sm"
            :disabled="busy || (!replyText.trim() && !pendingReply)"
          >
            {{
              busy ? 'Đang gửi…' : pendingReply ? 'Thử gửi lại' : 'Gửi phản hồi'
            }}
          </button>
        </form>
        <p
          v-if="replyNotice"
          class="mt-3 text-sm text-[var(--accent)]"
          role="status"
        >
          {{ replyNotice }}
        </p>
        <p v-if="error" class="mt-3 text-sm text-red-400" role="alert">
          {{ error }}
        </p>
      </section>
    </div>
  </section>
</template>
