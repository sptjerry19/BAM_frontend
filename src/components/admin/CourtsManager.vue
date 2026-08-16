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
  image: 'https://jbam.id.vn/src/assets/uploads/background1.jpg',
  x: 50,
  y: 50,
  lat: 21.0278,
  lng: 105.8342,
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
  <div class="admin-page">
    <header class="admin-page__head admin-page__head--row">
      <div>
        <p class="eyebrow">Cơ sở</p>
        <h1 class="page-title mt-2">Quản lý sân</h1>
        <p class="lede mt-3">{{ courts.length }} sân trong hệ thống</p>
      </div>
      <button type="button" class="btn-primary rounded-xl px-5 py-3 text-[14px] font-semibold" @click="openAdd">
        Thêm sân
      </button>
    </header>

    <!-- Mobile cards -->
    <div class="md:hidden space-y-3">
      <div v-if="loading" class="surface p-8 text-center text-sm" style="color: var(--text-3)">Đang tải...</div>
      <motion.article
        v-for="(court, i) in courts"
        :key="court.id"
        class="surface p-4"
        :initial="{ opacity: 0, y: 10 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: i * 0.04 }"
      >
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="min-w-0">
            <div class="font-semibold text-[15px] leading-snug">{{ court.name }}</div>
            <div class="text-[12px] mt-1" style="color: var(--text-3)">{{ court.address }}</div>
          </div>
          <StatusPill :status="court.status" />
        </div>
        <div class="grid grid-cols-2 gap-2 text-[12px] mb-3">
          <div class="rounded-xl p-2.5" style="background: var(--bg-2); border: 1px solid var(--line)">
            <div style="color: var(--text-3)">Quận</div>
            <div class="mt-0.5 font-medium">{{ court.district }}</div>
          </div>
          <div class="rounded-xl p-2.5" style="background: var(--bg-2); border: 1px solid var(--line)">
            <div style="color: var(--text-3)">Giá/giờ</div>
            <div class="mt-0.5 mono font-medium">{{ formatCurrency(court.price) }}</div>
          </div>
          <div class="rounded-xl p-2.5" style="background: var(--bg-2); border: 1px solid var(--line)">
            <div style="color: var(--text-3)">Số sân</div>
            <div class="mt-0.5 mono font-medium">{{ court.courts }}</div>
          </div>
          <div class="rounded-xl p-2.5" style="background: var(--bg-2); border: 1px solid var(--line)">
            <div style="color: var(--text-3)">Giờ mở</div>
            <div class="mt-0.5 font-medium">{{ court.hours }}</div>
          </div>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn-ghost flex-1 text-[12px] py-2.5 rounded-xl font-semibold" @click="openEdit(court)">Sửa</button>
          <button
            type="button"
            class="flex-1 text-[12px] py-2.5 rounded-xl font-semibold"
            style="background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.2)"
            @click="remove(court.id)"
          >
            Xóa
          </button>
        </div>
      </motion.article>
    </div>

    <!-- Desktop table -->
    <div class="hidden md:block surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr style="color: var(--text-3); border-bottom: 1px solid var(--line)">
              <th class="text-left p-4 font-semibold text-[11px] uppercase tracking-[0.08em]">Sân</th>
              <th class="text-left p-4 font-semibold text-[11px] uppercase tracking-[0.08em]">Quận</th>
              <th class="text-left p-4 font-semibold text-[11px] uppercase tracking-[0.08em]">Giá/giờ</th>
              <th class="text-left p-4 font-semibold text-[11px] uppercase tracking-[0.08em]">Số sân</th>
              <th class="text-left p-4 font-semibold text-[11px] uppercase tracking-[0.08em]">Giờ mở</th>
              <th class="text-left p-4 font-semibold text-[11px] uppercase tracking-[0.08em]">Trạng thái</th>
              <th class="text-right p-4 font-semibold text-[11px] uppercase tracking-[0.08em]">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="p-8 text-center" style="color: var(--text-3)">Đang tải...</td>
            </tr>
            <tr
              v-for="court in courts"
              :key="court.id"
              class="admin-row"
              style="border-bottom: 1px solid var(--line)"
            >
              <td class="p-4">
                <div class="font-semibold">{{ court.name }}</div>
                <div class="text-[12px] mt-0.5 truncate max-w-[220px]" style="color: var(--text-3)">{{ court.address }}</div>
              </td>
              <td class="p-4" style="color: var(--text-2)">{{ court.district }}</td>
              <td class="p-4 mono font-medium">{{ formatCurrency(court.price) }}</td>
              <td class="p-4 mono">{{ court.courts }}</td>
              <td class="p-4" style="color: var(--text-2)">{{ court.hours }}</td>
              <td class="p-4"><StatusPill :status="court.status" /></td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button type="button" class="btn-ghost text-[12px] py-2 px-3 rounded-xl font-semibold" @click="openEdit(court)">
                    Sửa
                  </button>
                  <button
                    type="button"
                    class="btn-ghost text-[12px] py-2 px-3 rounded-xl font-semibold"
                    style="color: #ef4444"
                    @click="remove(court.id)"
                  >
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
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
          <div class="grid grid-cols-2 gap-4">
            <FormField
              v-model="form.lat"
              label="Vĩ độ (lat)"
              type="number"
              step="0.0000001"
              :min="-90"
              :max="90"
            />
            <FormField
              v-model="form.lng"
              label="Kinh độ (lng)"
              type="number"
              step="0.0000001"
              :min="-180"
              :max="180"
            />
          </div>
          <p class="text-[11.5px] -mt-2" style="color: var(--text-3)">
            Lấy tọa độ bằng cách chuột phải vị trí trên Google Maps → chọn cặp số hiện ra.
          </p>
          <FormField v-model="form.status" label="Trạng thái" type="select" :options="statusOptions" />
          <FormField v-model="form.phone" label="Điện thoại" />
          <FormField v-model="form.hours" label="Giờ mở cửa" />
          <div class="flex gap-3 pt-2">
            <button type="button" class="btn-primary flex-1 rounded-xl py-3 text-[14px] font-semibold" @click="save">
              Lưu
            </button>
            <button type="button" class="btn-ghost flex-1 rounded-xl py-3 text-[14px] font-semibold" @click="showModal = false">
              Hủy
            </button>
          </div>
        </div>
      </Modal>
    </AnimatePresence>
  </div>
</template>
