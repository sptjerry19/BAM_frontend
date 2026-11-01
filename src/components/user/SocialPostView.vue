<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { social, socialError } from '../../api/social'
import PostCard from './social/PostCard.vue'
import '../../styles/social.css'
const route = useRoute(),
  post = ref(null),
  loading = ref(false),
  error = ref('')
let version = 0
async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  post.value = null
  try {
    const data = await social.get(`/posts/${route.params.id}`)
    if (current === version) post.value = data
  } catch (e) {
    if (current === version) error.value = socialError(e)
  } finally {
    if (current === version) loading.value = false
  }
}
watch(() => route.params.id, load, { immediate: true })
</script>
<template>
  <div class="shell py-8 max-w-3xl">
    <RouterLink to="/profile" class="btn-text text-sm mb-5 inline-block"
      >Về trang cá nhân</RouterLink
    >
    <p v-if="loading" class="surface p-8">Đang tải bài viết…</p>
    <PostCard v-else-if="post" :post="post" @changed="load" />
    <section v-else class="surface p-8">
      <h1 class="text-xl font-bold">Bài viết không khả dụng</h1>
      <p class="mt-3 text-sm text-[var(--text-3)]">{{ error }}</p>
    </section>
  </div>
</template>
