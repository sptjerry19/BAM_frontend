<script setup>
import { ref, onMounted, watch } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import { getMembers, getMember, updateMemberStatus, deleteMember } from '../../api'
import Modal from '../common/Modal.vue'
import StatusPill from '../common/StatusPill.vue'
import { levelLabels, levelColors, formatCurrency } from '../../utils/labels'

const members = ref([])
const loading = ref(true)
const search = ref('')
const levelFilter = ref('')
const selected = ref(null)
const detail = ref(null)
const acting = ref(false)
const actionError = ref('')

const levels = [
  { value: '', label: 'Tất cả' },
  ...Object.entries(levelLabels).map(([value, label]) => ({ value, label })),
]

async function load() {
  loading.value = true
  try {
    members.value = await getMembers(search.value || undefined, levelFilter.value || undefined)
  } finally {
    loading.value = false
  }
}

onMounted(load)

watch([search, levelFilter], load)

async function openDetail(member) {
  selected.value = member
  detail.value = await getMember(member.id)
}

function closeDetail() {
  selected.value = null
  detail.value = null
  actionError.value = ''
}

function apiError(err) {
  return err?.api?.message || err?.response?.data?.message || 'Không thực hiện được. Thử lại.'
}

async function toggleHidden() {
  if (!detail.value || acting.value) return
  acting.value = true
  actionError.value = ''
  const next = detail.value.status === 'active' ? 'inactive' : 'active'
  try {
    const updated = await updateMemberStatus(detail.value.id, next)
    detail.value = { ...detail.value, ...updated }
    const index = members.value.findIndex((m) => String(m.id) === String(updated.id))
    if (index >= 0) members.value[index] = { ...members.value[index], ...updated }
  } catch (err) {
    actionError.value = apiError(err)
  } finally {
    acting.value = false
  }
}

async function removeAccount() {
  if (!detail.value || acting.value) return
  const name = detail.value.name
  if (!confirm(`Xóa tài khoản của ${name}? Hồ sơ thành viên và đăng nhập sẽ bị gỡ.`)) return
  acting.value = true
  actionError.value = ''
  try {
    await deleteMember(detail.value.id)
    closeDetail()
    await load()
  } catch (err) {
    actionError.value = apiError(err)
  } finally {
    acting.value = false
  }
}

const winRate = (m) => (m.matches ? Math.round((m.wins / m.matches) * 100) : 0)
</script>

<template>
  <div class="admin-page">
    <header class="admin-page__head">
      <p class="eyebrow">Cộng đồng</p>
      <h1 class="page-title mt-2">Thành viên</h1>
      <p class="lede mt-3">{{ members.length }} thành viên trong hệ thống</p>
    </header>

    <div class="flex flex-col sm:flex-row gap-3 mb-5">
      <input
        v-model="search"
        class="input-field flex-1 rounded-xl px-4 py-3 text-[14px]"
        placeholder="Tìm theo tên, email, SĐT..."
      />
    </div>

    <div class="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Lọc cấp độ">
      <button
        v-for="lv in levels"
        :key="lv.value"
        type="button"
        role="tab"
        class="admin-chip"
        :class="{ 'is-active': levelFilter === lv.value }"
        :aria-selected="levelFilter === lv.value"
        @click="levelFilter = lv.value"
      >
        {{ lv.label }}
      </button>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="surface h-44 shimmer" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <motion.button
        v-for="(member, i) in members"
        :key="member.id"
        type="button"
        class="surface p-5 text-left w-full admin-row"
        :initial="{ opacity: 0, y: 14 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: Math.min(i, 8) * 0.04, duration: 0.32 }"
        @click="openDetail(member)"
      >
        <div class="flex items-center gap-4">
          <div class="relative shrink-0">
            <img
              :src="member.avatar"
              :alt="member.name"
              class="w-14 h-14 rounded-full object-cover"
              style="border: 2px solid var(--line)"
            />
            <span
              v-if="member.status === 'active'"
              class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style="background: var(--text); border-color: var(--bg-1)"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold truncate text-[15px]">{{ member.name }}</div>
            <div class="text-[12px] truncate mt-0.5" style="color: var(--text-3)">{{ member.email }}</div>
            <div class="flex items-center gap-2 mt-2 flex-wrap">
              <span
                class="admin-badge"
                :style="{
                  color: levelColors[member.level],
                  borderColor: `${levelColors[member.level]}40`,
                }"
              >
                {{ levelLabels[member.level] }}
              </span>
              <StatusPill :status="member.status" />
            </div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2 mt-4 text-center text-[12px]">
          <div class="rounded-xl py-2.5" style="background: var(--bg-2); border: 1px solid var(--line)">
            <div class="font-bold mono" :style="{ color: levelColors[member.level] }">{{ member.points }}</div>
            <div class="mt-0.5" style="color: var(--text-3)">Điểm</div>
          </div>
          <div class="rounded-xl py-2.5" style="background: var(--bg-2); border: 1px solid var(--line)">
            <div class="font-bold mono">{{ member.matches }}</div>
            <div class="mt-0.5" style="color: var(--text-3)">Trận</div>
          </div>
          <div class="rounded-xl py-2.5" style="background: var(--bg-2); border: 1px solid var(--line)">
            <div class="font-bold mono">{{ winRate(member) }}%</div>
            <div class="mt-0.5" style="color: var(--text-3)">Thắng</div>
          </div>
        </div>
      </motion.button>
    </div>

    <AnimatePresence>
      <Modal v-if="selected && detail" title="Chi tiết thành viên" @close="closeDetail">
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <img
              :src="detail.avatar"
              :alt="detail.name"
              class="w-16 h-16 rounded-full object-cover shrink-0"
              style="border: 2px solid var(--line)"
            />
            <div class="min-w-0">
              <div class="font-heading text-[20px] font-bold tracking-tight truncate">{{ detail.name }}</div>
              <div class="text-[13px] mt-0.5" style="color: var(--text-3)">{{ detail.email }}</div>
              <div class="text-[13px]" style="color: var(--text-3)">{{ detail.phone }}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-[14px]">
            <div class="rounded-xl p-3" style="background: var(--bg-2); border: 1px solid var(--line)">
              <div class="admin-label mb-1">Cấp độ</div>
              <div class="font-semibold" :style="{ color: levelColors[detail.level] }">{{ levelLabels[detail.level] }}</div>
            </div>
            <div class="rounded-xl p-3" style="background: var(--bg-2); border: 1px solid var(--line)">
              <div class="admin-label mb-1">Trạng thái</div>
              <StatusPill :status="detail.status" />
            </div>
            <div class="rounded-xl p-3" style="background: var(--bg-2); border: 1px solid var(--line)">
              <div class="admin-label mb-1">Điểm</div>
              <div class="font-bold mono" :style="{ color: levelColors[detail.level] }">{{ detail.points }}</div>
            </div>
            <div class="rounded-xl p-3" style="background: var(--bg-2); border: 1px solid var(--line)">
              <div class="admin-label mb-1">Tổng chi tiêu</div>
              <div class="font-bold mono">{{ formatCurrency(detail.total_cost) }}</div>
            </div>
            <div class="rounded-xl p-3" style="background: var(--bg-2); border: 1px solid var(--line)">
              <div class="admin-label mb-1">Trận / Thắng</div>
              <div class="mono">{{ detail.matches }} / {{ detail.wins }}</div>
            </div>
            <div class="rounded-xl p-3" style="background: var(--bg-2); border: 1px solid var(--line)">
              <div class="admin-label mb-1">Tỷ lệ thắng</div>
              <div class="font-bold mono">{{ winRate(detail) }}%</div>
            </div>
          </div>

          <div>
            <div class="admin-label mb-2">Thiết bị sở hữu</div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="eq in detail.equipment"
                :key="eq"
                class="admin-badge mono"
              >
                {{ eq }}
              </span>
            </div>
          </div>

          <div class="text-[12px] mono" style="color: var(--text-3)">Tham gia: {{ detail.join_date }}</div>

          <p v-if="actionError" class="text-[13px]" style="color: #ef4444">{{ actionError }}</p>

          <div class="flex gap-3 pt-1">
            <button
              type="button"
              class="btn-ghost flex-1 rounded-xl py-3 text-[14px] font-semibold disabled:opacity-40"
              :disabled="acting"
              @click="toggleHidden"
            >
              {{ detail.status === 'active' ? 'Ẩn tài khoản' : 'Hiện lại' }}
            </button>
            <button
              type="button"
              class="flex-1 rounded-xl py-3 text-[14px] font-semibold disabled:opacity-40"
              style="background: rgba(239,68,68,0.08); color: #ef4444; border: 1px solid rgba(239,68,68,0.2)"
              :disabled="acting"
              @click="removeAccount"
            >
              Xóa tài khoản
            </button>
          </div>
        </div>
      </Modal>
    </AnimatePresence>
  </div>
</template>
