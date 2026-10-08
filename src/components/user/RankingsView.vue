<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { motion } from 'motion-v'
import { getRankings } from '../../api'
import { formatCurrency, levelLabels } from '../../utils/labels'

const router = useRouter()

const TABS = [
  { id: 'athletes', label: 'Vận động viên' },
  { id: 'members', label: 'Thành viên' },
]

const tab = ref('athletes')
const athletes = ref([])
const members = ref([])
const loading = ref(true)
const loadError = ref('')

const topAthletes = computed(() => athletes.value.slice(0, 5))

onMounted(async () => {
  loading.value = true
  loadError.value = ''
  try {
    const data = await getRankings(20)
    athletes.value = data.athletes
    members.value = data.members
  } catch {
    loadError.value = 'Không tải được bảng xếp hạng. Thử lại sau.'
  } finally {
    loading.value = false
  }
})

function medal(rank) {
  if (rank === 1) return '#f5c542'
  if (rank === 2) return '#c0c7d1'
  if (rank === 3) return '#c47a3a'
  if (rank <= 5) return 'var(--accent)'
  return null
}

function trendLabel(t) {
  if (t === 'up') return 'Tăng'
  if (t === 'down') return 'Giảm'
  return 'Giữ'
}

function openAthlete(a) {
  router.push({ name: 'athlete-profile', params: { id: a.id } })
}
</script>

<template>
  <div>
    <header class="max-w-3xl">
      <p class="eyebrow">Xếp hạng</p>
      <h1 class="page-title mt-2">Bảng xếp hạng</h1>
      <p class="lede mt-3">
        Theo dõi thứ hạng vận động viên theo điểm giải và thành viên theo giờ chơi trong tháng.
      </p>
    </header>

    <p v-if="loading" class="lede mt-8">Đang tải bảng xếp hạng…</p>
    <p v-else-if="loadError" class="lede mt-8">{{ loadError }}</p>

    <div v-else class="flex gap-2 mt-8" role="tablist" aria-label="Loại xếp hạng">
      <button
        v-for="t in TABS"
        :key="t.id"
        type="button"
        role="tab"
        class="px-5 py-2.5 rounded-full text-[13.5px] font-semibold"
        :aria-selected="tab === t.id"
        :style="{
          background: tab === t.id ? 'var(--text)' : 'transparent',
          color: tab === t.id ? 'var(--bg)' : 'var(--text-2)',
          border: `1px solid ${tab === t.id ? 'var(--text)' : 'var(--line)'}`,
        }"
        @click="tab = t.id"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- Top 5 athletes highlight -->
    <section v-if="!loading && !loadError && tab === 'athletes'" class="mt-10" aria-labelledby="top5-title">
      <h2 id="top5-title" class="section-head">Top 5 nổi bật</h2>
      <p class="mt-2 text-[14px]" style="color: var(--text-3)">Chạm vào thẻ để xem hồ sơ chi tiết.</p>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5 mt-6">
        <motion.button
          v-for="(a, i) in topAthletes"
          :key="a.id"
          type="button"
          class="surface overflow-hidden text-left group"
          :class="a.rank === 1 ? 'sm:col-span-2 xl:col-span-1' : ''"
          :initial="{ opacity: 0, y: 16 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: i * 0.05 }"
          @click="openAthlete(a)"
        >
          <div class="relative aspect-[4/5] overflow-hidden">
            <img
              :src="a.avatar"
              :alt="a.name"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            <div
              class="absolute inset-0"
              style="background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.78))"
            />
            <span
              class="absolute top-3 left-3 mono w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold"
              :style="{
                background: medal(a.rank) || 'var(--bg)',
                color: a.rank <= 3 ? '#111' : 'var(--bg)',
                border: '2px solid rgba(255,255,255,0.35)',
              }"
            >
              {{ a.rank }}
            </span>
            <div class="absolute inset-x-0 bottom-0 p-4 text-white">
              <p class="font-heading font-bold text-[17px] leading-tight">{{ a.name }}</p>
              <p class="text-[12.5px] opacity-85 mt-1">{{ a.club }}</p>
              <div class="flex items-center justify-between mt-3 text-[12.5px]">
                <span class="mono font-medium">{{ a.points.toLocaleString('vi-VN') }} điểm</span>
                <span class="opacity-85">{{ a.win }}–{{ a.loss }}</span>
              </div>
            </div>
          </div>
          <div class="px-3.5 py-3 flex items-center justify-between text-[12.5px]" style="border-top: 1px solid var(--line)">
            <span style="color: var(--text-3)">{{ levelLabels[a.level] || a.level }}</span>
            <span class="font-semibold" style="color: var(--accent)">Xem hồ sơ</span>
          </div>
        </motion.button>
      </div>
    </section>

    <!-- Member top 3 (simpler) -->
    <div v-else-if="!loading && !loadError" class="grid gap-4 sm:grid-cols-3 mt-8">
      <motion.div
        v-for="(top, i) in members.slice(0, 3)"
        :key="`m-${top.rank}`"
        class="surface p-5 text-center"
        :initial="{ opacity: 0, y: 14 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: i * 0.06 }"
      >
        <img :src="top.avatar" :alt="top.name" class="w-16 h-16 rounded-full object-cover mx-auto" />
        <p class="font-heading font-bold text-[18px] mt-4">{{ top.name }}</p>
        <p class="text-[13px] mt-1" style="color: var(--text-3)">{{ levelLabels[top.level] || top.level }}</p>
        <p class="mono text-[20px] font-medium mt-4" style="color: var(--accent)">{{ top.hours }}h</p>
      </motion.div>
    </div>

    <!-- Full list -->
    <div v-if="!loading && !loadError" class="surface mt-8 overflow-x-auto">
      <table class="w-full text-left min-w-[680px]">
        <thead>
          <tr class="text-[11px] uppercase tracking-[0.1em]" style="color: var(--text-3)">
            <th class="px-5 py-4 font-semibold">#</th>
            <th class="px-5 py-4 font-semibold">{{ tab === 'athletes' ? 'Vận động viên' : 'Thành viên' }}</th>
            <th v-if="tab === 'athletes'" class="px-5 py-4 font-semibold">CLB</th>
            <th v-else class="px-5 py-4 font-semibold">Hạng</th>
            <th class="px-5 py-4 font-semibold">{{ tab === 'athletes' ? 'Điểm' : 'Giờ chơi' }}</th>
            <th class="px-5 py-4 font-semibold">{{ tab === 'athletes' ? 'W–L' : 'Lượt đặt' }}</th>
            <th v-if="tab === 'members'" class="px-5 py-4 font-semibold">Chi tiêu</th>
            <th class="px-5 py-4 font-semibold">Xu hướng</th>
            <th v-if="tab === 'athletes'" class="px-5 py-4 font-semibold"><span class="sr-only">Hồ sơ</span></th>
          </tr>
        </thead>
        <tbody>
          <template v-if="tab === 'athletes'">
            <motion.tr
              v-for="(row, i) in athletes"
              :key="row.id"
              class="cursor-pointer transition-colors hover:bg-[var(--bg-2)]"
              style="border-top: 1px solid var(--line)"
              :initial="{ opacity: 0 }"
              :animate="{ opacity: 1 }"
              :transition="{ delay: Math.min(i, 8) * 0.03 }"
              @click="openAthlete(row)"
            >
              <td class="px-5 py-3.5">
                <span class="mono font-semibold" :style="{ color: medal(row.rank) || 'var(--text)' }">{{ row.rank }}</span>
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <img :src="row.avatar" :alt="row.name" class="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p class="font-semibold text-[14px]">{{ row.name }}</p>
                    <p class="text-[12px]" style="color: var(--text-3)">@{{ row.handle }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5 text-[13.5px]" style="color: var(--text-2)">{{ row.club }}</td>
              <td class="px-5 py-3.5 mono text-[14px]">{{ row.points.toLocaleString('vi-VN') }}</td>
              <td class="px-5 py-3.5 mono text-[13.5px]" style="color: var(--text-2)">{{ row.win }}–{{ row.loss }}</td>
              <td
                class="px-5 py-3.5 text-[12.5px] font-semibold"
                :style="{ color: row.trend === 'up' ? 'var(--accent)' : row.trend === 'down' ? '#f87171' : 'var(--text-3)' }"
              >
                {{ trendLabel(row.trend) }}
              </td>
              <td class="px-5 py-3.5 text-[13px] font-semibold" style="color: var(--accent)">Xem</td>
            </motion.tr>
          </template>
          <template v-else>
            <motion.tr
              v-for="(row, i) in members"
              :key="`mem-${row.rank}`"
              style="border-top: 1px solid var(--line)"
              :initial="{ opacity: 0 }"
              :animate="{ opacity: 1 }"
              :transition="{ delay: Math.min(i, 8) * 0.03 }"
            >
              <td class="px-5 py-3.5">
                <span class="mono font-semibold" :style="{ color: medal(row.rank) || 'var(--text)' }">{{ row.rank }}</span>
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <img :src="row.avatar" :alt="row.name" class="w-10 h-10 rounded-full object-cover" />
                  <span class="font-semibold text-[14px]">{{ row.name }}</span>
                </div>
              </td>
              <td class="px-5 py-3.5 text-[13.5px]" style="color: var(--text-2)">{{ levelLabels[row.level] || row.level }}</td>
              <td class="px-5 py-3.5 mono text-[14px]">{{ row.hours }}h</td>
              <td class="px-5 py-3.5 mono text-[13.5px]" style="color: var(--text-2)">{{ row.bookings }}</td>
              <td class="px-5 py-3.5 mono text-[13.5px]">{{ formatCurrency(row.spend) }}</td>
              <td
                class="px-5 py-3.5 text-[12.5px] font-semibold"
                :style="{ color: row.trend === 'up' ? 'var(--accent)' : row.trend === 'down' ? '#f87171' : 'var(--text-3)' }"
              >
                {{ trendLabel(row.trend) }}
              </td>
            </motion.tr>
          </template>
        </tbody>
      </table>
    </div>

    <p class="mt-5 text-[12.5px]" style="color: var(--text-3)">
      Vận động viên xếp theo điểm. Thành viên xếp theo giờ đặt sân trong tháng này.
    </p>
  </div>
</template>
