<script setup>
import { ref, onMounted } from 'vue'
import { social, socialError } from '../../api/social'
import '../../styles/social.css'
const items = ref([]),
  page = ref(1),
  more = ref(false),
  error = ref('')
async function load() {
  try {
    const data = await social.get('/social-reports', { page: page.value })
    items.value = data.data
    more.value = !!data.next_page_url
  } catch (e) {
    error.value = socialError(e)
  }
}
async function review(id, status) {
  try {
    await social.patch(`/social-reports/${id}`, { status })
    await load()
  } catch (e) {
    error.value = socialError(e)
  }
}
onMounted(load)
</script>
<template>
  <section class="p-6">
    <h1 class="text-2xl font-bold mb-6">Báo cáo cộng đồng</h1>
    <p v-if="error" class="text-red-400 mb-4">{{ error }}</p>
    <article v-for="r in items" :key="r.id" class="surface p-5 mb-4">
      <header class="flex justify-between">
        <h2 class="font-semibold">{{ r.subject_type }} #{{ r.subject_id }}</h2>
        <span class="text-sm">{{ r.status }}</span>
      </header>
      <p class="mt-3 text-sm whitespace-pre-wrap">{{ r.reason }}</p>
      <p class="mt-2 text-xs text-[var(--text-3)]">
        Người báo cáo #{{ r.user_id }} ·
        {{ new Date(r.created_at).toLocaleString('vi-VN') }}
      </p>
      <div class="flex gap-4 mt-4 text-sm">
        <button class="btn-text" @click="review(r.id, 'reviewed')">
          Đã xem xét</button
        ><button class="btn-text" @click="review(r.id, 'dismissed')">
          Bỏ qua
        </button>
      </div>
    </article>
    <p v-if="!items.length" class="text-sm">Chưa có báo cáo.</p>
    <div class="flex justify-between mt-5">
      <button
        :disabled="page === 1"
        @click="
          ($event) => {
            page--
            load()
          }
        "
      >
        Trước</button
      ><button
        :disabled="!more"
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
