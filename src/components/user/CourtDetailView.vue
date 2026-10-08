<script setup>
import { ref, computed, watch, onMounted, onUnmounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { motion } from 'motion-v'
import { getCourt, getCourtAvailability } from '../../api'
import Icon from '../common/Icon.vue'
import Stars from '../common/Stars.vue'
import { formatCurrency, productImageUrl } from '../../utils/labels'
import { writeBookingDraft } from '../../composables/useBookingDraft'
import {
  SLOT_MINUTES,
  GRID_START,
  GRID_END,
  todayISO,
  minutesToLabel,
  slotCount,
  slotToMinutes,
  bookingToSlotRange,
  hourLabels,
  formatBookingDate,
  nowMinutes,
  isWeekendISO,
} from '../../utils/booking'

const route = useRoute()
const router = useRouter()
const requireAuth = inject('requireAuth', null)

const court = ref(null)
const loading = ref(true)
const loadError = ref('')
const date = ref(todayISO())
const availability = ref(null)
const loadingSlots = ref(false)
const pickError = ref('')

const selecting = ref(false)
const activeRow = ref(null)
const ranges = ref({}) // { [row]: { from, to } } inclusive slot indexes

const gridStart = computed(() => availability.value?.grid_start_minutes ?? GRID_START)
const gridEnd = computed(() => availability.value?.grid_end_minutes ?? GRID_END)
const slotSize = computed(() => availability.value?.slot_minutes ?? SLOT_MINUTES)
const columns = computed(() => slotCount(gridStart.value, gridEnd.value, slotSize.value))
const rows = computed(() => Math.max(1, Number(availability.value?.court_count || court.value?.courts || 1)))
const openMin = computed(() => availability.value?.open_minutes ?? 6 * 60)
const closeMin = computed(() => availability.value?.close_minutes ?? 22 * 60)
const minHours = computed(() => Number(availability.value?.min_hours ?? (isWeekendISO(date.value) ? 2 : 1)))
const hours = computed(() => hourLabels(gridStart.value, gridEnd.value))
const closed = computed(() => court.value?.status === 'closed' || availability.value?.status === 'closed')

const bookedRanges = computed(() =>
  (availability.value?.bookings || []).map((b) =>
    bookingToSlotRange(b, gridStart.value, slotSize.value),
  ),
)

const pickedSlots = computed(() =>
  Object.entries(ranges.value)
    .map(([row, r]) => {
      const from = Math.min(r.from, r.to)
      const to = Math.max(r.from, r.to) + 1
      const hours = ((to - from) * slotSize.value) / 60
      return {
        court_number: Number(row),
        from,
        to,
        hours,
        start_time: minutesToLabel(slotToMinutes(from, gridStart.value, slotSize.value)),
        end_time: minutesToLabel(slotToMinutes(to, gridStart.value, slotSize.value)),
        total_price: Math.round((court.value?.price || 0) * hours),
      }
    })
    .sort((a, b) => a.court_number - b.court_number),
)

const selectedTotal = computed(() =>
  pickedSlots.value.reduce((sum, s) => sum + s.total_price, 0),
)

const selectedHoursTotal = computed(() =>
  pickedSlots.value.reduce((sum, s) => sum + s.hours, 0),
)

const pickedSummary = computed(() =>
  pickedSlots.value.map((s) => `Sân ${s.court_number} ${s.start_time}–${s.end_time}`).join(' · '),
)

const minDate = todayISO()

function isPastSlot(index) {
  if (date.value > todayISO()) return false
  if (date.value < todayISO()) return true
  return slotToMinutes(index, gridStart.value, slotSize.value) < nowMinutes()
}

function isBooked(row, index) {
  return bookedRanges.value.some(
    (r) => r.court_number === row && index >= r.from && index < r.to,
  )
}

function isLocked(row, index) {
  if (closed.value) return true
  const start = slotToMinutes(index, gridStart.value, slotSize.value)
  const end = start + slotSize.value
  if (start < openMin.value || end > closeMin.value) return true
  return isPastSlot(index)
}

function cellState(row, index) {
  const r = ranges.value[row]
  if (r) {
    const from = Math.min(r.from, r.to)
    const to = Math.max(r.from, r.to)
    if (index >= from && index <= to) return 'selected'
  }
  if (isBooked(row, index)) return 'booked'
  if (isLocked(row, index)) return 'locked'
  return 'available'
}

function rowRangeFree(row, slotA, slotB) {
  const from = Math.min(slotA, slotB)
  const to = Math.max(slotA, slotB)
  for (let i = from; i <= to; i++) {
    if (isBooked(row, i) || isLocked(row, i)) return false
  }
  return true
}

function setRowRange(row, from, to) {
  ranges.value = { ...ranges.value, [row]: { from, to } }
  pickError.value = ''
}

function clearRow(row) {
  const next = { ...ranges.value }
  delete next[row]
  ranges.value = next
}

function onCellPointerDown(row, index, event) {
  if (isBooked(row, index) || isLocked(row, index)) return
  event.preventDefault()

  const current = ranges.value[row]
  if (current) {
    const from = Math.min(current.from, current.to)
    const to = Math.max(current.from, current.to)
    if (index >= from && index <= to) {
      clearRow(row)
      selecting.value = false
      activeRow.value = null
      return
    }
  }

  if (current && !selecting.value && event.pointerType !== 'mouse') {
    if (!rowRangeFree(row, current.from, index)) return
    setRowRange(row, current.from, index)
    return
  }

  selecting.value = true
  activeRow.value = row
  setRowRange(row, index, index)
}

function onCellPointerEnter(row, index) {
  if (!selecting.value || activeRow.value !== row) return
  const current = ranges.value[row]
  if (!current) return
  if (!rowRangeFree(row, current.from, index)) return
  setRowRange(row, current.from, index)
}

function onGridPointerMove(event) {
  if (!selecting.value || activeRow.value == null) return
  const el = document.elementFromPoint(event.clientX, event.clientY)
  const cell = el?.closest?.('[data-row][data-slot]')
  if (!cell) return
  const row = Number(cell.getAttribute('data-row'))
  const index = Number(cell.getAttribute('data-slot'))
  if (row !== activeRow.value || !Number.isFinite(index)) return
  onCellPointerEnter(row, index)
}

function onPointerUp() {
  selecting.value = false
  activeRow.value = null
}

function cellTitle(row, index) {
  const start = minutesToLabel(slotToMinutes(index, gridStart.value, slotSize.value))
  const end = minutesToLabel(slotToMinutes(index + 1, gridStart.value, slotSize.value))
  const state = cellState(row, index)
  const label = { available: 'Trống', booked: 'Đã đặt', locked: 'Khoá', selected: 'Đang chọn' }[state]
  return `Sân ${row} · ${start}–${end} · ${label}`
}

async function loadCourt() {
  loading.value = true
  loadError.value = ''
  try {
    court.value = await getCourt(route.params.id)
    document.title = court.value?.name ? `${court.value.name} — JBadminton` : 'Đặt sân — JBadminton'
  } catch {
    court.value = null
    loadError.value = 'Không tìm thấy cụm sân'
  } finally {
    loading.value = false
  }
}

async function loadAvailability() {
  if (!route.params.id) return
  loadingSlots.value = true
  ranges.value = {}
  pickError.value = ''
  try {
    availability.value = await getCourtAvailability(route.params.id, date.value)
  } catch {
    availability.value = null
  } finally {
    loadingSlots.value = false
  }
}

function continueToCheckout() {
  if (!court.value || !pickedSlots.value.length) return
  const short = pickedSlots.value.find((s) => s.hours + 0.001 < minHours.value)
  if (short) {
    pickError.value = `Sân ${short.court_number}: chọn tối thiểu ${minHours.value} giờ.`
    return
  }
  writeBookingDraft({
    court_id: court.value.id,
    court_name: court.value.name,
    court_address: court.value.address,
    booking_date: date.value,
    price_per_hour: court.value.price,
    total_price: selectedTotal.value,
    min_hours: minHours.value,
    slots: pickedSlots.value.map((s) => ({
      court_number: s.court_number,
      start_time: s.start_time,
      end_time: s.end_time,
      hours: s.hours,
      total_price: s.total_price,
    })),
  })
  const path = `/courts/${court.value.id}/checkout`
  if (requireAuth && !requireAuth(path)) return
  router.push({ name: 'court-booking-checkout', params: { id: String(court.value.id) } })
}

watch(date, () => {
  loadAvailability()
})

watch(
  () => route.params.id,
  async (id) => {
    if (!id) return
    await loadCourt()
    await loadAvailability()
  },
)

onMounted(async () => {
  window.addEventListener('pointerup', onPointerUp)
  await loadCourt()
  await loadAvailability()
})

onUnmounted(() => {
  window.removeEventListener('pointerup', onPointerUp)
})
</script>

<template>
  <div class="court-book pb-40">
    <div v-if="loading" class="shell pt-10 space-y-4">
      <div class="skeleton h-8 w-40" />
      <div class="skeleton h-14 w-2/3" />
      <div class="skeleton h-64 w-full" />
    </div>

    <div v-else-if="!court" class="shell py-16 text-center">
      <p class="eyebrow">Đặt sân</p>
      <h1 class="page-title mt-2">{{ loadError || 'Không tìm thấy sân' }}</h1>
      <button type="button" class="btn-primary mt-8 px-6 py-3 rounded-2xl text-[14px]" @click="router.push({ name: 'courts' })">
        Về danh sách sân
      </button>
    </div>

    <template v-else>
      <header class="relative overflow-hidden min-h-[220px] sm:min-h-[280px] flex items-end">
        <img
          :src="productImageUrl(court.image, { w: 1600, h: 900 })"
          :alt="court.name"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div
          class="absolute inset-0"
          style="background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.78) 100%)"
        />
        <div class="shell relative z-10 w-full pb-8 pt-20 text-white">
          <button type="button" class="inline-flex items-center gap-2 text-[13px] font-semibold opacity-85 hover:opacity-100" @click="router.push({ name: 'courts' })">
            <span class="inline-flex rotate-180" aria-hidden="true"><Icon name="arrowRight" :size="16" /></span>
            Danh sách sân
          </button>
          <p class="mt-5 text-[11px] uppercase tracking-[0.16em] opacity-80">
            {{ court.district }} · {{ court.courts }} mặt sân · {{ court.hours }}
          </p>
          <h1 class="font-heading font-extrabold mt-3 text-[clamp(28px,5vw,48px)] leading-[1.05] tracking-tight">
            {{ court.name }}
          </h1>
          <div class="mt-4 flex flex-wrap items-center gap-3 text-[13px] opacity-90">
            <Stars :rating="court.rating" />
            <span>{{ formatCurrency(court.price) }}/giờ</span>
            <span>{{ court.surfaces }}</span>
          </div>
        </div>
      </header>

      <div class="shell pt-8">
        <div class="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div>
            <p class="eyebrow">Bước 1 / 2</p>
            <h2 class="page-title mt-2 text-[clamp(22px,3vw,32px)]">Chọn khung giờ</h2>
            <p class="lede mt-2 text-[14.5px]">
              Kéo trên từng hàng để chọn giờ cho sân đó. Có thể chọn nhiều sân, mỗi sân một khung giờ khác nhau.
              Bấm lại phần đã chọn để bỏ. Cuối tuần tối thiểu {{ minHours }} giờ / sân.
            </p>
          </div>
          <label class="flex items-center gap-2 text-[13px]" style="color: var(--text-2)">
            Ngày
            <input
              v-model="date"
              type="date"
              class="input-field rounded-xl px-3 py-2 text-[14px] mono"
              :min="minDate"
            />
          </label>
        </div>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] mb-4" style="color: var(--text-2)">
          <span class="inline-flex items-center gap-1.5"><i class="tl-swatch is-free" /> Trống</span>
          <span class="inline-flex items-center gap-1.5"><i class="tl-swatch is-booked" /> Đã đặt</span>
          <span class="inline-flex items-center gap-1.5"><i class="tl-swatch is-locked" /> Khoá</span>
          <span class="inline-flex items-center gap-1.5"><i class="tl-swatch is-selected" /> Đang chọn</span>
          <a href="#court-info" class="btn-text text-[12.5px] ml-auto">Xem sân &amp; bảng giá</a>
        </div>

        <p class="text-[12.5px] mb-4" style="color: var(--text-3)">
          {{ formatBookingDate(date) }} · Mở cửa {{ court.hours }}.
          Không hoàn tiền khi huỷ. Liên hệ {{ court.phone || 'hotline sân' }} nếu cần đổi giờ.
        </p>

        <div class="surface overflow-hidden">
          <div v-if="loadingSlots" class="p-10 text-center text-sm" style="color: var(--text-3)">Đang tải lịch sân...</div>
          <div v-else class="timeline-scroll" @pointerup="onPointerUp" @pointermove="onGridPointerMove" @pointercancel="onPointerUp">
            <div
              class="timeline"
              :style="{ '--cols': columns, '--col-w': '26px' }"
            >
              <div class="timeline__corner" />
              <div
                v-for="label in hours"
                :key="label"
                class="timeline__hour mono"
              >
                {{ label.replace(':00', 'h') }}
              </div>

              <template v-for="row in rows" :key="row">
                <div class="timeline__row-label mono">Sân {{ row }}</div>
                <button
                  v-for="i in columns"
                  :key="`${row}-${i - 1}`"
                  type="button"
                  class="timeline__cell"
                  :class="`is-${cellState(row, i - 1)}`"
                  :title="cellTitle(row, i - 1)"
                  :data-row="row"
                  :data-slot="i - 1"
                  :aria-pressed="cellState(row, i - 1) === 'selected'"
                  @pointerdown.prevent="onCellPointerDown(row, i - 1, $event)"
                  @pointerenter="onCellPointerEnter(row, i - 1)"
                />
              </template>
            </div>
          </div>
        </div>

        <section id="court-info" class="mt-10 grid gap-4 sm:grid-cols-3">
          <div class="surface p-5">
            <p class="text-[11px] uppercase tracking-[0.08em]" style="color: var(--text-3)">Địa chỉ</p>
            <p class="mt-2 text-[14px] font-medium">{{ court.address }}</p>
          </div>
          <div class="surface p-5">
            <p class="text-[11px] uppercase tracking-[0.08em]" style="color: var(--text-3)">Giá / giờ</p>
            <p class="mt-2 mono text-[20px] font-semibold">{{ formatCurrency(court.price) }}</p>
          </div>
          <div class="surface p-5">
            <p class="text-[11px] uppercase tracking-[0.08em]" style="color: var(--text-3)">Liên hệ</p>
            <p class="mt-2 text-[14px] font-medium">{{ court.phone || '—' }}</p>
            <p class="mt-1 text-[13px]" style="color: var(--text-3)">{{ court.hours }}</p>
          </div>
        </section>
      </div>

      <div class="timeline-bar">
        <div class="shell flex flex-wrap items-center gap-3 py-3">
          <div class="min-w-0 flex-1">
            <p v-if="pickedSlots.length" class="text-[13.5px] font-semibold truncate" :title="pickedSummary">
              {{ pickedSlots.length }} sân · {{ selectedHoursTotal }} giờ · {{ pickedSummary }}
            </p>
            <p v-else class="text-[13.5px]" style="color: var(--text-3)">Chưa chọn khung giờ</p>
            <p v-if="pickError" class="text-[12.5px] mt-0.5" style="color: #f87171">{{ pickError }}</p>
          </div>
          <div v-if="pickedSlots.length" class="mono text-[16px] font-semibold" style="color: var(--accent)">
            {{ formatCurrency(selectedTotal) }}
          </div>
          <button
            type="button"
            class="btn-primary rounded-xl px-5 py-3 text-[14px] font-semibold disabled:opacity-35"
            :disabled="!pickedSlots.length || closed"
            @click="continueToCheckout"
          >
            Tiếp tục thanh toán
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.tl-swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid var(--line);
  display: inline-block;
}
.tl-swatch.is-free { background: var(--bg); }
.tl-swatch.is-booked { background: #ef4444; border-color: #ef4444; }
.tl-swatch.is-locked { background: var(--bg-3); }
.tl-swatch.is-selected { background: var(--accent); border-color: var(--accent); }

.timeline-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.timeline {
  display: grid;
  grid-template-columns: 64px repeat(var(--cols), var(--col-w));
  min-width: max-content;
  user-select: none;
}

.timeline__corner {
  position: sticky;
  left: 0;
  z-index: 2;
  background: var(--bg-2);
  border-bottom: 1px solid var(--line);
  border-right: 1px solid var(--line);
}

.timeline__hour {
  grid-column: span 2;
  font-size: 10px;
  color: var(--text-3);
  padding: 8px 0 6px 4px;
  border-bottom: 1px solid var(--line);
  border-right: 1px solid var(--line);
}

.timeline__row-label {
  position: sticky;
  left: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: 11px;
  color: var(--text-2);
  background: var(--bg-1);
  border-right: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.timeline__cell {
  height: 28px;
  border-right: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  background: var(--bg);
  touch-action: none;
}
.timeline__cell.is-available:hover { background: var(--accent-soft); }
.timeline__cell.is-booked { background: #ef4444; cursor: not-allowed; }
.timeline__cell.is-locked { background: var(--bg-3); cursor: not-allowed; }
.timeline__cell.is-selected { background: var(--accent); }

.timeline-bar {
  position: sticky;
  bottom: 0;
  z-index: var(--z-sticky);
  background: var(--nav-bg);
  border-top: 1px solid var(--line);
  backdrop-filter: blur(16px);
}

@media (max-width: 767px) {
  .timeline-bar {
    bottom: 64px;
  }
}
</style>
