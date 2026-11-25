<script setup>
import { ref, computed, watch } from 'vue'
import { contentStudio, contentStudioError } from '../../../api/contentStudio'
import { STATUS_LABELS, SLOT_LABELS, CHANNEL_TZ, pillStyle, fmtTime } from './labels'

const props = defineProps({
  // bump it to reload after something changed elsewhere
  refreshKey: { type: Number, default: 0 },
})
const emit = defineEmits(['open'])

// Plain calendar dates (YYYY-MM-DD), computed in UTC so no timezone can shift a day.
const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: CHANNEL_TZ }).format(new Date())
const mondayOf = (date) => addDays(date, -((new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7))
const dayLabel = (date) =>
  new Intl.DateTimeFormat('vi-VN', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit' }).format(
    new Date(`${date}T00:00:00Z`),
  )

const from = ref(mondayOf(today()))
const planned = ref({})
const error = ref('')
const loading = ref(true)
let latest = 0

const days = computed(() => Array.from({ length: 7 }, (_, i) => addDays(from.value, i)))
const itemsOf = (date) =>
  [...(planned.value[date]?.items ?? [])].sort((a, b) =>
    String(a.proposed_publish_at ?? '').localeCompare(String(b.proposed_publish_at ?? '')),
  )

async function load() {
  const request = ++latest
  loading.value = true
  try {
    const res = await contentStudio.calendar({ from: from.value, to: addDays(from.value, 6) })
    if (request !== latest) return // an older week answered late
    planned.value = Object.fromEntries(res.data.days.map((d) => [d.date, d]))
    error.value = ''
  } catch (e) {
    if (request !== latest) return
    planned.value = {}
    error.value = contentStudioError(e)
  } finally {
    if (request === latest) loading.value = false
  }
}

watch([from, () => props.refreshKey], load, { immediate: true })
</script>

<template>
  <section class="surface p-5 sm:p-6 mb-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="font-heading font-bold text-[18px]">Lịch nội dung</h2>
      <div class="flex items-center gap-4 text-[13px]">
        <button class="btn-text" @click="from = addDays(from, -7)">← Tuần trước</button>
        <button class="btn-text" @click="from = mondayOf(today())">Tuần này</button>
        <button class="btn-text" @click="from = addDays(from, 7)">Tuần sau →</button>
      </div>
    </div>
    <p class="mt-1 text-[12px]" style="color: var(--text-3)">
      Giờ hiển thị là giờ đăng đề xuất (giờ Việt Nam). Chưa có gì được lên lịch trên TikTok.
    </p>
    <p v-if="error" class="mt-3 text-[13px]" style="color: #ef4444">{{ error }}</p>

    <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4" :style="{ opacity: loading ? 0.5 : 1 }">
      <div
        v-for="date in days"
        :key="date"
        class="rounded-xl p-3 text-[13px]"
        :style="{ border: `1px solid ${date === today() ? 'var(--accent-line)' : 'var(--line)'}` }"
      >
        <div class="font-semibold">{{ dayLabel(date) }}</div>
        <p v-if="!planned[date]" class="mt-2" style="color: var(--text-3)">Chưa có kế hoạch</p>
        <ul v-else class="mt-2 space-y-2">
          <li v-for="item in itemsOf(date)" :key="item.id">
            <button type="button" class="admin-row w-full text-left rounded-lg p-2" @click="emit('open', item.id)">
              <span class="flex flex-wrap items-center gap-2">
                <span class="mono" style="color: var(--text-3)">{{ fmtTime(item.proposed_publish_at) }}</span>
                <span style="color: var(--text-3)">{{ SLOT_LABELS[item.slot] || item.slot }}</span>
                <span class="pill" :style="pillStyle(item.status)">{{ STATUS_LABELS[item.status] || item.status }}</span>
              </span>
              <span class="block mt-1">{{ item.title || '(chưa có tiêu đề)' }}</span>
              <span v-if="item.mock" class="block text-[11px]" style="color: #facc15">Bài thử (mock)</span>
            </button>
          </li>
          <li v-for="s in planned[date].shortfalls" :key="s.slot" class="text-[11px]" style="color: var(--text-3)">
            Thiếu bài {{ SLOT_LABELS[s.slot] || s.slot }}: {{ s.reason }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
