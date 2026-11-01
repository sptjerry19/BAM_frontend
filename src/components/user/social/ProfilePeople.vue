<script setup>
import { ref, watch } from 'vue'
import { social, socialError } from '../../../api/social'
const props = defineProps({ profile: Object })
const type = ref('friends'),
  search = ref(''),
  items = ref([]),
  page = ref(1),
  more = ref(false),
  loading = ref(false),
  error = ref('')
let version = 0
async function load(reset = true) {
  const current = ++version
  if (reset) {
    page.value = 1
    items.value = []
  }
  loading.value = true
  error.value = ''
  try {
    const data = await social.get(
      type.value === 'search'
        ? '/people'
        : `/profiles/${props.profile.id}/people/${type.value}`,
      { search: search.value || undefined, page: page.value },
    )
    if (current === version) {
      items.value.push(...data.data)
      more.value = data.has_more
    }
  } catch (e) {
    if (current === version) error.value = socialError(e)
  } finally {
    if (current === version) loading.value = false
  }
}
watch(
  () => [props.profile.id, type.value],
  () => load(),
  { immediate: true },
)
async function accept(id) {
  try {
    await social.post(`/profiles/${id}/relationship`, { action: 'accept' })
    await load()
  } catch (e) {
    error.value = socialError(e)
  }
}
</script>
<template>
  <section class="surface p-5">
    <h2 class="text-xl font-bold mb-4">Kết nối</h2>
    <div class="flex flex-wrap gap-2 mb-4">
      <button
        v-for="(label, key) in {
          friends: 'Bạn bè',
          mutual: 'Bạn chung',
          followers: 'Người theo dõi',
          following: 'Đang theo dõi',
          ...(profile.is_owner
            ? { requests: 'Lời mời', search: 'Tìm người' }
            : {}),
        }"
        :key="key"
        :class="type === key ? 'btn-primary' : 'btn-ghost'"
        class="px-3 py-2 rounded-lg text-sm"
        @click="type = key"
      >
        {{ label }}
      </button>
    </div>
    <form class="flex gap-2 mb-5" @submit.prevent="load()">
      <input
        v-model="search"
        class="social-input"
        placeholder="Tìm theo tên…"
        aria-label="Tìm người"
      /><button class="btn-ghost px-4 rounded-lg" :disabled="loading">
        Tìm
      </button>
    </form>
    <p v-if="error" role="alert" class="text-red-400 text-sm">
      {{ error }} <button class="underline" @click="load()">Thử lại</button>
    </p>
    <div class="grid sm:grid-cols-2 gap-4">
      <article
        v-for="person in items"
        :key="person.id"
        class="flex items-center gap-3 py-3"
      >
        <RouterLink :to="`/users/${person.id}`"
          ><img
            v-if="person.avatar"
            :src="person.avatar"
            :alt="person.name"
            class="w-14 h-14 rounded-full object-cover"
          /><span v-else class="social-avatar">{{
            person.name.slice(0, 1)
          }}</span></RouterLink
        >
        <div>
          <RouterLink :to="`/users/${person.id}`" class="font-semibold">{{
            person.name
          }}</RouterLink
          ><button
            v-if="type === 'requests'"
            class="block btn-text text-sm mt-2"
            @click="accept(person.id)"
          >
            Chấp nhận
          </button>
        </div>
      </article>
    </div>
    <p v-if="loading" class="py-4 text-sm">Đang tải…</p>
    <p
      v-else-if="!items.length && !error"
      class="py-4 text-sm text-[var(--text-3)]"
    >
      Chưa có kết nối phù hợp.
    </p>
    <button
      v-if="more"
      class="btn-text mt-4"
      :disabled="loading"
      @click="
        ($event) => {
          page++
          load(false)
        }
      "
    >
      Xem thêm
    </button>
  </section>
</template>
