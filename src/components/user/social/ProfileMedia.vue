<script setup>
import { ref, watch } from 'vue'
import SocialMedia from './SocialMedia.vue'
import { social, socialError } from '../../../api/social'
const props = defineProps({
  profile: Object,
  type: { type: String, default: 'image' },
})
const editingAlbum = ref(null)
function newAlbum() {
  editingAlbum.value = null
  name.value = ''
  description.value = ''
  selectedIds.value = []
  formOpen.value = !formOpen.value
}
async function editAlbum() {
  editingAlbum.value = album.value.id
  name.value = album.value.name
  description.value = album.value.description || ''
  audience.value = album.value.audience
  selectedIds.value = photos.value.map((m) => m.id)
  formOpen.value = true
}
const photos = ref([]),
  albums = ref([]),
  page = ref(1),
  more = ref(false),
  loading = ref(false),
  error = ref(''),
  selected = ref(-1),
  album = ref(null),
  formOpen = ref(false),
  name = ref(''),
  description = ref(''),
  audience = ref('public'),
  selectedIds = ref([])
let version = 0
async function load(reset = true) {
  const current = ++version
  loading.value = true
  error.value = ''
  if (reset) {
    page.value = 1
    photos.value = []
    album.value = null
  }
  try {
    const [media, list] = await Promise.all([
      social.get(`/profiles/${props.profile.id}/photos`, {
        page: page.value,
        type: props.type,
      }),
      social.get(`/profiles/${props.profile.id}/albums`),
    ])
    if (current !== version) return
    photos.value.push(...media.data)
    more.value = media.has_more
    albums.value = list
  } catch (e) {
    if (current === version) error.value = socialError(e)
  } finally {
    if (current === version) loading.value = false
  }
}
watch(
  () => [props.profile.id, props.type],
  () => load(),
  { immediate: true },
)
async function openAlbum(item) {
  try {
    const result = await social.get(`/albums/${item.id}`)
    photos.value = result.data
    album.value = item
    more.value = false
  } catch (e) {
    error.value = socialError(e)
  }
}
async function saveAlbum() {
  loading.value = true
  error.value = ''
  try {
    await (editingAlbum.value
      ? social.patch(`/albums/${editingAlbum.value}`, {
          name: name.value,
          description: description.value,
          audience: audience.value,
          media_ids: selectedIds.value,
        })
      : social.post('/albums', {
          name: name.value,
          description: description.value,
          audience: audience.value,
          media_ids: selectedIds.value,
        }))
    formOpen.value = false
    editingAlbum.value = null
    name.value = ''
    description.value = ''
    selectedIds.value = []
    await load()
  } catch (e) {
    error.value = socialError(e)
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <section class="surface p-5">
    <header class="flex justify-between gap-3 mb-4">
      <h2 class="text-xl font-bold">
        {{ album ? album.name : type === 'image' ? 'Ảnh' : 'Video' }}
      </h2>
      <button
        v-if="profile.is_owner && type === 'image'"
        class="btn-text text-sm"
        @click="newAlbum"
      >
        {{ formOpen ? 'Hủy' : 'Tạo album' }}
      </button>
    </header>
    <button
      v-if="album && profile.is_owner && !formOpen"
      class="btn-text text-sm mb-4 mr-4"
      @click="editAlbum"
    >
      Sửa album
    </button>
    <form v-if="formOpen" class="space-y-3 mb-6" @submit.prevent="saveAlbum">
      <input
        v-model="name"
        class="social-input"
        required
        maxlength="255"
        placeholder="Tên album"
        aria-label="Tên album"
      /><textarea
        v-model="description"
        class="social-input"
        maxlength="1000"
        placeholder="Mô tả"
        aria-label="Mô tả album"
      /><select
        v-model="audience"
        class="social-input"
        aria-label="Quyền xem album"
      >
        <option value="public">Công khai</option>
        <option value="friends">Bạn bè</option>
        <option value="only_me">Chỉ mình tôi</option>
      </select>
      <p class="text-xs text-[var(--text-3)]">
        Chọn ảnh đã đăng bên dưới. Quyền xem bài gốc vẫn được giữ.
      </p>
      <button class="btn-primary px-4 py-2 rounded-lg" :disabled="loading">
        {{ editingAlbum ? 'Lưu album' : 'Tạo album' }}
      </button>
    </form>
    <div
      v-if="albums.length && type === 'image'"
      class="flex flex-wrap gap-2 mb-5"
    >
      <button class="btn-ghost px-3 py-2 rounded-lg text-sm" @click="load()">
        Tất cả ảnh</button
      ><button
        v-for="a in albums"
        :key="a.id"
        class="btn-ghost px-3 py-2 rounded-lg text-sm"
        @click="openAlbum(a)"
      >
        {{ a.name }}
      </button>
    </div>
    <button
      v-if="album && profile.is_owner"
      class="btn-text text-sm mb-4"
      @click="
        ($event) => {
          social
            .delete(`/albums/${album.id}`)
            .then(() => load())
            .catch((e) => (error = socialError(e)))
        }
      "
    >
      Xóa album
    </button>
    <p v-if="error" role="alert" class="text-red-400 text-sm mb-4">
      {{ error }} <button class="underline" @click="load()">Thử lại</button>
    </p>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <article v-for="(m, i) in photos" :key="m.id" class="relative">
        <SocialMedia
          :asset="m"
          alt="Media trên hồ sơ"
          @open="selected = i"
        /><label
          v-if="formOpen"
          class="absolute left-2 top-2 bg-[var(--bg)] p-1 rounded"
          ><input
            v-model="selectedIds"
            type="checkbox"
            :value="m.id"
            :aria-label="`Thêm ảnh ${i + 1} vào album`"
        /></label>
      </article>
    </div>
    <p v-if="loading" class="py-5 text-sm">Đang tải…</p>
    <p
      v-else-if="!photos.length && !error"
      class="py-5 text-sm text-[var(--text-3)]"
    >
      Chưa có {{ type === 'image' ? 'ảnh' : 'video' }} để hiển thị.
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
    <div
      v-if="selected >= 0"
      class="social-overlay"
      @click.self="selected = -1"
      @keydown.esc="selected = -1"
    >
      <section
        class="social-dialog !max-w-4xl"
        role="dialog"
        aria-modal="true"
        aria-label="Xem media"
      >
        <div class="flex justify-between mb-3">
          <button :disabled="selected === 0" @click="selected--">Trước</button
          ><span>{{ selected + 1 }}/{{ photos.length }}</span
          ><button
            :disabled="selected === photos.length - 1"
            @click="selected++"
          >
            Sau</button
          ><button @click="selected = -1">Đóng</button>
        </div>
        <SocialMedia
          :key="photos[selected].id"
          :asset="photos[selected]"
          alt="Media trên hồ sơ"
        />
      </section>
    </div>
  </section>
</template>
