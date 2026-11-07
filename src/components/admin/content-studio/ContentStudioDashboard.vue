<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { contentStudio, contentStudioError } from '../../../api/contentStudio'

const STATUS_LABELS = {
  idea: 'Ý tưởng',
  researching: 'Đang nghiên cứu',
  source_verified: 'Đã xác minh nguồn',
  scripted: 'Đã có kịch bản',
  producing: 'Đang sản xuất',
  quality_check: 'Kiểm tra chất lượng',
  needs_review: 'Cần duyệt',
  ready: 'Sẵn sàng',
  scheduling: 'Đang lên lịch',
  scheduled: 'Đã lên lịch',
  publish_unknown: 'Chưa rõ kết quả đăng',
  reconciliation: 'Đang đối soát',
  published: 'Đã đăng',
  measured: 'Đã đo',
  blocked: 'Bị chặn',
  failed: 'Lỗi',
  cancelled: 'Đã hủy',
}
const SLOT_LABELS = { news: 'Tin tức', equipment: 'Trang bị', tutorial: 'Kỹ thuật', meme: 'Meme' }
const TONE = {
  good: ['ready', 'scheduled', 'published', 'measured', 'succeeded'],
  warn: ['needs_review', 'blocked', 'publish_unknown', 'reconciliation', 'running', 'pending'],
  bad: ['failed'],
}
const COLORS = { good: '#84cc16', warn: '#facc15', bad: '#ef4444', neutral: '#64748b' }

function tone(status) {
  return Object.keys(TONE).find((k) => TONE[k].includes(status)) || 'neutral'
}
function pillStyle(status) {
  const c = COLORS[tone(status)]
  return { background: `${c}1f`, color: c, border: `1px solid ${c}30` }
}
const fmt = (v) => (v ? new Date(v).toLocaleString('vi-VN') : '—')

const overview = ref(null)
const items = ref([])
const itemsMeta = ref(null)
const runs = ref([])
const error = ref('')
const loading = ref(true)
const busy = ref(false)
const filters = ref({ status: '', slot: '' })
const page = ref(1)
let timer = null

const flags = computed(() => overview.value?.flags ?? null)

async function loadOverview() {
  overview.value = (await contentStudio.overview()).data
}
async function loadItems() {
  const params = { page: page.value }
  if (filters.value.status) params.status = filters.value.status
  if (filters.value.slot) params.slot = filters.value.slot
  const res = await contentStudio.contents(params)
  items.value = res.data
  itemsMeta.value = res.pagination
}
async function loadRuns() {
  runs.value = (await contentStudio.runs({ per_page: 8 })).data
}
async function loadAll() {
  try {
    error.value = ''
    await Promise.all([loadOverview(), loadItems(), loadRuns()])
  } catch (e) {
    error.value = contentStudioError(e)
  } finally {
    loading.value = false
  }
}
function applyFilters() {
  page.value = 1
  loadAll()
}
function go(delta) {
  page.value += delta
  loadAll()
}

async function togglePause() {
  const pausing = !flags.value.paused
  const question = pausing
    ? 'Tạm dừng tự động hóa? Bước đang chạy sẽ hoàn tất, không có bước mới nào bắt đầu.'
    : 'Tiếp tục tự động hóa? Các tiến trình đang bị giữ sẽ được chạy tiếp.'
  if (!window.confirm(question)) return
  busy.value = true
  try {
    if (pausing) await contentStudio.pause('Tạm dừng từ trang quản trị')
    else await contentStudio.resume()
    await loadAll()
  } catch (e) {
    error.value = contentStudioError(e)
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  loadAll()
  timer = setInterval(() => loadOverview().catch(() => {}), 30000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__head">
      <p class="eyebrow">Quản trị</p>
      <h1 class="page-title mt-2">Content Studio</h1>
      <p class="lede mt-3">
        Theo dõi pipeline nội dung TikTok: trạng thái bài, bước đang chạy, nguồn và các điểm bị chặn.
      </p>
    </header>

    <p v-if="error" class="mb-4" style="color: #ef4444">{{ error }}</p>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <div v-for="i in 4" :key="i" class="surface h-28 shimmer" />
    </div>

    <template v-else-if="overview">
      <!-- Kill switch + flags -->
      <section class="surface p-5 mb-5 flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-2 text-[13px]">
          <span class="pill" :style="pillStyle(flags.enabled ? 'ready' : 'cancelled')">
            {{ flags.enabled ? 'Module BẬT' : 'Module TẮT' }}
          </span>
          <span class="pill" :style="pillStyle(flags.paused ? 'failed' : 'ready')">
            {{ flags.paused ? 'Đã tạm dừng' : 'Đang chạy' }}
          </span>
          <span class="pill" :style="pillStyle(flags.autopublish_enabled ? 'blocked' : 'cancelled')">
            Tự đăng: {{ flags.autopublish_enabled ? 'bật' : 'tắt' }}
          </span>
          <span class="mono text-[11px]" style="color: var(--text-3)">scope: {{ flags.schedule_scope }}</span>
        </div>
        <button
          class="btn-text"
          :disabled="busy"
          :style="{ color: flags.paused ? undefined : '#ef4444', fontWeight: 600 }"
          @click="togglePause"
        >
          {{ flags.paused ? 'Tiếp tục tự động hóa' : 'Tạm dừng tự động hóa' }}
        </button>
      </section>
      <p v-if="!flags.enabled" class="mb-5 text-[13px]" style="color: var(--text-2)">
        CONTENT_STUDIO_ENABLED=false: lịch chạy của Content Studio chưa được đăng ký.
        Bật biến này trong <span class="mono">backend/.env</span> khi đã sẵn sàng.
      </p>

      <!-- Summary cards -->
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div class="surface p-5">
          <div class="font-heading text-[26px] font-bold mono leading-none">{{ overview.items_created_today }}</div>
          <div class="text-[13px] mt-2" style="color: var(--text-2)">Bài tạo hôm nay</div>
        </div>
        <div class="surface p-5">
          <div class="font-heading text-[26px] font-bold mono leading-none">{{ overview.pipeline.running_steps }}</div>
          <div class="text-[13px] mt-2" style="color: var(--text-2)">Bước đang chạy</div>
        </div>
        <div class="surface p-5">
          <div
            class="font-heading text-[26px] font-bold mono leading-none"
            :style="{ color: overview.pipeline.failed_steps_24h ? '#ef4444' : undefined }"
          >
            {{ overview.pipeline.failed_steps_24h }}
          </div>
          <div class="text-[13px] mt-2" style="color: var(--text-2)">Bước lỗi (24h)</div>
        </div>
        <div class="surface p-5">
          <div
            class="font-heading text-[26px] font-bold mono leading-none"
            :style="{ color: overview.system.disk_free_percent !== null && overview.system.disk_free_percent < 15 ? '#ef4444' : undefined }"
          >
            {{ overview.system.disk_free_percent ?? '—' }}<span v-if="overview.system.disk_free_percent !== null">%</span>
          </div>
          <div class="text-[13px] mt-2" style="color: var(--text-2)">Ổ đĩa còn trống</div>
        </div>
      </div>
      <p class="text-[12px] mb-8 mono" style="color: var(--text-3)">
        Worker hoạt động gần nhất: {{ fmt(overview.system.last_step_heartbeat_at) }}
      </p>

      <!-- Status breakdown -->
      <section class="surface p-5 sm:p-6 mb-5">
        <h2 class="font-heading font-bold text-[18px]">Bài theo trạng thái</h2>
        <p v-if="!Object.keys(overview.items_by_status).length" class="mt-3 text-[13px]" style="color: var(--text-2)">
          Chưa có bài nào.
        </p>
        <div v-else class="mt-4 flex flex-wrap gap-2">
          <span
            v-for="(total, status) in overview.items_by_status"
            :key="status"
            class="pill"
            :style="pillStyle(status)"
          >
            {{ STATUS_LABELS[status] || status }} · {{ total }}
          </span>
        </div>
      </section>

      <!-- Blockers -->
      <section class="surface p-5 sm:p-6 mb-5">
        <h2 class="font-heading font-bold text-[18px]">Cần xử lý</h2>
        <p v-if="!overview.blockers.length" class="mt-3 text-[13px]" style="color: var(--text-2)">
          Không có bài nào bị chặn hay lỗi.
        </p>
        <ul v-else class="mt-4 space-y-2">
          <li v-for="b in overview.blockers" :key="b.id" class="admin-row rounded-xl px-3 py-2.5 text-[13px]">
            <div class="flex flex-wrap items-center gap-2">
              <span class="mono" style="color: var(--text-3)">#{{ b.id }}</span>
              <span class="font-semibold">{{ b.title || '(chưa có tiêu đề)' }}</span>
              <span class="pill" :style="pillStyle(b.status)">{{ STATUS_LABELS[b.status] || b.status }}</span>
              <span style="color: var(--text-3)">{{ SLOT_LABELS[b.slot] || b.slot }}</span>
            </div>
            <p class="mt-1" style="color: var(--text-2)">{{ b.blocked_reason }}</p>
          </li>
        </ul>
      </section>

      <!-- Contents list -->
      <section class="surface p-5 sm:p-6 mb-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-heading font-bold text-[18px]">Danh sách bài</h2>
          <div class="flex flex-wrap gap-2 text-[13px]">
            <select v-model="filters.slot" @change="applyFilters">
              <option value="">Mọi loại</option>
              <option v-for="(label, key) in SLOT_LABELS" :key="key" :value="key">{{ label }}</option>
            </select>
            <select v-model="filters.status" @change="applyFilters">
              <option value="">Mọi trạng thái</option>
              <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
        </div>
        <p v-if="!items.length" class="mt-4 text-[13px]" style="color: var(--text-2)">Không có bài phù hợp.</p>
        <div v-else class="mt-4 overflow-x-auto">
          <table class="w-full text-[13px] text-left">
            <thead style="color: var(--text-3)">
              <tr>
                <th class="py-2 pr-3">#</th>
                <th class="py-2 pr-3">Tiêu đề</th>
                <th class="py-2 pr-3">Loại</th>
                <th class="py-2 pr-3">Trạng thái</th>
                <th class="py-2 pr-3">Lịch đăng</th>
                <th class="py-2">Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in items" :key="it.id" class="admin-row">
                <td class="py-2 pr-3 mono">{{ it.id }}</td>
                <td class="py-2 pr-3">{{ it.title || '—' }}</td>
                <td class="py-2 pr-3">{{ SLOT_LABELS[it.slot] || it.slot }} · {{ it.content_type }}</td>
                <td class="py-2 pr-3">
                  <span class="pill" :style="pillStyle(it.status)">{{ STATUS_LABELS[it.status] || it.status }}</span>
                  <div v-if="it.blocked_reason" class="text-[11px] mt-1" style="color: var(--text-3)">{{ it.blocked_reason }}</div>
                </td>
                <td class="py-2 pr-3 mono">{{ fmt(it.scheduled_at) }}</td>
                <td class="py-2 mono">{{ fmt(it.updated_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="itemsMeta" class="flex items-center justify-between mt-4 text-[13px]">
          <button class="btn-text" :disabled="page <= 1" @click="go(-1)">← Trước</button>
          <span class="mono" style="color: var(--text-3)">
            Trang {{ itemsMeta.current_page }} / {{ itemsMeta.last_page }} · {{ itemsMeta.total }} bài
          </span>
          <button class="btn-text" :disabled="!itemsMeta.has_more_pages" @click="go(1)">Sau →</button>
        </div>
      </section>

      <!-- Pipeline runs -->
      <section class="surface p-5 sm:p-6">
        <h2 class="font-heading font-bold text-[18px]">Pipeline gần đây</h2>
        <p v-if="!runs.length" class="mt-3 text-[13px]" style="color: var(--text-2)">
          Chưa có lần chạy nào. Kiểm tra worker bằng
          <span class="mono">php artisan content:smoke</span>.
        </p>
        <ul v-else class="mt-4 space-y-2">
          <li v-for="r in runs" :key="r.id" class="admin-row rounded-xl px-3 py-2.5 text-[13px]">
            <div class="flex flex-wrap items-center gap-2">
              <span class="pill" :style="pillStyle(r.status)">{{ r.status }}</span>
              <span class="font-semibold">{{ r.pipeline }}</span>
              <span v-if="r.content_item_id" class="mono" style="color: var(--text-3)">bài #{{ r.content_item_id }}</span>
              <span class="mono" style="color: var(--text-3)">{{ fmt(r.created_at) }}</span>
            </div>
            <p v-if="r.last_error" class="mt-1" style="color: #ef4444">{{ r.last_error }}</p>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
