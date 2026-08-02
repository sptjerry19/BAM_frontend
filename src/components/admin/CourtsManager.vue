<script setup>
import { ref, onMounted } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import { getCourts, createCourt, updateCourt, deleteCourt } from '../../api'
import Modal from '../common/Modal.vue'
import FormField from '../common/FormField.vue'
import StatusPill from '../common/StatusPill.vue'
import { formatCurrency } from '../../utils/labels'

const courts = ref([])
const loading = ref(true)
const showModal = ref(false)
const editing = ref(null)

const emptyForm = () => ({
  id: '',
  name: '',
  address: '',
  district: '',
  price: 50000,
  surfaces: 'PVC',
  courts: 4,
  status: 'open',
  rating: 4,
  phone: '',
  hours: '6:00 - 22:00',
  image: 'photo-1626224583764-f87db24ac4ea',
  x: 50,
  y: 50,
})

const form = ref(emptyForm())

const statusOptions = [
  { value: 'open', label: 'Đang mở' },
  { value: 'busy', label: 'Đông' },
  { value: 'closed', label: 'Đóng' },
]

async function load() {
  loading.value = true
  try {
    courts.value = await getCourts()
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openAdd() {
  editing.value = null
  form.value = emptyForm()
  form.value.id = `c${Date.now()}`
  showModal.value = true
}

function openEdit(court) {
  editing.value = court
  form.value = { ...court }
  showModal.value = true
}

async function save() {
  if (editing.value) {
    const { id, ...data } = form.value
    await updateCourt(editing.value.id, data)
  } else {
    await createCourt(form.value)
  }
  showModal.value = false
  await load()
}

async function remove(id) {
  if (confirm('Xóa sân này?')) {
    await deleteCourt(id)
    await load()
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
      <div>
        <h1 class="page-title">Quản lý sân</h1>
        <p class="mt-1 text-sm" style="color: #64748b">
          {{ courts.length }} sân trong hệ thống
        </p>
      </div>
      <motion.button
        type="button"
        class="btn-primary rounded-xl px-5 py-2.5 text-sm w-full sm:w-auto"
        :whileHover="{ scale: 1.02 }"
        :whileTap="{ scale: 0.97 }"
        @click="openAdd"
      >
        + Thêm sân
      </motion.button>
    </div>

    <!-- Mobile cards -->
    <div class="md:hidden space-y-3">
      <div v-if="loading" class="glass rounded-2xl p-6 text-center text-sm" style="color: #64748b">Đang tải...</div>
      <motion.div
        v-for="(court, i) in courts"
        :key="court.id"
        class="glass rounded-2xl p-4"
        :initial="{ opacity: 0, y: 10 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: i * 0.04 }"
      >
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="min-w-0">
            <div class="font-semibold text-sm leading-snug">{{ court.name }}</div>
            <div class="text-xs mt-1" style="color: #64748b">{{ court.address }}</div>
          </div>
          <StatusPill :status="court.status" />
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs mb-3">
          <div class="rounded-xl p-2.5" style="background: rgba(255,255,255,0.03)">
            <div style="color: #475569">Quận</div>
            <div class="mt-0.5 font-medium">{{ court.district }}</div>
          </div>
          <div class="rounded-xl p-2.5" style="background: rgba(255,255,255,0.03)">
            <div style="color: #475569">Giá/giờ</div>
            <div class="mt-0.5 mono font-medium" style="color: #84cc16">{{ formatCurrency(court.price) }}</div>
          </div>
          <div class="rounded-xl p-2.5" style="background: rgba(255,255,255,0.03)">
            <div style="color: #475569">Số sân</div>
            <div class="mt-0.5 mono font-medium">{{ court.courts }}</div>
          </div>
          <div class="rounded-xl p-2.5" style="background: rgba(255,255,255,0.03)">
            <div style="color: #475569">Giờ mở</div>
            <div class="mt-0.5 font-medium">{{ court.hours }}</div>
          </div>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn-ghost flex-1 text-xs py-2.5 rounded-xl" @click="openEdit(court)">Sửa</button>
          <button type="button" class="flex-1 text-xs py-2.5 rounded-xl" style="background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2)" @click="remove(court.id)">Xóa</button>
        </div>
      </motion.div>
    </div>

    <!-- Desktop table -->
    <div class="hidden md:block glass rounded-3xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr style="color: #64748b; border-bottom: 1px solid rgba(255,255,255,0.06)">
              <th class="text-left p-4 font-semibold uppercase tracking-wider" style="font-size: 11px">Sân</th>
              <th class="text-left p-4 font-semibold uppercase tracking-wider" style="font-size: 11px">Quận</th>
              <th class="text-left p-4 font-semibold uppercase tracking-wider" style="font-size: 11px">Giá/giờ</th>
              <th class="text-left p-4 font-semibold uppercase tracking-wider" style="font-size: 11px">Số sân</th>
              <th class="text-left p-4 font-semibold uppercase tracking-wider" style="font-size: 11px">Giờ mở</th>
              <th class="text-left p-4 font-semibold uppercase tracking-wider" style="font-size: 11px">Trạng thái</th>
              <th class="text-right p-4 font-semibold uppercase tracking-wider" style="font-size: 11px">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="p-8 text-center" style="color: #64748b">Đang tải...</td>
            </tr>
            <motion.tr
              v-for="(court, i) in courts"
              :key="court.id"
              class="table-row"
              style="border-bottom: 1px solid rgba(255,255,255,0.04)"
              :initial="{ opacity: 0, x: -12 }"
              :animate="{ opacity: 1, x: 0 }"
              :transition="{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }"
            >
              <td class="p-4">
                <div class="font-medium" style="color: #f0f4ff">{{ court.name }}</div>
                <div class="text-xs mt-0.5 truncate max-w-[200px]" style="color: #64748b">{{ court.address }}</div>
              </td>
              <td class="p-4" style="color: #94a3b8">{{ court.district }}</td>
              <td class="p-4 mono" style="color: #84cc16">{{ formatCurrency(court.price) }}</td>
              <td class="p-4 mono" style="color: #f0f4ff">{{ court.courts }}</td>
              <td class="p-4" style="color: #94a3b8">{{ court.hours }}</td>
              <td class="p-4"><StatusPill :status="court.status" /></td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <motion.button
                    type="button"
                    class="btn-ghost text-xs py-1.5 px-3 rounded-lg"
                    :whileTap="{ scale: 0.95 }"
                    @click="openEdit(court)"
                  >
                    Sửa
                  </motion.button>
                  <motion.button
                    type="button"
                    class="btn-ghost text-xs py-1.5 px-3 rounded-lg"
                    style="color: #ef4444"
                    :whileTap="{ scale: 0.95 }"
                    @click="remove(court.id)"
                  >
                    Xóa
                  </motion.button>
                </div>
              </td>
            </motion.tr>
          </tbody>
        </table>
      </div>
    </div>

    <AnimatePresence>
      <Modal v-if="showModal" :title="editing ? 'Sửa sân' : 'Thêm sân'" @close="showModal = false">
        <div class="space-y-4">
          <FormField v-model="form.name" label="Tên sân" />
          <FormField v-model="form.address" label="Địa chỉ" />
          <FormField v-model="form.district" label="Quận" />
          <div class="grid grid-cols-2 gap-4">
            <FormField v-model="form.price" label="Giá/giờ" type="number" />
            <FormField v-model="form.courts" label="Số sân" type="number" />
          </div>
          <FormField v-model="form.surfaces" label="Mặt sân" />
          <FormField v-model="form.status" label="Trạng thái" type="select" :options="statusOptions" />
          <FormField v-model="form.phone" label="Điện thoại" />
          <FormField v-model="form.hours" label="Giờ mở cửa" />
          <div class="flex gap-3 pt-2">
            <motion.button
              type="button"
              class="btn-primary flex-1 rounded-xl py-2.5 text-sm"
              :whileTap="{ scale: 0.97 }"
              @click="save"
            >
              Lưu
            </motion.button>
            <motion.button
              type="button"
              class="btn-ghost flex-1 rounded-xl py-2.5 text-sm"
              :whileTap="{ scale: 0.97 }"
              @click="showModal = false"
            >
              Hủy
            </motion.button>
          </div>
        </div>
      </Modal>
    </AnimatePresence>
  </div>
</template>
