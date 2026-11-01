<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { social, socialError } from '../../api/social'
import { useSocialRealtime } from '../../composables/useSocialRealtime'
import '../../styles/social.css'
const items = ref([]),
  before = ref(null),
  error = ref(''),
  loading = ref(false)
const labels = {
  friend_request: 'đã gửi lời mời kết bạn',
  friend_accepted: 'đã chấp nhận kết bạn',
  reaction: 'đã thả cảm xúc vào bài viết',
  comment: 'đã bình luận bài viết',
  tag: 'đã gắn thẻ bạn trong bài viết',
}
let disposed = false
async function load(append = false) {
  loading.value = true
  try {
    const data = await social.get('/notifications', {
      before: append ? before.value : undefined,
    })
    if (disposed) return
    items.value = append ? [...items.value, ...data.data] : data.data
    before.value = data.next_before
  } catch (e) {
    error.value = socialError(e)
  } finally {
    loading.value = false
  }
}
async function read(n) {
  try {
    await social.put(`/notifications/${n.id}/read`)
    n.read_at = new Date().toISOString()
  } catch (e) {
    error.value = socialError(e)
  }
}
const unsub = useSocialRealtime().subscribe((e) => {
  if (e.type === 'resync' || e.type === 'NotificationChanged') load()
})
onMounted(load)
onBeforeUnmount(() => {
  disposed = true
  unsub()
})
</script>
<template>
  <div class="shell py-8 max-w-3xl">
    <header class="flex justify-between gap-3 mb-6">
      <h1 class="text-3xl font-bold">Thông báo</h1>
      <button
        class="btn-text text-sm"
        @click="
          ($event) => {
            social
              .put('/notifications/read')
              .then(() => load())
              .catch((e) => (error = socialError(e)))
          }
        "
      >
        Đánh dấu tất cả đã đọc
      </button>
    </header>
    <p v-if="error" role="alert" class="text-sm text-red-400 mb-4">
      {{ error }}
    </p>
    <section class="surface p-3">
      <article
        v-for="n in items"
        :key="n.id"
        class="p-4 rounded-xl"
        :class="!n.read_at ? 'bg-[var(--bg-2)]' : ''"
      >
        <RouterLink
          :to="
            ['reaction', 'comment', 'tag'].includes(n.type)
              ? `/posts/${n.subject_id}`
              : `/users/${n.actor.id}`
          "
          @click="read(n)"
          ><strong>{{ n.actor.name }}</strong>
          {{ labels[n.type] || 'đã tương tác với bạn' }}
          <p class="text-xs mt-2 text-[var(--text-3)]">
            {{ new Date(n.created_at).toLocaleString('vi-VN') }}
          </p></RouterLink
        >
      </article>
      <p v-if="loading" class="p-5 text-sm">Đang tải…</p>
      <p v-else-if="!items.length" class="p-5 text-sm text-[var(--text-3)]">
        Chưa có thông báo.
      </p>
      <button v-if="before" class="btn-text p-4" @click="load(true)">
        Xem thêm
      </button>
    </section>
  </div>
</template>
