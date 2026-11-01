<script setup>
import { ref, computed } from 'vue'
import { social, socialError, uploadSocialMedia } from '../../../api/social'
import { useAuth } from '../../../composables/useAuth'
import SocialMedia from './SocialMedia.vue'
const props = defineProps({ post: Object, readOnly: Boolean })
const keepMedia = ref([]),
  newFiles = ref([])
function addFiles(event) {
  const files = Array.from(event.target.files || [])
  newFiles.value.push(
    ...files
      .slice(
        0,
        Math.max(0, 10 - keepMedia.value.length - newFiles.value.length),
      )
      .map((file) => ({ file, uploaded: null })),
  )
  event.target.value = ''
}
const emit = defineEmits(['changed'])
const auth = useAuth()
const isAuthenticated = computed(
  () => auth.isAuthenticated.value && !props.readOnly,
)
const error = ref(''),
  busy = ref(false),
  editing = ref(false),
  draft = ref(''),
  visibility = ref('public'),
  deleting = ref(false)
const comments = ref([]),
  commentsOpen = ref(false),
  comment = ref(''),
  replyTo = ref(null),
  moreComments = ref(false),
  editingComment = ref(null),
  commentDraft = ref('')
const mediaIndex = ref(-1),
  shareOpen = ref(false),
  shareText = ref(''),
  copied = ref(false)
const tagMedia = ref(null),
  reportSubject = ref(null)
const reportOpen = ref(false),
  reason = ref(''),
  tagOpen = ref(false),
  people = ref([]),
  search = ref('')
const labels = {
  public: 'Công khai',
  friends: 'Bạn bè',
  only_me: 'Chỉ mình tôi',
}
const reactions = {
  like: 'Thích',
  love: 'Yêu thích',
  care: 'Thương thương',
  haha: 'Haha',
  wow: 'Wow',
  sad: 'Buồn',
  angry: 'Phẫn nộ',
}
async function act(fn) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await fn()
  } catch (e) {
    error.value = socialError(e)
  } finally {
    busy.value = false
  }
}
function edit() {
  draft.value = props.post.body || ''
  visibility.value = props.post.audience
  editing.value = true
  keepMedia.value = (props.post.media || []).map((m) => m.id)
  newFiles.value = []
}
async function save() {
  await act(async () => {
    for (const item of newFiles.value)
      if (!item.uploaded)
        item.uploaded = await uploadSocialMedia(item.file, 'post')
    await social.patch(`/posts/${props.post.id}`, {
      body: draft.value,
      audience: visibility.value,
      keep_media_ids: keepMedia.value,
      media_ids: newFiles.value.map((f) => f.uploaded.id),
    })
    editing.value = false
    emit('changed')
  })
}
async function react(value) {
  await act(async () => {
    await (value
      ? social.put(`/posts/${props.post.id}/reaction`, { reaction: value })
      : social.delete(`/posts/${props.post.id}/reaction`))
    emit('changed')
  })
}
async function loadComments(reset = true) {
  if (reset) comments.value = []
  const data = await social.get(`/posts/${props.post.id}/comments`, {
    after: reset ? undefined : comments.value.at(-1)?.id,
  })
  comments.value.push(...data.data)
  moreComments.value = data.has_more
  commentsOpen.value = true
}
async function sendComment() {
  await act(async () => {
    await social.post(`/posts/${props.post.id}/comments`, {
      body: comment.value,
      parent_id: replyTo.value?.id,
    })
    comment.value = ''
    replyTo.value = null
    await loadComments()
    emit('changed')
  })
}
async function modifyComment(c, remove = false) {
  await act(async () => {
    if (remove) await social.delete(`/comments/${c.id}`)
    else await social.patch(`/comments/${c.id}`, { body: commentDraft.value })
    editingComment.value = null
    await loadComments()
    emit('changed')
  })
}
async function copyLink() {
  await act(async () => {
    await navigator.clipboard.writeText(
      `${location.origin}/posts/${props.post.id}`,
    )
    copied.value = true
  })
}
async function searchPeople() {
  await act(async () => {
    people.value = (await social.get('/people', { search: search.value })).data
  })
}
</script>
<template>
  <article class="surface overflow-hidden">
    <header class="p-5 flex gap-3 items-center">
      <RouterLink :to="`/users/${post.author.id}`" class="shrink-0"
        ><img
          v-if="post.author.avatar"
          :src="post.author.avatar"
          :alt="post.author.name"
          class="w-11 h-11 rounded-full object-cover"
        /><span v-else class="social-avatar">{{
          post.author.name.slice(0, 1)
        }}</span></RouterLink
      >
      <div class="min-w-0 flex-1">
        <RouterLink :to="`/users/${post.author.id}`" class="font-semibold">{{
          post.author.name
        }}</RouterLink>
        <p class="text-xs mt-1 text-[var(--text-3)]">
          <RouterLink :to="`/posts/${post.id}`">{{
            new Date(post.created_at).toLocaleString('vi-VN')
          }}</RouterLink>
          · {{ labels[post.audience] }}
          <span v-if="post.pinned">· Đã ghim</span>
        </p>
      </div>
      <details class="relative text-sm">
        <summary
          class="cursor-pointer btn-ghost px-3 py-2 rounded-lg"
          aria-label="Tùy chọn bài viết"
        >
          •••
        </summary>
        <div
          class="absolute z-20 right-0 w-52 surface p-2 grid gap-1 shadow-lg"
        >
          <template v-if="post.can_manage"
            ><button class="social-menu" @click="edit">Chỉnh sửa</button
            ><button
              class="social-menu"
              @click="
                ($event) => {
                  act(async () => {
                    await (post.pinned
                      ? social.delete(`/posts/${post.id}/pin`)
                      : social.put(`/posts/${post.id}/pin`))
                    emit('changed')
                  })
                }
              "
            >
              {{ post.pinned ? 'Bỏ ghim' : 'Ghim bài viết' }}</button
            ><button
              class="social-menu"
              @click="
                ($event) => {
                  tagMedia = null
                  tagOpen = true
                }
              "
            >
              Gắn thẻ bạn bè</button
            ><button
              class="social-menu"
              @click="
                ($event) => {
                  act(async () => {
                    await social.patch(`/posts/${post.id}`, { archived: true })
                    emit('changed')
                  })
                }
              "
            >
              Lưu trữ</button
            ><button class="social-menu text-red-400" @click="deleting = true">
              Chuyển vào thùng rác
            </button></template
          >
          <button
            v-if="isAuthenticated"
            class="social-menu"
            @click="
              ($event) => {
                act(async () => {
                  await (post.saved
                    ? social.delete(`/posts/${post.id}/saved`)
                    : social.put(`/posts/${post.id}/saved`))
                  emit('changed')
                })
              }
            "
          >
            {{ post.saved ? 'Bỏ lưu' : 'Lưu bài viết' }}</button
          ><button
            v-if="isAuthenticated && !post.can_manage"
            class="social-menu"
            @click="
              ($event) => {
                reportSubject = null
                reportOpen = true
              }
            "
          >
            Báo cáo</button
          ><button class="social-menu" @click="copyLink">
            {{ copied ? 'Đã sao chép' : 'Sao chép liên kết' }}
          </button>
        </div>
      </details>
    </header>
    <RouterLink
      v-if="post.court"
      :to="`/courts/${post.court.id}`"
      class="px-5 pb-3 block text-sm btn-text"
      >Check-in tại {{ post.court.name }}</RouterLink
    >
    <button
      v-if="editing"
      type="button"
      class="btn-text px-5 pb-4 text-sm"
      :disabled="busy"
      @click="
        act(async () => {
          await social.patch(`/posts/${post.id}`, { hidden: true })
          editing = false
          emit('changed')
        })
      "
    >
      Ẩn khỏi hồ sơ (giữ nguyên quyền xem)
    </button>
    <form v-if="editing" class="px-5 pb-4 space-y-3" @submit.prevent="save">
      <div class="flex flex-wrap gap-3">
        <label v-for="(m, i) in post.media" :key="m.id" class="text-sm"
          ><input v-model="keepMedia" type="checkbox" :value="m.id" /> Giữ media
          {{ i + 1 }}</label
        >
      </div>
      <label class="block text-sm"
        >Thêm ảnh/video<input
          class="social-input mt-2"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          :disabled="busy"
          @change="addFiles"
      /></label>
      <div v-for="(f, i) in newFiles" :key="i" class="text-sm flex gap-3">
        <span>{{ f.file.name }}</span
        ><button
          type="button"
          :disabled="busy"
          class="btn-text"
          @click="newFiles.splice(i, 1)"
        >
          Bỏ
        </button>
      </div>
      <textarea
        v-model="draft"
        class="social-input"
        maxlength="10000"
        aria-label="Nội dung bài viết"
      /><select
        v-model="visibility"
        class="social-input"
        aria-label="Quyền xem"
      >
        <option v-for="(label, key) in labels" :key="key" :value="key">
          {{ label }}
        </option></select
      ><button class="btn-primary px-4 py-2 rounded-lg" :disabled="busy">
        Lưu</button
      ><button type="button" class="ml-3" @click="editing = false">Hủy</button>
    </form>
    <p v-else class="px-5 pb-4 whitespace-pre-wrap break-words leading-relaxed">
      {{ post.body }}
    </p>
    <div v-if="post.shared" class="mx-5 mb-4 p-4 rounded-xl bg-[var(--bg-2)]">
      <template v-if="post.shared.available"
        ><p class="whitespace-pre-wrap break-words">{{ post.shared.body }}</p>
        <RouterLink
          :to="`/posts/${post.shared.id}`"
          class="btn-text text-sm mt-2 inline-block"
          >Xem bài gốc</RouterLink
        ></template
      >
      <p v-else class="text-sm text-[var(--text-3)]">
        Bài viết gốc hiện không khả dụng.
      </p>
    </div>
    <div
      v-if="post.media?.length"
      class="grid gap-1"
      :class="post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'"
    >
      <SocialMedia
        v-for="(m, i) in post.media"
        :key="m.id"
        :asset="m"
        :alt="`Ảnh trong bài viết của ${post.author.name}`"
        @open="mediaIndex = i"
      />
    </div>
    <div class="px-5 py-3 text-xs text-[var(--text-3)] flex justify-between">
      <span>{{ post.reaction_count }} cảm xúc</span
      ><button @click="act(() => loadComments())">
        {{ post.comment_count }} bình luận
      </button>
    </div>
    <div class="flex flex-wrap gap-2 p-3 border-t border-[var(--line)]">
      <select
        v-if="isAuthenticated"
        :value="post.my_reaction || ''"
        aria-label="Thả cảm xúc"
        class="btn-ghost px-3 py-2 rounded-lg text-sm"
        :disabled="busy"
        @change="react($event.target.value)"
      >
        <option value="">Cảm xúc</option>
        <option v-for="(label, key) in reactions" :key="key" :value="key">
          {{ label }}
        </option>
      </select>
      <button
        class="btn-ghost px-3 py-2 rounded-lg text-sm"
        :disabled="busy"
        @click="act(() => loadComments())"
      >
        Bình luận</button
      ><button
        class="btn-ghost px-3 py-2 rounded-lg text-sm"
        @click="shareOpen = true"
      >
        Chia sẻ
      </button>
      <RouterLink
        v-if="!isAuthenticated"
        to="/login"
        class="text-sm py-2 btn-text"
        >Đăng nhập để tương tác</RouterLink
      >
    </div>
    <p v-if="error" role="alert" class="px-5 pb-4 text-sm text-red-400">
      {{ error }}
    </p>
    <section v-if="commentsOpen" class="p-5 pt-2 space-y-4">
      <article
        v-for="c in comments"
        :key="c.id"
        :class="{ 'ml-6 border-l pl-3 border-[var(--line)]': c.parent_id }"
      >
        <RouterLink
          :to="`/users/${c.author.id}`"
          class="font-semibold text-sm"
          >{{ c.author.name }}</RouterLink
        ><span v-if="c.parent_id" class="text-xs ml-2 text-[var(--text-3)]"
          >Trả lời #{{ c.parent_id }}</span
        >
        <form v-if="editingComment === c.id" @submit.prevent="modifyComment(c)">
          <input
            v-model="commentDraft"
            class="social-input mt-2"
            maxlength="3000"
            aria-label="Sửa bình luận"
          /><button class="btn-text text-sm mr-3" :disabled="busy">Lưu</button
          ><button type="button" class="text-sm" @click="editingComment = null">
            Hủy
          </button>
        </form>
        <p v-else class="text-sm whitespace-pre-wrap break-words mt-1">
          {{ c.body }}
        </p>
        <div class="text-xs mt-2 flex gap-3">
          <button
            v-if="isAuthenticated && !c.parent_id"
            class="btn-text"
            @click="replyTo = c"
          >
            Trả lời</button
          ><button
            v-if="isAuthenticated && !c.can_manage"
            @click="
              ($event) => {
                reportSubject = c.id
                reportOpen = true
              }
            "
          >
            Báo cáo</button
          ><template v-if="c.can_manage && !readOnly"
            ><button
              @click="
                ($event) => {
                  editingComment = c.id
                  commentDraft = c.body
                }
              "
            >
              Sửa</button
            ><button @click="modifyComment(c, true)">Xóa</button></template
          >
        </div>
      </article>
      <button
        v-if="moreComments"
        class="btn-text text-sm"
        @click="act(() => loadComments(false))"
      >
        Xem thêm bình luận
      </button>
      <form v-if="isAuthenticated" @submit.prevent="sendComment">
        <p v-if="replyTo" class="text-xs mb-2">
          Trả lời {{ replyTo.author.name }}
          <button type="button" class="underline ml-2" @click="replyTo = null">
            Hủy
          </button>
        </p>
        <label class="sr-only" :for="`comment-${post.id}`">Viết bình luận</label
        ><textarea
          :id="`comment-${post.id}`"
          v-model="comment"
          class="social-input"
          maxlength="3000"
          placeholder="Viết bình luận…"
        /><button
          class="btn-primary px-4 py-2 mt-2 rounded-lg text-sm"
          :disabled="busy || !comment.trim()"
        >
          Gửi
        </button>
      </form>
    </section>
    <div
      v-if="mediaIndex >= 0"
      class="social-overlay"
      @click.self="mediaIndex = -1"
      @keydown.esc="mediaIndex = -1"
    >
      <section
        class="social-dialog !max-w-4xl"
        role="dialog"
        aria-modal="true"
        aria-label="Xem media"
      >
        <div class="flex flex-wrap gap-4 justify-between mb-3">
          <button :disabled="mediaIndex === 0" @click="mediaIndex--">
            Trước</button
          ><span>{{ mediaIndex + 1 }}/{{ post.media.length }}</span
          ><button
            :disabled="mediaIndex === post.media.length - 1"
            @click="mediaIndex++"
          >
            Sau</button
          ><button
            v-if="post.can_manage && !readOnly"
            @click="
              ($event) => {
                tagMedia = post.media[mediaIndex].id
                tagOpen = true
                mediaIndex = -1
              }
            "
          >
            Gắn thẻ ảnh</button
          ><button @click="mediaIndex = -1">Đóng</button>
        </div>
        <SocialMedia
          :key="post.media[mediaIndex].id"
          :asset="post.media[mediaIndex]"
          alt="Media bài viết"
        />
      </section>
    </div>
    <div
      v-if="deleting || shareOpen || reportOpen || tagOpen"
      class="social-overlay"
      @click.self="
        ($event) => {
          deleting = false
          shareOpen = false
          reportOpen = false
          tagOpen = false
        }
      "
    >
      <section
        class="social-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Thao tác bài viết"
      >
        <button
          class="float-right"
          @click="
            ($event) => {
              deleting = false
              shareOpen = false
              reportOpen = false
              tagOpen = false
            }
          "
        >
          Đóng
        </button>
        <template v-if="deleting"
          ><h3 class="text-xl font-bold mb-4">Chuyển bài vào thùng rác?</h3>
          <p class="text-sm mb-4">
            Bạn có thể khôi phục trong Nhật ký hoạt động trong vòng 30 ngày.
          </p>
          <button
            class="btn-primary px-4 py-2 rounded-xl"
            :disabled="busy"
            @click="
              ($event) => {
                act(async () => {
                  await social.delete(`/posts/${post.id}`)
                  deleting = false
                  emit('changed')
                })
              }
            "
          >
            Xác nhận
          </button></template
        >
        <template v-if="shareOpen"
          ><h3 class="text-xl font-bold mb-4">Chia sẻ bài viết</h3>
          <button class="btn-text mb-4" @click="copyLink">
            {{ copied ? 'Đã sao chép liên kết' : 'Sao chép liên kết' }}
          </button>
          <form
            v-if="isAuthenticated && post.audience === 'public' && !post.shared"
            @submit.prevent="
              ($event) => {
                act(async () => {
                  await social.post('/posts', {
                    body: shareText,
                    shared_post_id: post.id,
                    audience: 'public',
                  })
                  shareOpen = false
                  emit('changed')
                })
              }
            "
          >
            <textarea
              v-model="shareText"
              class="social-input"
              maxlength="10000"
              placeholder="Thêm lời nhắn…"
              aria-label="Nội dung chia sẻ"
            /><button
              class="btn-primary px-4 py-2 rounded-xl mt-3"
              :disabled="busy"
            >
              Chia sẻ lên hồ sơ
            </button>
          </form></template
        >
        <form
          v-if="reportOpen"
          @submit.prevent="
            ($event) => {
              act(async () => {
                await social.post('/reports', {
                  subject_type: reportSubject ? 'comment' : 'post',
                  subject_id: reportSubject || post.id,
                  reason,
                })
                reportOpen = false
                reason = ''
              })
            }
          "
        >
          <h3 class="text-xl font-bold mb-4">Báo cáo bài viết</h3>
          <textarea
            v-model="reason"
            class="social-input"
            maxlength="2000"
            required
            aria-label="Lý do báo cáo"
            placeholder="Mô tả lý do…"
          /><button
            class="btn-primary mt-3 px-4 py-2 rounded-xl"
            :disabled="busy"
          >
            Gửi báo cáo
          </button>
        </form>
        <template v-if="tagOpen"
          ><h3 class="text-xl font-bold mb-4">Gắn thẻ</h3>
          <form class="flex gap-2" @submit.prevent="searchPeople">
            <input
              v-model="search"
              class="social-input"
              aria-label="Tìm người"
              placeholder="Tên bạn bè"
            /><button class="btn-ghost px-3 rounded-lg">Tìm</button>
          </form>
          <button
            v-for="person in people"
            :key="person.id"
            class="block social-menu"
            @click="
              ($event) => {
                act(async () => {
                  await social.post(
                    tagMedia
                      ? `/social-media/${tagMedia}/tags`
                      : `/posts/${post.id}/tags`,
                    { user_id: person.id },
                  )
                  tagOpen = false
                })
              }
            "
          >
            {{ person.name }}
          </button></template
        >
        <p v-if="error" class="text-red-400 text-sm mt-4">{{ error }}</p>
      </section>
    </div>
  </article>
</template>
