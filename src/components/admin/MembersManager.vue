<script setup>
import { ref, onMounted, watch } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import { getMembers, getMember } from '../../api'
import Modal from '../common/Modal.vue'
import StatusPill from '../common/StatusPill.vue'
import { levelLabels, levelColors, formatCurrency } from '../../utils/labels'

const members = ref([])
const loading = ref(true)
const search = ref('')
const levelFilter = ref('')
const selected = ref(null)
const detail = ref(null)

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
}

const winRate = (m) => (m.matches ? Math.round((m.wins / m.matches) * 100) : 0)
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="page-title">Thành viên</h1>
      <p class="mt-1 text-sm" style="color: #64748b">{{ members.length }} thành viên</p>
    </div>

    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <input
        v-model="search"
        class="input-field flex-1 rounded-xl px-4 py-2.5 text-sm"
        placeholder="Tìm theo tên, email, SĐT..."
      />
    </div>

    <div class="flex flex-wrap gap-2 mb-6">
      <motion.button
        v-for="lv in levels"
        :key="lv.value"
        type="button"
        class="pill"
        :style="
          levelFilter === lv.value
            ? {
                background: `${levelColors[lv.value] || '#84cc16'}1f`,
                color: levelColors[lv.value] || '#84cc16',
                border: `1px solid ${levelColors[lv.value] || '#84cc16'}30`,
              }
            : { background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.08)' }
        "
        :whileTap="{ scale: 0.95 }"
        @click="levelFilter = lv.value"
      >
        {{ lv.label }}
      </motion.button>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="glass rounded-2xl h-44 shimmer" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <motion.button
        v-for="(member, i) in members"
        :key="member.id"
        type="button"
        class="glass rounded-2xl p-5 text-left table-row w-full"
        :initial="{ opacity: 0, y: 16 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: i * 0.05, duration: 0.35 }"
        :whileHover="{ y: -3 }"
        :whileTap="{ scale: 0.98 }"
        @click="openDetail(member)"
      >
        <div class="flex items-center gap-4">
          <div class="relative shrink-0">
            <img :src="member.avatar" :alt="member.name" class="w-14 h-14 rounded-full object-cover" />
            <span
              v-if="member.status === 'active'"
              class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style="background: #84cc16; border-color: #070b14"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate" style="color: #f0f4ff">{{ member.name }}</div>
            <div class="text-xs truncate mt-0.5" style="color: #64748b">{{ member.email }}</div>
            <div class="flex items-center gap-2 mt-2">
              <span
                class="pill text-xs"
                :style="{
                  background: `${levelColors[member.level]}1f`,
                  color: levelColors[member.level],
                  border: `1px solid ${levelColors[member.level]}30`,
                }"
              >
                {{ levelLabels[member.level] }}
              </span>
              <StatusPill :status="member.status" />
            </div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
          <div class="rounded-xl py-2.5" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)">
            <div class="font-bold mono" :style="{ color: levelColors[member.level] }">{{ member.points }}</div>
            <div style="color: #64748b; margin-top: 2px">Điểm</div>
          </div>
          <div class="rounded-xl py-2.5" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)">
            <div class="font-bold mono" style="color: #f0f4ff">{{ member.matches }}</div>
            <div style="color: #64748b; margin-top: 2px">Trận</div>
          </div>
          <div class="rounded-xl py-2.5" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)">
            <div class="font-bold mono" style="color: #facc15">{{ winRate(member) }}%</div>
            <div style="color: #64748b; margin-top: 2px">Thắng</div>
          </div>
        </div>
      </motion.button>
    </div>

    <AnimatePresence>
      <Modal v-if="selected && detail" title="Chi tiết thành viên" @close="closeDetail">
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            <div class="relative shrink-0">
              <img :src="detail.avatar" :alt="detail.name" class="w-16 h-16 rounded-full object-cover" />
              <span
                v-if="detail.status === 'active'"
                class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                style="background: #84cc16; border-color: #070b14"
              />
            </div>
            <div>
              <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 800; color: #f0f4ff">
                {{ detail.name }}
              </div>
              <div class="text-sm" style="color: #64748b">{{ detail.email }}</div>
              <div class="text-sm" style="color: #64748b">{{ detail.phone }}</div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="glass rounded-xl p-3">
              <div class="text-xs uppercase tracking-wider mb-1" style="color: #64748b">Cấp độ</div>
              <div :style="{ color: levelColors[detail.level], fontWeight: 600 }">{{ levelLabels[detail.level] }}</div>
            </div>
            <div class="glass rounded-xl p-3">
              <div class="text-xs uppercase tracking-wider mb-1" style="color: #64748b">Trạng thái</div>
              <StatusPill :status="detail.status" />
            </div>
            <div class="glass rounded-xl p-3">
              <div class="text-xs uppercase tracking-wider mb-1" style="color: #64748b">Điểm</div>
              <div class="font-bold mono" :style="{ color: levelColors[detail.level] }">{{ detail.points }}</div>
            </div>
            <div class="glass rounded-xl p-3">
              <div class="text-xs uppercase tracking-wider mb-1" style="color: #64748b">Tổng chi tiêu</div>
              <div class="font-bold mono" style="color: #f0f4ff">{{ formatCurrency(detail.total_cost) }}</div>
            </div>
            <div class="glass rounded-xl p-3">
              <div class="text-xs uppercase tracking-wider mb-1" style="color: #64748b">Trận / Thắng</div>
              <div class="mono" style="color: #f0f4ff">{{ detail.matches }} / {{ detail.wins }}</div>
            </div>
            <div class="glass rounded-xl p-3">
              <div class="text-xs uppercase tracking-wider mb-1" style="color: #64748b">Tỷ lệ thắng</div>
              <div class="font-bold mono" style="color: #facc15">{{ winRate(detail) }}%</div>
            </div>
          </div>

          <div>
            <div class="text-xs uppercase tracking-wider mb-2" style="color: #64748b">Thiết bị sở hữu</div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="eq in detail.equipment"
                :key="eq"
                class="pill mono"
                style="background: rgba(255,255,255,0.04); color: #94a3b8; border: 1px solid rgba(255,255,255,0.08)"
              >
                {{ eq }}
              </span>
            </div>
          </div>

          <div class="text-xs mono" style="color: #475569">Tham gia: {{ detail.join_date }}</div>
        </div>
      </Modal>
    </AnimatePresence>
  </div>
</template>
