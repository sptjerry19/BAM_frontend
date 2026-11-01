<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { social, socialError, setSocialGuestPreview } from '../../api/social'
import { levelLabels, formatCurrency } from '../../utils/labels'
import ProfileEquipment from './social/ProfileEquipment.vue'
import ProfileEditor from './social/ProfileEditor.vue'
import PostComposer from './social/PostComposer.vue'
import PostCard from './social/PostCard.vue'
import ProfilePeople from './social/ProfilePeople.vue'
import ProfileMedia from './social/ProfileMedia.vue'
import ProfileStories from './social/ProfileStories.vue'
import ProfileActivity from './social/ProfileActivity.vue'
import '../../styles/social.css'

const route = useRoute(),
  router = useRouter()
const { user: authUser, isAuthenticated } = useAuth()
const profile = ref(null),
  posts = ref([]),
  cursor = ref(null),
  loading = ref(false),
  postsLoading = ref(false),
  error = ref(''),
  postError = ref(''),
  busy = ref(false),
  editing = ref(false),
  search = ref(''),
  saved = ref(false),
  tagged = ref(false),
  reportOpen = ref(false),
  reason = ref('')
let version = 0,
  postVersion = 0
const guestPreview = ref(false)
const tabs = computed(() => ({
  posts: 'Bài viết',
  about: 'Giới thiệu',
  equipment: 'Trang bị',
  friends: 'Bạn bè',
  photos: 'Ảnh',
  video: 'Video',
  stats: 'Thành tích',
  ...(profile.value?.is_owner ? { activity: 'Nhật ký' } : {}),
}))
const tab = computed(() =>
  Object.hasOwn(tabs.value, route.query.tab) ? route.query.tab : 'posts',
)
const winRate = computed(() =>
  profile.value?.matches
    ? Math.round((profile.value.wins / profile.value.matches) * 100)
    : 0,
)
const friendship = computed(() => profile.value?.friendship)
function chooseTab(next) {
  router.replace({ query: { ...route.query, tab: next } })
}
async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  editing.value = false
  profile.value = null
  posts.value = []
  guestPreview.value = false
  try {
    const path =
      route.name === 'athlete-profile'
        ? `/member-profiles/${route.params.id}`
        : `/profiles/${route.params.id || authUser.value?.id}`
    const data = await social.get(path)
    if (current !== version) return
    profile.value = data
    await loadPosts()
  } catch (e) {
    if (current === version) error.value = socialError(e)
  } finally {
    if (current === version) loading.value = false
  }
}
async function loadPosts(append = false) {
  if (!profile.value?.id) return
  const current = ++postVersion
  const id = profile.value.id
  postsLoading.value = true
  postError.value = ''
  try {
    let data
    if (tagged.value) data = await social.get(`/profiles/${id}/tagged`)
    else
      data = await social.get(
        saved.value ? '/me/saved-posts' : `/profiles/${id}/posts`,
        {
          cursor: append ? cursor.value : undefined,
          search: search.value || undefined,
          as_guest: guestPreview.value ? 1 : undefined,
        },
      )
    if (current !== postVersion || id !== profile.value?.id) return
    posts.value = append
      ? [
          ...posts.value,
          ...data.data.filter((p) => !posts.value.some((x) => x.id === p.id)),
        ]
      : data.data
    cursor.value = data.next_cursor || null
  } catch (e) {
    if (current === postVersion) postError.value = socialError(e)
  } finally {
    if (current === postVersion) postsLoading.value = false
  }
}
async function refreshProfile() {
  try {
    profile.value = await social.get(`/profiles/${profile.value.id}`)
  } catch (e) {
    error.value = socialError(e)
  }
}
async function relationship(action) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    profile.value = await social.post(
      `/profiles/${profile.value.id}/relationship`,
      { action },
    )
    await loadPosts()
  } catch (e) {
    error.value = socialError(e)
  } finally {
    busy.value = false
  }
}
async function message() {
  busy.value = true
  try {
    const c = await social.post('/conversations', { user_id: profile.value.id })
    router.push({ name: 'messages', query: { conversation: c.id } })
  } catch (e) {
    error.value = socialError(e)
  } finally {
    busy.value = false
  }
}
async function preview() {
  guestPreview.value = !guestPreview.value
  try {
    profile.value = await social.get(`/profiles/${profile.value.id}`, {
      as_guest: guestPreview.value ? 1 : undefined,
    })
    await loadPosts()
  } catch (e) {
    error.value = socialError(e)
  }
}
async function report() {
  busy.value = true
  try {
    await social.post('/reports', {
      subject_type: 'user',
      subject_id: profile.value.id,
      reason: reason.value,
    })
    reportOpen.value = false
    reason.value = ''
  } catch (e) {
    error.value = socialError(e)
  } finally {
    busy.value = false
  }
}
watch(
  () => [route.params.id, route.name, authUser.value?.id],
  () => {
    saved.value = false
    tagged.value = false
    load()
  },
  { immediate: true },
)
watch([saved, tagged], () => loadPosts())
watch(guestPreview, (value) => setSocialGuestPreview(value), { flush: 'sync' })
onBeforeUnmount(() => {
  ++version
  ++postVersion
  setSocialGuestPreview(false)
})
</script>
<template>
  <div v-if="loading" class="shell py-10" aria-live="polite">
    <div class="skeleton h-64 rounded-2xl" />
    <div class="skeleton h-20 mt-6 rounded-xl" />
    <p class="mt-4 text-sm">Đang tải hồ sơ…</p>
  </div>
  <div v-else-if="!profile" class="shell py-16">
    <h1 class="text-2xl font-bold">Không thể mở hồ sơ</h1>
    <p class="mt-3 text-[var(--text-3)]">
      {{ error || 'Hồ sơ không tồn tại hoặc bạn không có quyền xem.' }}
    </p>
    <button class="btn-primary px-5 py-3 rounded-xl mt-5" @click="load">
      Thử lại
    </button>
  </div>
  <div v-else class="pb-12">
    <div v-if="guestPreview" class="shell py-3 flex justify-between text-sm">
      <p>Đang xem hồ sơ như khách.</p>
      <button class="btn-text" @click="preview">Quay lại trang của tôi</button>
    </div>
    <div class="social-cover">
      <img
        v-if="profile.cover"
        :src="profile.cover"
        :alt="`Ảnh bìa của ${profile.name}`"
        :style="{ objectPosition: `center ${profile.cover_position ?? 50}%` }"
      />
      <div v-else class="h-full flex items-end p-6 sm:p-10">
        <span class="text-sm font-semibold tracking-widest opacity-60"
          >JBADMINTON / HỒ SƠ THÀNH VIÊN</span
        >
      </div>
    </div>
    <div class="shell">
      <header
        class="relative -mt-14 sm:-mt-20 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6"
      >
        <img
          v-if="profile.avatar"
          :src="profile.avatar"
          :alt="profile.name"
          class="social-profile-avatar"
        />
        <div
          v-else
          class="social-profile-avatar grid place-items-center text-5xl font-bold bg-[var(--bg-2)]"
        >
          {{ profile.name.slice(0, 1) }}
        </div>
        <div class="flex-1 min-w-0 pb-2">
          <h1
            class="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight break-words"
          >
            {{ profile.name }}
          </h1>
          <p v-if="profile.username" class="text-sm mt-2 text-[var(--text-3)]">
            @{{ profile.username }}
          </p>
          <p class="mt-2 text-sm text-[var(--text-2)]">
            {{ levelLabels[profile.level] || 'Thành viên' }} ·
            {{ Number(profile.points || 0).toLocaleString('vi-VN') }} điểm
          </p>
          <p
            v-if="profile.friend_count != null"
            class="mt-2 text-sm text-[var(--text-3)]"
          >
            {{ profile.friend_count }} bạn bè ·
            {{ profile.follower_count }} người theo dõi
          </p>
        </div>
        <div class="flex flex-wrap gap-2 pb-2">
          <template v-if="profile.is_owner"
            ><button
              class="btn-primary px-4 py-2.5 rounded-xl text-sm font-semibold"
              @click="editing = !editing"
            >
              Chỉnh sửa hồ sơ</button
            ><button
              class="btn-ghost px-4 py-2.5 rounded-xl text-sm"
              @click="preview"
            >
              Xem như khách</button
            ><RouterLink
              to="/messages"
              class="btn-ghost px-4 py-2.5 rounded-xl text-sm"
              >Tin nhắn</RouterLink
            ></template
          >
          <template v-else-if="profile.id && isAuthenticated && !guestPreview"
            ><button
              v-if="profile.blocked_by_me"
              class="btn-ghost px-4 py-2.5 rounded-xl text-sm"
              :disabled="busy"
              @click="relationship('unblock')"
            >
              Bỏ chặn</button
            ><template v-else>
              <button
                v-if="!friendship"
                class="btn-primary px-4 py-2.5 rounded-xl text-sm"
                :disabled="busy"
                @click="relationship('request')"
              >
                Kết bạn</button
              ><button
                v-else-if="friendship.status === 'accepted'"
                class="btn-ghost px-4 py-2.5 rounded-xl text-sm"
                :disabled="busy"
                @click="relationship('unfriend')"
              >
                Bạn bè · Hủy kết bạn</button
              ><template v-else-if="friendship.requested_by === authUser.id"
                ><button
                  class="btn-ghost px-4 py-2.5 rounded-xl text-sm"
                  :disabled="busy"
                  @click="relationship('cancel')"
                >
                  Đã gửi lời mời · Thu hồi
                </button></template
              ><template v-else
                ><button
                  class="btn-primary px-4 py-2.5 rounded-xl text-sm"
                  :disabled="busy"
                  @click="relationship('accept')"
                >
                  Chấp nhận</button
                ><button
                  class="btn-ghost px-4 py-2.5 rounded-xl text-sm"
                  :disabled="busy"
                  @click="relationship('reject')"
                >
                  Từ chối
                </button></template
              >
              <button
                class="btn-ghost px-4 py-2.5 rounded-xl text-sm"
                :disabled="busy"
                @click="relationship(profile.following ? 'unfollow' : 'follow')"
              >
                {{ profile.following ? 'Bỏ theo dõi' : 'Theo dõi' }}</button
              ><button
                class="btn-ghost px-4 py-2.5 rounded-xl text-sm"
                :disabled="busy"
                @click="message"
              >
                Nhắn tin
              </button>
              <details class="relative">
                <summary
                  class="btn-ghost px-4 py-2.5 rounded-xl cursor-pointer"
                  aria-label="Thêm tùy chọn"
                >
                  •••
                </summary>
                <div class="surface absolute right-0 z-20 w-40 p-2">
                  <button
                    class="social-menu"
                    :disabled="busy"
                    @click="relationship('block')"
                  >
                    Chặn</button
                  ><button class="social-menu" @click="reportOpen = true">
                    Báo cáo
                  </button>
                </div>
              </details>
            </template></template
          >
        </div>
      </header>
      <p v-if="error" role="alert" class="text-red-400 text-sm mt-5">
        {{ error }}
      </p>
      <ProfileEditor
        v-if="editing && profile.is_owner"
        class="mt-6"
        :profile="profile"
        @saved="refreshProfile"
        @close="editing = false"
      />
      <nav
        class="mt-6 flex gap-1 overflow-x-auto border-b border-[var(--line)]"
        aria-label="Mục hồ sơ"
      >
        <button
          v-for="(label, id) in tabs"
          :key="id"
          class="px-4 py-4 text-sm font-semibold whitespace-nowrap border-b-2"
          :class="
            tab === id
              ? 'border-[var(--accent)] text-[var(--accent)]'
              : 'border-transparent text-[var(--text-3)]'
          "
          :aria-current="tab === id ? 'page' : undefined"
          @click="chooseTab(id)"
        >
          {{ label }}
        </button>
      </nav>
      <div
        class="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-5 mt-5 items-start"
      >
        <aside class="space-y-5">
          <section class="surface p-5">
            <h2 class="text-xl font-bold">Giới thiệu</h2>
            <p
              v-if="profile.bio"
              class="mt-3 text-sm whitespace-pre-wrap break-words leading-relaxed"
            >
              {{ profile.bio }}
            </p>
            <dl class="mt-4 space-y-3 text-sm">
              <div v-if="profile.city">
                <dt class="text-[var(--text-3)]">Sống tại</dt>
                <dd>{{ profile.city }}</dd>
              </div>
              <div v-if="profile.club">
                <dt class="text-[var(--text-3)]">Câu lạc bộ</dt>
                <dd>{{ profile.club }}</dd>
              </div>
              <div v-if="profile.join_date">
                <dt class="text-[var(--text-3)]">Tham gia</dt>
                <dd>
                  {{ new Date(profile.join_date).toLocaleDateString('vi-VN') }}
                </dd>
              </div>
            </dl>
            <button class="btn-text mt-4 text-sm" @click="chooseTab('about')">
              Xem thông tin giới thiệu
            </button>
          </section>
          <ProfileEquipment
            v-if="tab !== 'equipment'"
            :key="`${profile.id}-${profile.can_view_equipment}`"
            :profile="profile"
            preview
            @open="chooseTab('equipment')"
          />
        </aside>
        <main class="min-w-0 space-y-5">
          <template v-if="tab === 'posts'">
            <ProfileStories
              v-if="profile.id"
              :key="profile.id"
              :profile="profile"
              :read-only="guestPreview"
            />
            <PostComposer v-if="profile.is_owner" @posted="loadPosts()" />
            <div v-if="profile.id" class="flex flex-wrap gap-3 items-center">
              <h2 class="text-xl font-bold mr-auto">Bài viết</h2>
              <button
                class="text-sm btn-text"
                @click="
                  ($event) => {
                    tagged = !tagged
                    saved = false
                  }
                "
              >
                {{ tagged ? 'Tất cả bài' : 'Được gắn thẻ' }}</button
              ><button
                v-if="profile.is_owner"
                class="text-sm btn-text"
                @click="
                  ($event) => {
                    saved = !saved
                    tagged = false
                  }
                "
              >
                {{ saved ? 'Bài trên hồ sơ' : 'Đã lưu' }}
              </button>
            </div>
            <form
              v-if="profile.id && !tagged"
              class="flex gap-2"
              @submit.prevent="loadPosts()"
            >
              <input
                v-model="search"
                class="social-input"
                placeholder="Tìm trong bài viết…"
                aria-label="Tìm bài viết"
              /><button
                class="btn-ghost px-4 rounded-xl"
                :disabled="postsLoading"
              >
                Tìm
              </button>
            </form>
            <p v-if="postError" class="text-red-400 text-sm" role="alert">
              {{ postError }}
              <button class="underline" @click="loadPosts()">Thử lại</button>
            </p>
            <PostCard
              v-for="p in posts"
              :key="p.id"
              :post="p"
              :read-only="guestPreview"
              @changed="loadPosts()"
            />
            <p
              v-if="postsLoading"
              class="surface p-6 text-sm"
              aria-live="polite"
            >
              Đang tải bài viết…
            </p>
            <p
              v-else-if="!posts.length && !postError"
              class="surface p-6 text-sm text-[var(--text-3)]"
            >
              Chưa có bài viết để hiển thị.
            </p>
            <button
              v-if="cursor"
              class="btn-ghost w-full py-3 rounded-xl"
              :disabled="postsLoading"
              @click="loadPosts(true)"
            >
              Xem thêm bài viết
            </button>
          </template>
          <section v-else-if="tab === 'about'" class="surface p-6">
            <h2 class="font-bold text-xl mb-5">Thông tin cá nhân</h2>
            <dl class="grid sm:grid-cols-2 gap-6">
              <template
                v-for="(label, key) in {
                  bio: 'Tiểu sử',
                  city: 'Thành phố',
                  work: 'Công việc',
                  education: 'Học vấn',
                  interests: 'Sở thích',
                  handed: 'Tay thuận',
                  playing_style: 'Lối chơi',
                  club: 'Câu lạc bộ',
                  email: 'Email',
                  phone: 'Điện thoại',
                }"
                :key="key"
                ><div v-if="profile[key]">
                  <dt class="text-sm text-[var(--text-3)]">{{ label }}</dt>
                  <dd class="mt-2 text-sm whitespace-pre-wrap break-words">
                    {{
                      key === 'handed'
                        ? { left: 'Trái', right: 'Phải', both: 'Cả hai' }[
                            profile[key]
                          ]
                        : profile[key]
                    }}
                  </dd>
                </div></template
              >
              <div v-if="profile.website">
                <dt class="text-sm text-[var(--text-3)]">Liên kết</dt>
                <dd class="mt-2 break-all">
                  <a
                    :href="profile.website"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn-text"
                    >{{ profile.website }}</a
                  >
                </dd>
              </div>
            </dl>
          </section>
          <ProfileEquipment
            v-else-if="tab === 'equipment'"
            :profile="profile"
          />
          <ProfilePeople
            v-else-if="tab === 'friends' && profile.id"
            :profile="profile"
          />
          <ProfileMedia
            v-else-if="['photos', 'video'].includes(tab) && profile.id"
            :profile="profile"
            :type="tab === 'video' ? 'video' : 'image'"
          />
          <ProfileActivity v-else-if="tab === 'activity' && profile.is_owner" />
          <section v-else-if="tab === 'stats'" class="surface p-6">
            <h2 class="text-xl font-bold mb-5">Thành tích cầu lông</h2>
            <dl class="grid grid-cols-2 gap-6">
              <div
                v-for="(value, label) in {
                  'Số trận': profile.matches || 0,
                  'Trận thắng': profile.wins || 0,
                  'Tỷ lệ thắng': `${winRate}%`,
                  'Điểm tích lũy': profile.points || 0,
                }"
                :key="label"
              >
                <dt class="text-sm text-[var(--text-3)]">{{ label }}</dt>
                <dd class="text-2xl font-semibold tabular-nums mt-2">
                  {{ value }}
                </dd>
              </div>
              <div v-if="profile.is_owner">
                <dt class="text-sm text-[var(--text-3)]">Chi tiêu của tôi</dt>
                <dd class="text-xl font-semibold mt-2">
                  {{ formatCurrency(profile.total_cost || 0) }}
                </dd>
              </div>
            </dl>
          </section>
          <p v-else class="surface p-6 text-sm text-[var(--text-3)]">
            Chưa có nội dung để hiển thị.
          </p>
        </main>
      </div>
    </div>
    <div
      v-if="reportOpen"
      class="social-overlay"
      @click.self="reportOpen = false"
    >
      <form class="social-dialog space-y-4" @submit.prevent="report">
        <h2 class="text-xl font-bold">Báo cáo tài khoản</h2>
        <textarea
          v-model="reason"
          class="social-input"
          required
          maxlength="2000"
          aria-label="Lý do báo cáo"
          placeholder="Mô tả lý do…"
        />
        <div class="flex gap-4">
          <button class="btn-primary px-4 py-2 rounded-xl" :disabled="busy">
            Gửi báo cáo</button
          ><button type="button" @click="reportOpen = false">Hủy</button>
        </div>
      </form>
    </div>
  </div>
</template>
