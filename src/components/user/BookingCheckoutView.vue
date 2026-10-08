<script setup>
import { reactive, ref, inject, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { motion } from 'motion-v'
import { createBooking } from '../../api'
import Icon from '../common/Icon.vue'
import { formatCurrency } from '../../utils/labels'
import { formatBookingDate } from '../../utils/booking'
import {
  BOOKING_PAYMENTS,
  readBookingDraft,
  clearBookingDraft,
  isBookingDraftReady,
  bookingPaymentLabel,
} from '../../composables/useBookingDraft'

const user = inject('user')
const route = useRoute()
const router = useRouter()

const draft = ref(readBookingDraft())
const submitting = ref(false)
const submitError = ref('')
const booked = ref(false)
const result = ref(null)

const form = reactive({
  name: '',
  phone: '',
  email: '',
  note: '',
  payment_method: 'venue',
})

const errors = reactive({
  name: '',
  phone: '',
  email: '',
})

const ready = computed(() => isBookingDraftReady(draft.value, route.params.id))

const slots = computed(() => draft.value?.slots || [])

const selectedRange = computed(() => {
  const d = draft.value
  if (!d?.booking_date) return ''
  return `${formatBookingDate(d.booking_date)} · ${slots.value.length} sân`
})

onMounted(() => {
  if (!ready.value) {
    router.replace({ name: 'court-detail', params: { id: String(route.params.id) } })
    return
  }
  if (user.value) {
    form.name = user.value.name || ''
    form.phone = user.value.phone || ''
    form.email = user.value.email || ''
  }
})

function validate() {
  errors.name = form.name.trim() ? '' : 'Vui lòng nhập họ tên.'
  errors.phone = /^0\d{8,10}$/.test(form.phone.trim().replace(/\s/g, ''))
    ? ''
    : 'Số điện thoại không hợp lệ.'
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ? ''
    : 'Email không hợp lệ.'
  return !Object.values(errors).some(Boolean)
}

async function submit() {
  if (!ready.value || !validate()) return
  submitting.value = true
  submitError.value = ''
  try {
    const memberId = user.value?.id
    const attachMember = memberId && !String(memberId).startsWith('u_')
    result.value = await createBooking({
      court_id: draft.value.court_id,
      ...(attachMember ? { member_id: memberId } : {}),
      booking_date: draft.value.booking_date,
      slots: draft.value.slots.map((s) => ({
        court_number: s.court_number,
        start_time: s.start_time,
        hours: s.hours,
      })),
      customer_name: form.name.trim(),
      customer_phone: form.phone.trim().replace(/\s/g, ''),
      customer_email: form.email.trim(),
      payment_method: form.payment_method,
      note: form.note.trim() || null,
    })
    clearBookingDraft()
    booked.value = true
  } catch (err) {
    submitError.value =
      err?.api?.message
      || Object.values(err?.api?.errors || {})?.flat?.()?.[0]
      || Object.values(err?.response?.data?.errors || {})?.flat?.()?.[0]
      || 'Không đặt được sân. Thử khung giờ khác hoặc thử lại.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section v-if="booked" class="max-w-lg mx-auto text-center py-10">
    <motion.span
      class="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center"
      style="background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent-line)"
      :initial="{ scale: 0.6, opacity: 0 }"
      :animate="{ scale: 1, opacity: 1 }"
      :transition="{ type: 'spring', stiffness: 320, damping: 20 }"
    >
      <Icon name="check" :size="28" />
    </motion.span>
    <h1 class="page-title mt-6">Đã giữ sân</h1>
    <p class="lede mt-3">
      {{ draft.court_name || result?.court?.name }} · {{ selectedRange }}
    </p>
    <p class="mt-2 text-[14px]" style="color: var(--text-2)">
      {{ bookingPaymentLabel(result?.payment_method || form.payment_method) }}.
      Tổng {{ formatCurrency(result?.total_price || draft.total_price) }}.
    </p>
    <button
      type="button"
      class="btn-primary mt-8 px-6 py-3 rounded-2xl text-[14px]"
      @click="router.push({ name: 'courts' })"
    >
      Về danh sách sân
    </button>
  </section>

  <div v-else class="mx-auto max-w-2xl">
    <button
      type="button"
      class="btn-text inline-flex items-center gap-1.5 mb-6"
      @click="router.push({ name: 'court-detail', params: { id: String(route.params.id) } })"
    >
      <Icon name="arrowLeft" :size="16" />
      Chọn lại giờ
    </button>

    <p class="eyebrow">Bước 2 / 2</p>
    <h1 class="page-title mt-2">Thông tin thanh toán</h1>
    <p class="lede mt-3">
      Điền liên hệ và chọn cách thanh toán để giữ khung giờ vừa chọn.
    </p>

    <div class="surface p-5 sm:p-6 mt-8">
      <p class="text-[11px] uppercase tracking-[0.08em]" style="color: var(--text-3)">Khung giờ</p>
      <h2 class="font-heading font-bold text-[18px] mt-1">{{ draft.court_name }}</h2>
      <p class="text-[13px] mt-1" style="color: var(--text-3)">{{ formatBookingDate(draft.booking_date) }}</p>
      <ul class="mt-4 space-y-2 text-[13.5px]">
        <li
          v-for="slot in slots"
          :key="`${slot.court_number}-${slot.start_time}`"
          class="flex items-center justify-between gap-3"
        >
          <span>Sân {{ slot.court_number }} · {{ slot.start_time }}–{{ slot.end_time }}</span>
          <span class="mono" style="color: var(--text-2)">{{ formatCurrency(slot.total_price) }}</span>
        </li>
      </ul>
      <div
        class="flex items-center justify-between mt-4 pt-4 text-[14px] font-semibold"
        style="border-top: 1px solid var(--line)"
      >
        <span>Tổng</span>
        <span class="mono" style="color: var(--accent)">{{ formatCurrency(draft.total_price) }}</span>
      </div>
    </div>

    <motion.form
      class="surface p-6 sm:p-8 mt-5 space-y-5"
      :initial="{ opacity: 0, y: 16 }"
      :animate="{ opacity: 1, y: 0 }"
      @submit.prevent="submit"
    >
      <div>
        <label class="block text-[12px] uppercase tracking-[0.08em] mb-2" style="color: var(--text-3)" for="bk-name">
          Họ và tên
        </label>
        <input
          id="bk-name"
          v-model="form.name"
          type="text"
          autocomplete="name"
          class="input-field w-full px-3.5 py-3 rounded-xl text-[14px]"
          placeholder="Nguyễn Văn A"
        />
        <p v-if="errors.name" class="mt-1.5 text-[13px]" style="color: #f87171">{{ errors.name }}</p>
      </div>

      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="block text-[12px] uppercase tracking-[0.08em] mb-2" style="color: var(--text-3)" for="bk-phone">
            Số điện thoại
          </label>
          <input
            id="bk-phone"
            v-model="form.phone"
            type="tel"
            autocomplete="tel"
            class="input-field w-full px-3.5 py-3 rounded-xl text-[14px]"
            placeholder="09xxxxxxxx"
          />
          <p v-if="errors.phone" class="mt-1.5 text-[13px]" style="color: #f87171">{{ errors.phone }}</p>
        </div>
        <div>
          <label class="block text-[12px] uppercase tracking-[0.08em] mb-2" style="color: var(--text-3)" for="bk-email">
            Email
          </label>
          <input
            id="bk-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            class="input-field w-full px-3.5 py-3 rounded-xl text-[14px]"
            placeholder="ban@email.com"
          />
          <p v-if="errors.email" class="mt-1.5 text-[13px]" style="color: #f87171">{{ errors.email }}</p>
        </div>
      </div>

      <div>
        <label class="block text-[12px] uppercase tracking-[0.08em] mb-2" style="color: var(--text-3)" for="bk-note">
          Ghi chú (tuỳ chọn)
        </label>
        <textarea
          id="bk-note"
          v-model="form.note"
          rows="2"
          class="input-field w-full px-3.5 py-3 rounded-xl text-[14px]"
          placeholder="Số người chơi, cần thuê vợt..."
        />
      </div>

      <fieldset>
        <legend class="text-[12px] uppercase tracking-[0.08em] mb-3" style="color: var(--text-3)">
          Thanh toán
        </legend>
        <div class="space-y-2">
          <button
            v-for="method in BOOKING_PAYMENTS"
            :key="method.id"
            type="button"
            class="w-full text-left rounded-2xl px-4 py-3.5"
            :style="{
              border: `1px solid ${form.payment_method === method.id ? 'var(--accent-line)' : 'var(--line)'}`,
              background: form.payment_method === method.id ? 'var(--accent-soft)' : 'transparent',
            }"
            @click="form.payment_method = method.id"
          >
            <div class="text-[14px] font-semibold">{{ method.label }}</div>
            <div class="text-[12.5px] mt-0.5" style="color: var(--text-3)">{{ method.hint }}</div>
          </button>
        </div>
      </fieldset>

      <p v-if="submitError" class="text-[13px]" style="color: #f87171">{{ submitError }}</p>

      <motion.button
        type="submit"
        class="w-full mt-2 py-3.5 rounded-2xl btn-primary text-[15px] flex items-center justify-center gap-2 disabled:opacity-40"
        :disabled="submitting"
        :while-tap="{ scale: 0.985 }"
      >
        {{ submitting ? 'Đang giữ sân...' : `Xác nhận · ${formatCurrency(draft.total_price)}` }}
        <Icon v-if="!submitting" name="arrowRight" :size="17" />
      </motion.button>
    </motion.form>
  </div>
</template>
