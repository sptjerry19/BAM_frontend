<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { contentStudio, contentStudioError } from '../../../api/contentStudio'
import { STATUS_LABELS, SLOT_LABELS, pillStyle, fmt, isWebUrl } from './labels'

const props = defineProps({ itemId: { type: Number, required: true } })
const emit = defineEmits(['close', 'changed'])

const CHECK_LABELS = {
  format: 'Định dạng',
  fields: 'Thiếu nội dung',
  hashtags: 'Hashtag',
  caption_length: 'Độ dài caption',
  slides: 'Số hoặc độ dài slide',
  claims: 'Khẳng định chưa có căn cứ',
  news_phrases: 'Từ chỉ dùng cho tin tức',
  news_source: 'Nguồn tin',
  news_credit: 'Ghi nguồn',
  source_rights: 'Quyền dùng nguồn',
  equipment_specs: 'Số đo không có trong dữ liệu',
  equipment_price: 'Giá không còn mới',
  render: 'Chưa dựng ảnh',
  assets: 'Ảnh lỗi',
  asset_rights: 'Quyền dùng ảnh',
  duplicate: 'Trùng tiêu đề',
  review_flag: 'AI đề nghị xem lại',
}
const APPROVE_BLOCKERS = {
  not_in_review: null, // nothing to approve in this status: say nothing
  mock_content: 'Bài thử do AI giả lập tạo ra, không thể duyệt.',
  no_render: 'Chưa có bộ ảnh hoàn chỉnh nên chưa thể duyệt.',
  blocking_findings: 'Có lỗi không được phép bỏ qua. Cần sửa hoặc hủy bài.',
}

const data = ref(null)
const images = ref([]) // [{ index, url }]
const imageError = ref('')
const error = ref('')
const notice = ref('')
const busy = ref(false)
const reason = ref('')
const cancelling = ref(false)
const cancelReason = ref('')
const closeButton = ref(null)
let latest = 0

const item = computed(() => data.value?.item)
const findings = computed(() => data.value?.qa.checks.filter((c) => !c.passed) ?? [])
const imagesComplete = computed(() => !!data.value && images.value.length === data.value.render.images.length && !imageError.value)
// a reviewer must have seen every slide, and say why when something is flagged
const canApprove = computed(
  () => !busy.value && imagesComplete.value && (findings.value.length === 0 || reason.value.trim() !== ''),
)

function releaseImages() {
  images.value.forEach((i) => URL.revokeObjectURL(i.url))
  images.value = []
}

async function load() {
  const request = ++latest
  try {
    const review = (await contentStudio.review(props.itemId)).data
    if (request !== latest) return
    releaseImages()
    imageError.value = ''
    data.value = review
    // images need the admin token, so they are fetched and shown from memory
    const loaded = await Promise.allSettled(
      review.render.images.map(async (index) => ({ index, blob: await contentStudio.slide(props.itemId, index) })),
    )
    if (request !== latest) return
    images.value = loaded
      .filter((r) => r.status === 'fulfilled')
      .map((r) => ({ index: r.value.index, url: URL.createObjectURL(r.value.blob) }))
    if (images.value.length !== review.render.images.length) imageError.value = 'Không tải được đủ ảnh. Hãy thử tải lại.'
  } catch (e) {
    if (request === latest) error.value = contentStudioError(e)
  }
}

async function decide(action) {
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    const res = await action()
    notice.value = res.message
    if (res.data?.export_error) error.value = res.data.export_error
    else if (res.data?.export_directory) notice.value += ` Thư mục: ${res.data.export_directory}`
    reason.value = ''
    cancelReason.value = ''
    cancelling.value = false
    emit('changed')
    await load()
  } catch (e) {
    error.value = contentStudioError(e)
    // 409: what is on screen is out of date
    if (e?.response?.status === 409) {
      emit('changed')
      await load()
    }
  } finally {
    busy.value = false
  }
}

function approve() {
  if (!window.confirm('Duyệt bài này? Hệ thống sẽ tạo gói để bạn đăng tay, chưa đăng gì lên TikTok.')) return
  decide(() =>
    contentStudio.approve(props.itemId, {
      lock_version: item.value.lock_version,
      render_version: data.value.render.version,
      accepted: data.value.qa.failed,
      reason: reason.value,
    }),
  )
}
const retry = () => decide(() => contentStudio.retry(props.itemId))
function cancel() {
  if (!window.confirm('Hủy bài này? Không hoàn tác được.')) return
  decide(() => contentStudio.cancel(props.itemId, { lock_version: item.value.lock_version, reason: cancelReason.value }))
}

const onKey = (e) => e.key === 'Escape' && !busy.value && emit('close')

onMounted(() => {
  load()
  window.addEventListener('keydown', onKey)
  closeButton.value?.focus()
})
onUnmounted(() => {
  latest++ // ignore anything still loading
  releaseImages()
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 modal-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4"
      style="z-index: var(--z-modal)"
      @click.self="!busy && emit('close')"
    >
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="`Duyệt bài ${itemId}`"
        class="modal-sheet glass-strong w-full sm:max-w-3xl max-h-[92dvh] overflow-y-auto p-5 sm:p-6 text-[13px]"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="mono" style="color: var(--text-3)">
              Bài #{{ itemId }}<template v-if="item"> · {{ SLOT_LABELS[item.slot] || item.slot }}</template>
            </p>
            <h2 class="font-heading font-bold text-[18px]">{{ item?.title || (data ? '(chưa có tiêu đề)' : 'Đang tải…') }}</h2>
          </div>
          <button ref="closeButton" type="button" class="btn-text" :disabled="busy" @click="emit('close')">Đóng</button>
        </div>

        <p v-if="notice" role="status" class="mt-3" style="color: #84cc16">{{ notice }}</p>
        <p v-if="error" role="alert" class="mt-3" style="color: #ef4444">{{ error }}</p>

        <template v-if="data">
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <span class="pill" :style="pillStyle(item.status)">{{ STATUS_LABELS[item.status] || item.status }}</span>
            <span v-if="item.mock" class="pill" :style="pillStyle('needs_review')">Bài thử (mock)</span>
            <span style="color: var(--text-3)">Giờ đề xuất: {{ fmt(item.proposed_publish_at) }}</span>
          </div>
          <p v-if="item.blocked_reason" class="mt-2" style="color: var(--text-2)">{{ item.blocked_reason }}</p>

          <!-- Slides -->
          <p v-if="!data.render.images.length" class="mt-4" style="color: var(--text-2)">Chưa có ảnh nào được dựng.</p>
          <div v-else class="mt-4 flex gap-3 overflow-x-auto pb-2">
            <a v-for="img in images" :key="img.index" :href="img.url" target="_blank" rel="noopener" class="shrink-0">
              <img :src="img.url" :alt="`Slide ${img.index}`" class="rounded-lg h-72" style="aspect-ratio: 9 / 16" />
            </a>
          </div>
          <p v-if="imageError" style="color: #ef4444">
            {{ imageError }} <button type="button" class="btn-text" @click="load">Tải lại</button>
          </p>

          <details class="mt-3">
            <summary class="cursor-pointer font-semibold">Chữ trên slide</summary>
            <ol class="mt-2 space-y-2 list-decimal pl-5">
              <li v-for="(slide, i) in data.slides" :key="i">
                <strong>{{ slide.heading }}</strong>
                <div style="color: var(--text-2)">{{ slide.body }}</div>
              </li>
            </ol>
          </details>

          <h3 class="mt-4 font-semibold">Caption sẽ đăng</h3>
          <p class="mt-1 whitespace-pre-line" style="color: var(--text-2)">{{ item.final_caption }}</p>

          <!-- Quality findings -->
          <h3 class="mt-4 font-semibold">Kiểm tra chất lượng</h3>
          <p v-if="!findings.length" class="mt-1" style="color: #84cc16">Tất cả {{ data.qa.checks.length }} mục đều đạt.</p>
          <ul v-else class="mt-1 space-y-1">
            <li v-for="f in findings" :key="f.code">
              <span class="pill" :style="pillStyle(f.severity === 'block' ? 'failed' : 'needs_review')">
                {{ f.severity === 'block' ? 'Chặn' : 'Cần xem' }}
              </span>
              <strong class="ml-2">{{ CHECK_LABELS[f.code] || f.code }}</strong>
              <span class="ml-1" style="color: var(--text-2)">{{ f.message }}</span>
            </li>
          </ul>

          <!-- Where the facts come from -->
          <template v-if="data.sources.length || data.products.length">
            <h3 class="mt-4 font-semibold">Nguồn cần đối chiếu</h3>
            <ul class="mt-1 space-y-2">
              <li v-for="s in data.sources" :key="`s${s.id}`">
                {{ s.creator || 'Nguồn' }}:
                <a v-if="isWebUrl(s.url)" :href="s.url" target="_blank" rel="noopener noreferrer" class="underline">
                  {{ s.title || s.url }}
                </a>
                <span v-else>{{ s.title || s.url }}</span>
              </li>
              <li v-for="p in data.products" :key="`p${p.product_id}`">
                <strong>{{ p.name || `Sản phẩm ${p.product_id}` }}</strong>
                <div v-for="(value, key) in p.facts" :key="key" style="color: var(--text-2)">{{ key }}: {{ value }}</div>
                <a v-if="isWebUrl(p.spec_url)" :href="p.spec_url" target="_blank" rel="noopener noreferrer" class="underline mr-3">
                  Trang thông số của hãng (kiểm tra đúng đời vợt)
                </a>
                <a v-if="isWebUrl(p.shop_url)" :href="p.shop_url" target="_blank" rel="noopener noreferrer" class="underline">
                  Trang cửa hàng
                </a>
              </li>
            </ul>
          </template>

          <!-- Decisions -->
          <div class="mt-5 pt-4" style="border-top: 1px solid var(--line)">
            <template v-if="data.actions.approve.available">
              <label v-if="findings.length" class="block mb-3">
                <span class="font-semibold">Lý do chấp nhận các mục cần xem (bắt buộc)</span>
                <textarea v-model="reason" maxlength="500" rows="2" class="input-field w-full rounded-xl p-2 mt-1" />
              </label>
              <button type="button" class="btn-primary px-5 py-2" :disabled="!canApprove" @click="approve">Duyệt bài</button>
            </template>
            <p v-else-if="APPROVE_BLOCKERS[data.actions.approve.reason]" style="color: var(--text-2)">
              {{ APPROVE_BLOCKERS[data.actions.approve.reason] }}
            </p>

            <button v-if="data.actions.retry.available" type="button" class="btn-primary px-5 py-2" :disabled="busy" @click="retry">
              Dựng lại bài
            </button>

            <div v-if="data.actions.cancel.available" class="mt-3">
              <button v-if="!cancelling" type="button" class="btn-text" style="color: #ef4444" @click="cancelling = true">
                Hủy bài…
              </button>
              <div v-else class="flex flex-wrap items-center gap-2">
                <input v-model="cancelReason" maxlength="200" class="input-field rounded-xl p-2 flex-1" placeholder="Lý do hủy" />
                <button type="button" class="btn-ghost px-4 py-2" :disabled="busy || !cancelReason.trim()" @click="cancel">
                  Xác nhận hủy
                </button>
                <button type="button" class="btn-text" @click="cancelling = false">Thôi</button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>
