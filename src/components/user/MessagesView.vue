<script setup>
import { ref, watch, onBeforeUnmount, onMounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useSocialRealtime } from '../../composables/useSocialRealtime'
import { social, socialError, uploadSocialMedia } from '../../api/social'
import '../../styles/social.css'
import SocialMedia from './social/SocialMedia.vue'
const route = useRoute(),
  router = useRouter(),
  { user } = useAuth(),
  { status, connectionError, reconnect, subscribe } = useSocialRealtime()
const connectionMessage = computed(
  () =>
    connectionError.value ||
    {
      connected: 'Đã kết nối realtime',
      connecting: 'Đang kết nối realtime…',
      authorizing: 'Đang xác thực kênh tin nhắn…',
      unconfigured: 'Realtime chưa được cấu hình',
      disconnected: 'Realtime chưa kết nối.',
      unavailable: 'Mất kết nối realtime. Bạn có thể thử kết nối lại.',
      failed: 'Không thể kết nối realtime.',
      unauthorized: 'Không thể xác thực kênh tin nhắn.',
    }[status.value] ||
    'Realtime chưa kết nối.',
)
const conversations = ref([]),
  messages = ref([]),
  current = ref(null),
  body = ref(''),
  error = ref(''),
  busy = ref(false),
  loading = ref(false),
  more = ref(false),
  listMore = ref(false),
  listPage = ref(1),
  file = ref(null),
  imagePreview = ref(''),
  scrollbox = ref(null),
  pending = ref(null)
let generation = 0,
  syncing = false,
  needsSync = false,
  disposed = false
const seen = new Set()
async function list(append = false) {
  try {
    const data = await social.get('/conversations', {
      page: append ? listPage.value : 1,
    })
    if (disposed) return
    conversations.value = append
      ? [...conversations.value, ...data.data]
      : data.data
    listMore.value = data.has_more
    if (!append) listPage.value = 1
  } catch (e) {
    error.value = socialError(e)
  }
}
function merge(rows) {
  const map = new Map(messages.value.map((m) => [m.id, m]))
  for (const m of rows) map.set(m.id, m)
  messages.value = [...map.values()].sort((a, b) => a.id - b.id)
}
async function markRead() {
  const last = messages.value.at(-1)?.id
  if (
    document.visibilityState === 'visible' &&
    current.value &&
    last &&
    last > current.value.my_read_id
  ) {
    await social.put(`/conversations/${current.value.id}/read`, {
      message_id: last,
    })
    current.value.my_read_id = last
  }
}
async function open(id) {
  const version = ++generation
  messages.value = []
  current.value = null
  pending.value = null
  loading.value = true
  error.value = ''
  try {
    const data = await social.get(`/conversations/${id}/messages`)
    if (version !== generation || disposed) return
    current.value = data.conversation
    messages.value = data.data
    more.value = data.has_more
    await markRead()
    await nextTick()
    if (scrollbox.value)
      scrollbox.value.scrollTop = scrollbox.value.scrollHeight
  } catch (e) {
    if (version === generation) error.value = socialError(e)
  } finally {
    if (version === generation) loading.value = false
  }
}
async function sync() {
  if (!current.value) return
  if (syncing) {
    needsSync = true
    return
  }
  syncing = true
  const version = generation,
    id = current.value.id
  try {
    let moreRows = true
    while (moreRows && version === generation && !disposed) {
      const data = await social.get(`/conversations/${id}/messages`, {
        after: messages.value.at(-1)?.id || 0,
      })
      if (version !== generation || disposed) break
      merge(data.data)
      current.value = data.conversation
      moreRows = data.has_more
      if (!data.data.length) break
    }
    if (version === generation) {
      await markRead()
      await nextTick()
      if (scrollbox.value)
        scrollbox.value.scrollTop = scrollbox.value.scrollHeight
    }
  } catch (e) {
    if (version === generation) error.value = socialError(e)
  } finally {
    syncing = false
    if (needsSync) {
      needsSync = false
      sync()
    }
  }
}
async function older() {
  if (!current.value) return
  const version = generation
  try {
    const data = await social.get(
      `/conversations/${current.value.id}/messages`,
      { before: messages.value[0]?.id },
    )
    if (version !== generation) return
    merge(data.data)
    more.value = data.has_more
  } catch (e) {
    error.value = socialError(e)
  }
}
function pick(event) {
  const f = event.target.files?.[0]
  event.target.value = ''
  if (!f) return
  if (f.size > 5 * 1024 * 1024) {
    error.value = 'Ảnh tối đa 5 MB.'
    return
  }
  removeFile()
  file.value = f
  imagePreview.value = URL.createObjectURL(f)
}
function removeFile() {
  if (imagePreview.value) URL.revokeObjectURL(imagePreview.value)
  file.value = null
  imagePreview.value = ''
}
async function send() {
  if (busy.value || !current.value) return
  busy.value = true
  error.value = ''
  const id = current.value.id,
    version = generation
  try {
    if (!pending.value) {
      let media = []
      if (file.value)
        media = [(await uploadSocialMedia(file.value, 'message')).id]
      pending.value = {
        body: body.value,
        client_message_id: crypto.randomUUID(),
        media_ids: media,
      }
    }
    await social.post(`/conversations/${id}/messages`, pending.value)
    if (version !== generation) return
    pending.value = null
    body.value = ''
    removeFile()
    await sync()
    await list()
  } catch (e) {
    error.value = socialError(e)
  } finally {
    busy.value = false
  }
}
async function accept() {
  try {
    await social.put(`/conversations/${current.value.id}/accept`)
    await sync()
    await list()
  } catch (e) {
    error.value = socialError(e)
  }
}
const unsubscribe = subscribe((event) => {
  if (disposed) return
  if (event.event_id) {
    if (seen.has(event.event_id)) return
    seen.add(event.event_id)
    if (seen.size > 1000) seen.clear()
  }
  // Read receipts only move cursors; avoid refetching the entire thread for each receipt.
  if (event.type === 'MessageRead' && event.reader_id) {
    if (event.conversation_id === current.value?.id) {
      const field =
        event.reader_id === user.value.id ? 'my_read_id' : 'peer_read_id'
      current.value[field] = Math.max(
        current.value[field] || 0,
        event.message_id,
      )
    }
    if (event.reader_id === user.value.id) list()
    return
  }
  if (event.type === 'resync') {
    list()
    sync()
  } else if (
    ['MessageSent', 'MessageRead', 'ConversationChanged'].includes(event.type)
  ) {
    list()
    if (event.conversation_id === current.value?.id) sync()
  }
})
function foreground() {
  if (document.visibilityState === 'visible') {
    list()
    sync()
  }
}
onMounted(() => {
  list()
  document.addEventListener('visibilitychange', foreground)
})
watch(
  () => route.query.conversation,
  (id) => {
    if (id && /^\d+$/.test(String(id))) open(Number(id))
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  disposed = true
  ++generation
  unsubscribe()
  removeFile()
  document.removeEventListener('visibilitychange', foreground)
})
</script>
<template>
  <div class="shell py-8">
    <header class="flex flex-wrap justify-between gap-3 mb-5">
      <div>
        <h1 class="font-heading text-3xl font-bold">Tin nhắn</h1>
        <p class="text-sm mt-2 text-[var(--text-3)]" aria-live="polite">
          {{ connectionMessage }}
        </p>
        <button
          v-if="
            ![
              'connected',
              'connecting',
              'authorizing',
              'unconfigured',
            ].includes(status)
          "
          class="btn-text text-sm mt-2"
          @click="reconnect"
        >
          Thử kết nối lại
        </button>
      </div>
      <button
        class="btn-ghost px-4 py-2 rounded-xl text-sm"
        @click="
          ($event) => {
            list()
            sync()
          }
        "
      >
        Làm mới
      </button>
    </header>
    <p v-if="error" role="alert" class="text-red-400 mb-4 text-sm">
      {{ error }}
    </p>
    <div class="grid md:grid-cols-[280px_minmax(0,1fr)] gap-5 items-start">
      <aside class="surface p-3 max-h-[70dvh] overflow-auto">
        <h2 class="font-semibold p-3">Hội thoại</h2>
        <button
          v-for="c in conversations"
          :key="c.id"
          class="flex w-full gap-3 items-center text-left p-3 rounded-xl"
          :class="current?.id === c.id ? 'bg-[var(--bg-2)]' : ''"
          @click="router.replace({ query: { conversation: c.id } })"
        >
          <img
            v-if="c.peer.avatar"
            :src="c.peer.avatar"
            :alt="c.peer.name"
            class="w-10 h-10 rounded-full object-cover"
          /><span v-else class="social-avatar">{{
            c.peer.name.slice(0, 1)
          }}</span
          ><span class="min-w-0 flex-1"
            ><span class="font-semibold text-sm block truncate">{{
              c.peer.name
            }}</span
            ><span class="text-xs text-[var(--text-3)]">{{
              c.blocked
                ? 'Đã chặn'
                : c.status === 'pending'
                  ? 'Tin nhắn chờ'
                  : 'Hội thoại riêng'
            }}</span></span
          ><span
            v-if="c.unread"
            class="text-xs bg-[var(--accent)] text-black rounded-full px-2 py-1"
            >{{ c.unread }}</span
          >
        </button>
        <p
          v-if="!conversations.length"
          class="p-3 text-sm text-[var(--text-3)]"
        >
          Mở trang cá nhân một người và chọn Nhắn tin để bắt đầu.
        </p>
        <button
          v-if="listMore"
          class="btn-text p-3 text-sm"
          @click="
            ($event) => {
              listPage++
              list(true)
            }
          "
        >
          Xem thêm hội thoại
        </button>
      </aside>
      <section class="surface overflow-hidden">
        <p v-if="loading" class="p-8">Đang tải hội thoại…</p>
        <template v-else-if="current"
          ><header class="p-5 border-b border-[var(--line)]">
            <RouterLink :to="`/users/${current.peer.id}`" class="font-bold">{{
              current.peer.name
            }}</RouterLink>
            <p v-if="current.blocked" class="text-sm mt-2 text-[var(--text-3)]">
              Không thể gửi tin vì một trong hai người đã chặn người còn lại.
            </p>
            <div v-else-if="current.status === 'pending'" class="text-sm mt-3">
              <template v-if="current.requested_by !== user.id"
                ><p>Người này muốn nhắn tin với bạn.</p>
                <button
                  class="btn-primary px-3 py-2 rounded-lg mt-2"
                  @click="accept"
                >
                  Chấp nhận tin nhắn
                </button></template
              >
              <p v-else>Đang chờ chấp nhận. Bạn có thể gửi một tin đầu tiên.</p>
            </div>
          </header>
          <div
            ref="scrollbox"
            class="p-5 h-[48dvh] overflow-auto space-y-4"
            aria-live="polite"
          >
            <button
              v-if="more"
              class="btn-text block mx-auto text-sm"
              @click="older"
            >
              Tin nhắn cũ hơn
            </button>
            <article
              v-for="m in messages"
              :key="m.id"
              class="flex"
              :class="m.user_id === user.id ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[85%] rounded-2xl p-3 bg-[var(--bg-2)]"
                :class="
                  m.user_id === user.id ? 'border border-[var(--line)]' : ''
                "
              >
                <p class="text-sm whitespace-pre-wrap break-words">
                  {{ m.body }}
                </p>
                <SocialMedia
                  v-for="asset in m.media || []"
                  :key="asset.id"
                  :asset="asset"
                  alt="Ảnh trong hội thoại"
                />
                <p class="text-[10px] mt-2 text-[var(--text-3)]">
                  {{
                    new Date(m.created_at).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  }}<span v-if="m.user_id === user.id">
                    ·
                    {{
                      current.peer_read_id >= m.id ? 'Đã đọc' : 'Đã gửi'
                    }}</span
                  >
                </p>
              </div>
            </article>
            <p
              v-if="!messages.length"
              class="text-sm text-center text-[var(--text-3)] py-10"
            >
              Chưa có tin nhắn.
            </p>
          </div>
          <form
            v-if="
              !current.blocked &&
              (current.status === 'accepted' ||
                current.requested_by === user.id)
            "
            class="p-4 border-t border-[var(--line)]"
            @submit.prevent="send"
          >
            <div v-if="imagePreview" class="mb-3 flex gap-3 items-start">
              <img
                :src="imagePreview"
                alt="Ảnh đính kèm"
                class="w-20 h-20 object-cover rounded-lg"
              /><button
                type="button"
                :disabled="busy || !!pending"
                @click="removeFile"
              >
                Bỏ ảnh
              </button>
            </div>
            <label class="sr-only" for="chat-body">Nội dung tin nhắn</label
            ><textarea
              id="chat-body"
              v-model="body"
              class="social-input"
              maxlength="5000"
              placeholder="Viết tin nhắn…"
              :disabled="busy || !!pending"
            />
            <div class="flex items-center gap-3 mt-3">
              <label
                class="btn-ghost px-3 py-2 rounded-lg text-sm cursor-pointer"
                >Gửi ảnh<input
                  type="file"
                  class="sr-only"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  :disabled="busy || !!pending"
                  @change="pick" /></label
              ><button
                class="btn-primary px-4 py-2 rounded-lg ml-auto"
                :disabled="busy || (!pending && !body.trim() && !file)"
              >
                {{ busy ? 'Đang gửi…' : pending ? 'Thử gửi lại' : 'Gửi' }}
              </button>
            </div>
            <p
              v-if="pending && !busy"
              class="text-xs mt-2 text-[var(--text-3)]"
            >
              Tin chưa xác nhận. Thử lại dùng cùng mã tin để tránh gửi trùng.
            </p>
          </form>
        </template>
        <p v-else class="p-10 text-sm text-[var(--text-3)]">
          Chọn hội thoại để xem tin nhắn.
        </p>
      </section>
    </div>
  </div>
</template>
