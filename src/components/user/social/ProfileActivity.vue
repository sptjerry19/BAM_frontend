<script setup>
import { ref, onMounted } from 'vue'
import { social, socialError } from '../../../api/social'
const posts = ref([]),
  tags = ref([]),
  page = ref(1),
  more = ref(false),
  error = ref(''),
  busy = ref(false)
async function load() {
  busy.value = true
  error.value = ''
  try {
    const data = await social.get('/me/activity', { page: page.value })
    posts.value = data.posts.data
    more.value = !!data.posts.next_page_url
    tags.value = [
      ...data.tags.map((t) => ({ ...t, photo: false })),
      ...data.photo_tags.map((t) => ({ ...t, photo: true })),
    ]
  } catch (e) {
    error.value = socialError(e)
  } finally {
    busy.value = false
  }
}
async function restore(id) {
  try {
    await social.put(`/posts/${id}/restore`)
    await load()
  } catch (e) {
    error.value = socialError(e)
  }
}
async function review(id, status, photo = false) {
  try {
    await social.patch(photo ? `/photo-tags/${id}` : `/tags/${id}`, { status })
    await load()
  } catch (e) {
    error.value = socialError(e)
  }
}
onMounted(load)
</script>
<template>
  <section class="surface p-5">
    <h2 class="text-xl font-bold mb-4">Nhật ký hoạt động</h2>
    <p class="text-sm text-[var(--text-3)] mb-5">
      Bài trong thùng rác được giữ 30 ngày. Duyệt thẻ không thay đổi quyền xem
      bài gốc.
    </p>
    <p v-if="error" class="text-red-400 text-sm" role="alert">{{ error }}</p>
    <div v-if="tags.length" class="mb-6">
      <h3 class="font-semibold mb-3">Thẻ chờ duyệt</h3>
      <article
        v-for="tag in tags"
        :key="`${tag.photo}-${tag.id}`"
        class="flex flex-wrap gap-3 py-3 border-b border-[var(--line)]"
      >
        <RouterLink :to="`/posts/${tag.post_id}`" class="btn-text"
          >Bài #{{ tag.post_id }}</RouterLink
        ><button class="text-sm" @click="review(tag.id, 'approved', tag.photo)">
          Duyệt</button
        ><button class="text-sm" @click="review(tag.id, 'rejected', tag.photo)">
          Từ chối
        </button>
      </article>
    </div>
    <article
      v-for="p in posts"
      :key="p.id"
      class="py-4 border-b border-[var(--line)]"
    >
      <p class="text-xs text-[var(--text-3)]">
        {{ new Date(p.created_at).toLocaleString('vi-VN') }} ·
        {{ p.deleted_at ? 'Thùng rác' : p.archived_at ? 'Lưu trữ' : 'Đã đăng' }}
      </p>
      <p class="mt-2 whitespace-pre-wrap break-words">
        {{ p.body || 'Bài viết có ảnh' }}
      </p>
      <button
        v-if="p.hidden_from_profile && !p.deleted_at && !p.archived_at"
        class="btn-text text-sm mt-3 mr-4"
        @click="
          social
            .patch(`/posts/${p.id}`, { hidden: false })
            .then(load)
            .catch((e) => (error = socialError(e)))
        "
      >
        Hiện lại trên hồ sơ
      </button>
      <button
        v-if="p.deleted_at || p.archived_at"
        class="btn-text text-sm mt-3"
        @click="restore(p.id)"
      >
        Khôi phục</button
      ><RouterLink
        v-else
        :to="`/posts/${p.id}`"
        class="btn-text text-sm mt-3 inline-block"
        >Xem bài</RouterLink
      >
    </article>
    <p v-if="busy" class="py-4">Đang tải…</p>
    <p v-else-if="!posts.length" class="py-4 text-sm">Chưa có hoạt động.</p>
    <div class="flex justify-between mt-4">
      <button
        :disabled="page === 1 || busy"
        class="btn-text"
        @click="
          ($event) => {
            page--
            load()
          }
        "
      >
        Trước</button
      ><button
        :disabled="!more || busy"
        class="btn-text"
        @click="
          ($event) => {
            page++
            load()
          }
        "
      >
        Sau
      </button>
    </div>
  </section>
</template>
