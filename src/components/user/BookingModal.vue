<script setup>
import { ref, inject, computed } from 'vue'
import { motion } from 'motion-v'
import { createBooking } from '../../api'
import FormField from '../common/FormField.vue'
import { formatCurrency } from '../../utils/labels'

const props = defineProps({
  court: { type: Object, required: true },
})

const emit = defineEmits(['close'])

const user = inject('user')

const date = ref(new Date().toISOString().slice(0, 10))
const startTime = ref('18:00')
const hours = ref(2)
const submitting = ref(false)
const booked = ref(false)
const error = ref('')

const totalPrice = computed(() => (props.court?.price || 0) * hours.value)

const hourOptions = [
  { value: 1, label: '1 giờ' },
  { value: 1.5, label: '1.5 giờ' },
  { value: 2, label: '2 giờ' },
  { value: 3, label: '3 giờ' },
  { value: 4, label: '4 giờ' },
]

async function submit() {
  error.value = ''
  submitting.value = true
  try {
    await createBooking({
      court_id: props.court.id,
      member_id: user.value?.id || 'm1',
      booking_date: date.value,
      start_time: startTime.value,
      hours: hours.value,
      status: 'confirmed',
    })
    booked.value = true
  } catch {
    error.value = 'Không thể đặt sân. Vui lòng thử lại.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <motion.div
    class="fixed inset-0 modal-backdrop flex items-end sm:items-center justify-center p-0 sm:p-4"
    style="z-index: var(--z-modal)"
    :initial="{ opacity: 0 }"
    :animate="{ opacity: 1 }"
    :exit="{ opacity: 0 }"
    @click="emit('close')"
  >
    <motion.div
      class="rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 w-full max-w-sm glass-strong max-h-[92dvh] overflow-y-auto"
      :initial="{ scale: 0.98, y: 40, opacity: 0 }"
      :animate="{ scale: 1, y: 0, opacity: 1 }"
      :exit="{ scale: 0.98, y: 24, opacity: 0 }"
      :transition="{ type: 'spring', stiffness: 400, damping: 30 }"
      @click.stop
    >
      <div v-if="booked" class="text-center py-4">
        <motion.div
          class="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
          style="background: rgba(132,204,22,0.15); border: 2px solid rgba(132,204,22,0.35)"
          :initial="{ scale: 0 }"
          :animate="{ scale: 1 }"
          :transition="{ type: 'spring', stiffness: 300, damping: 15 }"
        >
          ✓
        </motion.div>
        <h3 class="font-heading" style="font-size: 20px; font-weight: 800; color: #84cc16">
          Đặt sân thành công!
        </h3>
        <p style="color: #64748b; font-size: 13px; margin-top: 8px; margin-bottom: 20px">
          Chúng tôi sẽ xác nhận qua điện thoại trong 30 phút.
        </p>
        <motion.button
          class="btn-ghost px-6 py-2.5 rounded-xl text-sm"
          :while-hover="{ scale: 1.03 }"
          :while-tap="{ scale: 0.97 }"
          @click="emit('close')"
        >
          Đóng
        </motion.button>
      </div>

      <template v-else>
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="font-heading" style="font-size: 18px; font-weight: 800">Đặt sân</h2>
            <p style="color: #64748b; font-size: 12px; margin-top: 3px">{{ court.name }}</p>
          </div>
          <motion.button
            class="w-8 h-8 rounded-full flex items-center justify-center btn-ghost text-sm"
            :while-hover="{ scale: 1.1, rotate: 90 }"
            :while-tap="{ scale: 0.9 }"
            @click="emit('close')"
          >
            ✕
          </motion.button>
        </div>

        <div class="space-y-3">
          <FormField v-model="date" label="Ngày đặt" type="date" />
          <FormField v-model="startTime" label="Giờ bắt đầu" type="time" />
          <FormField v-model="hours" label="Số giờ" type="select" :options="hourOptions" />
        </div>

        <div
          class="flex items-center justify-between p-3 rounded-2xl mt-4"
          style="background: rgba(132,204,22,0.08); border: 1px solid rgba(132,204,22,0.15)"
        >
          <span style="color: #94a3b8; font-size: 13px">Tạm tính</span>
          <span class="mono text-base font-medium" style="color: #84cc16">{{ formatCurrency(totalPrice) }}</span>
        </div>

        <p v-if="error" class="text-red-400 text-sm mt-3">{{ error }}</p>

        <div class="flex gap-3 mt-4">
          <motion.button
            class="flex-1 btn-ghost py-2.5 rounded-xl text-sm"
            :while-hover="{ scale: 1.02 }"
            :while-tap="{ scale: 0.97 }"
            @click="emit('close')"
          >
            Hủy
          </motion.button>
          <motion.button
            class="flex-1 btn-primary py-2.5 rounded-xl text-sm"
            :disabled="submitting"
            :while-hover="{ scale: 1.02 }"
            :while-tap="{ scale: 0.97 }"
            @click="submit"
          >
            {{ submitting ? 'Đang đặt...' : 'Xác nhận' }}
          </motion.button>
        </div>
      </template>
    </motion.div>
  </motion.div>
</template>
