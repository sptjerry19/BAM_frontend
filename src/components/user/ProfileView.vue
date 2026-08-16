<script setup>
import { inject, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { motion } from 'motion-v'
import Icon from '../common/Icon.vue'
import { levelLabels, levelColors, formatCurrency } from '../../utils/labels'

const router = useRouter()
const user = inject('user')
const tab = ref('posts')

const TABS = [
  { id: 'posts', label: 'Bài viết' },
  { id: 'about', label: 'Giới thiệu' },
  { id: 'stats', label: 'Thống kê' },
  { id: 'photos', label: 'Ảnh' },
]

const coverUrl = computed(() => {
  const seed = encodeURIComponent(user.value?.email || user.value?.name || 'jbam-member')
  return `https://picsum.photos/seed/${seed}-cover/1600/520`
})

const photoUrls = computed(() => {
  const seed = encodeURIComponent(user.value?.id || user.value?.email || 'jbam')
  return Array.from({ length: 9 }, (_, i) => `https://picsum.photos/seed/${seed}-p${i}/400/400`)
})

const losses = computed(() => Math.max(0, (user.value?.matches ?? 0) - (user.value?.wins ?? 0)))

const winRate = computed(() =>
  user.value?.matches ? Math.round((user.value.wins / user.value.matches) * 100) : 0,
)

const months = [
  { m: 'Tháng 5', short: 'T5', v: 680000 },
  { m: 'Tháng 6', short: 'T6', v: 920000 },
  { m: 'Tháng 7', short: 'T7', v: 750000 },
  { m: 'Tháng 8', short: 'T8', v: 430000 },
]
const maxCost = Math.max(...months.map((x) => x.v))

const bars = computed(() => [
  { label: `Thắng (${user.value?.wins ?? 0})`, pct: winRate.value, color: 'var(--accent)' },
  { label: `Thua (${losses.value})`, pct: 100 - winRate.value, color: '#94a3b8' },
])

const posts = computed(() => {
  if (!user.value) return []
  const first = user.value.name?.split(' ').pop() || 'bạn'
  return [
    {
      id: 'p1',
      time: '2 giờ trước',
      text: `Vừa kết thúc buổi tập tại sân. Phong độ ${winRate.value}% thắng gần đây — ${first} đang lên guồng!`,
      image: `https://picsum.photos/seed/${user.value.id || 'post1'}-a/900/520`,
      likes: 24 + (user.value.wins % 40),
      comments: 3 + (user.value.matches % 8),
    },
    {
      id: 'p2',
      time: 'Hôm qua',
      text: `Đã tích lũy ${Number(user.value.points || 0).toLocaleString('vi-VN')} điểm thành viên. Ai muốn đánh đôi cuối tuần không?`,
      image: null,
      likes: 18,
      comments: 7,
    },
    {
      id: 'p3',
      time: '3 ngày trước',
      text: 'Check-in sân mới — mặt sàn ổn, ánh sáng đẹp. Recommend cho ae khu Cầu Giấy.',
      image: `https://picsum.photos/seed/${user.value.id || 'post3'}-b/900/520`,
      likes: 41,
      comments: 12,
    },
  ]
})

const displayName = computed(() => user.value?.name || 'Thành viên')
const firstName = computed(() => displayName.value.split(' ').pop() || displayName.value)

function formatJoinDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
</script>

<template>
  <div v-if="!user" class="pb-10">
    <div class="h-[220px] sm:h-[300px] skeleton" style="border-radius: 0" />
    <div class="shell">
      <div class="flex gap-4 -mt-16 items-end">
        <div class="skeleton w-[148px] h-[148px] rounded-full shrink-0" />
        <div class="flex-1 space-y-3 pb-3">
          <div class="skeleton h-8 w-56" />
          <div class="skeleton h-4 w-40" />
        </div>
      </div>
      <div class="skeleton h-24 mt-6 rounded-2xl" />
    </div>
  </div>

  <div v-else class="pb-10">
    <!-- Cover -->
    <div class="relative">
      <div class="h-[200px] sm:h-[280px] md:h-[340px] overflow-hidden bg-[var(--bg-2)]">
        <img
          :src="coverUrl"
          :alt="`Ảnh bìa của ${displayName}`"
          class="w-full h-full object-cover"
        />
      </div>
      <div
        class="absolute inset-0 pointer-events-none"
        style="background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.4))"
      />
      <button
        type="button"
        class="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 px-3 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-2"
        style="background: rgba(255,255,255,0.92); color: #111; border: 1px solid rgba(0,0,0,0.08)"
      >
        <Icon name="spark" :size="16" />
        Chỉnh sửa ảnh bìa
      </button>
    </div>

    <div class="shell">
      <!-- Identity (FB) -->
      <div class="relative flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 -mt-14 sm:-mt-20">
        <div class="relative shrink-0 self-start">
          <img
            :src="user.avatar"
            :alt="displayName"
            class="w-[132px] h-[132px] sm:w-[168px] sm:h-[168px] rounded-full object-cover"
            style="border: 4px solid var(--bg); box-shadow: var(--shadow-md)"
          />
          <button
            type="button"
            class="absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center"
            style="background: var(--bg-2); border: 1px solid var(--line); color: var(--text)"
            aria-label="Đổi ảnh đại diện"
          >
            <Icon name="plus" :size="16" />
          </button>
        </div>

        <div class="flex-1 min-w-0 pb-1 sm:pb-2">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="font-heading font-extrabold text-[26px] sm:text-[34px] leading-none tracking-tight">
              {{ displayName }}
            </h1>
            <span
              class="pill text-[12px] font-semibold"
              :style="{
                background: `${levelColors[user.level]}22`,
                color: levelColors[user.level],
                border: `1px solid ${levelColors[user.level]}40`,
              }"
            >
              {{ levelLabels[user.level] || user.level }}
            </span>
          </div>
          <p class="mt-2 text-[14px]" style="color: var(--text-2)">
            {{ Number(user.points || 0).toLocaleString('vi-VN') }} điểm ·
            {{ user.matches || 0 }} trận ·
            {{ winRate }}% thắng
          </p>
          <p class="mt-1 text-[13.5px] truncate" style="color: var(--text-3)">
            {{ user.email }}
            <template v-if="user.phone"> · {{ user.phone }}</template>
          </p>
        </div>

        <div class="flex flex-wrap gap-2 pb-1 sm:pb-2">
          <button
            type="button"
            class="px-4 py-2.5 rounded-xl text-[14px] font-semibold"
            style="background: var(--accent); color: #0a1200"
          >
            Chỉnh sửa trang cá nhân
          </button>
          <button
            type="button"
            class="btn-ghost px-4 py-2.5 rounded-xl text-[14px] font-semibold"
            @click="router.push({ name: 'equipment' })"
          >
            Trang bị
          </button>
          <button
            type="button"
            class="btn-ghost px-4 py-2.5 rounded-xl text-[14px] font-semibold"
            @click="router.push({ name: 'courts' })"
          >
            Đặt sân
          </button>
        </div>
      </div>

      <!-- Stats strip -->
      <div
        class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 p-4 rounded-2xl"
        style="background: var(--bg-2); border: 1px solid var(--line)"
      >
        <div>
          <p class="text-[11px] uppercase tracking-[0.1em]" style="color: var(--text-3)">Điểm</p>
          <p class="mono text-[20px] font-medium mt-1" style="color: var(--accent)">
            {{ Number(user.points || 0).toLocaleString('vi-VN') }}
          </p>
        </div>
        <div>
          <p class="text-[11px] uppercase tracking-[0.1em]" style="color: var(--text-3)">Thắng–Thua</p>
          <p class="mono text-[20px] font-medium mt-1">{{ user.wins || 0 }}–{{ losses }}</p>
        </div>
        <div>
          <p class="text-[11px] uppercase tracking-[0.1em]" style="color: var(--text-3)">Tỷ lệ thắng</p>
          <p class="mono text-[20px] font-medium mt-1">{{ winRate }}%</p>
        </div>
        <div>
          <p class="text-[11px] uppercase tracking-[0.1em]" style="color: var(--text-3)">Chi tiêu</p>
          <p class="mono text-[18px] sm:text-[20px] font-medium mt-1 leading-tight">
            {{ formatCurrency(user.total_cost || 0) }}
          </p>
        </div>
      </div>

      <!-- Tabs -->
      <nav
        class="flex gap-1 mt-6 overflow-x-auto"
        style="border-bottom: 1px solid var(--line)"
        aria-label="Mục hồ sơ"
      >
        <button
          v-for="t in TABS"
          :key="t.id"
          type="button"
          class="px-4 py-3.5 text-[14px] font-semibold whitespace-nowrap relative"
          :style="{ color: tab === t.id ? 'var(--accent)' : 'var(--text-2)' }"
          @click="tab = t.id"
        >
          {{ t.label }}
          <span
            v-if="tab === t.id"
            class="absolute left-2 right-2 bottom-0 h-0.5 rounded-full"
            style="background: var(--accent)"
          />
        </button>
      </nav>

      <div class="grid gap-5 lg:grid-cols-[320px_1fr] mt-5 items-start">
        <!-- Left column -->
        <aside class="space-y-4 lg:sticky lg:top-24">
          <div class="surface p-5">
            <h2 class="font-heading font-bold text-[18px]">Giới thiệu</h2>
            <p class="mt-3 text-[14px] leading-relaxed" style="color: var(--text-2)">
              Thành viên JBadminton · Trình độ {{ levelLabels[user.level] || user.level }}.
              Theo dõi điểm tích lũy, phong độ và chi phí sân tại đây.
            </p>
            <ul class="mt-4 space-y-2.5 text-[13.5px]">
              <li class="flex gap-2">
                <span style="color: var(--text-3)">Email</span>
                <strong class="truncate">{{ user.email || '—' }}</strong>
              </li>
              <li class="flex gap-2">
                <span style="color: var(--text-3)">Điện thoại</span>
                <strong>{{ user.phone || '—' }}</strong>
              </li>
              <li class="flex gap-2">
                <span style="color: var(--text-3)">Tham gia</span>
                <strong>{{ formatJoinDate(user.join_date) }}</strong>
              </li>
              <li class="flex gap-2">
                <span style="color: var(--text-3)">Trình độ</span>
                <strong>{{ levelLabels[user.level] || user.level }}</strong>
              </li>
            </ul>
            <button
              type="button"
              class="w-full mt-4 py-2.5 rounded-xl text-[14px] font-semibold"
              style="background: var(--bg-2); border: 1px solid var(--line)"
              @click="tab = 'about'"
            >
              Xem thêm thông tin
            </button>
          </div>

          <div class="surface p-5">
            <div class="flex items-center justify-between">
              <h2 class="font-heading font-bold text-[18px]">Ảnh</h2>
              <button type="button" class="btn-text text-[13px]" @click="tab = 'photos'">Xem tất cả</button>
            </div>
            <div class="grid grid-cols-3 gap-1.5 mt-3">
              <img
                v-for="(ph, i) in photoUrls.slice(0, 9)"
                :key="i"
                :src="ph"
                alt=""
                class="aspect-square object-cover rounded-lg"
                loading="lazy"
              />
            </div>
          </div>
        </aside>

        <!-- Main -->
        <div>
          <!-- Posts -->
          <div v-if="tab === 'posts'" class="space-y-4">
            <div class="surface p-4 flex gap-3 items-center">
              <img :src="user.avatar" alt="" class="w-10 h-10 rounded-full object-cover" />
              <div
                class="flex-1 rounded-full px-4 py-2.5 text-[14px]"
                style="background: var(--bg-2); color: var(--text-3); border: 1px solid var(--line)"
              >
                Bạn đang nghĩ gì, {{ firstName }}?
              </div>
            </div>

            <div
              class="surface p-3 grid grid-cols-3 gap-1 text-center text-[13px] font-semibold"
              style="color: var(--text-2)"
            >
              <button type="button" class="py-2.5 rounded-xl hover:bg-[var(--bg-2)]">Ảnh / video</button>
              <button type="button" class="py-2.5 rounded-xl hover:bg-[var(--bg-2)]">Cảm xúc</button>
              <button
                type="button"
                class="py-2.5 rounded-xl hover:bg-[var(--bg-2)]"
                @click="router.push({ name: 'courts' })"
              >
                Check-in sân
              </button>
            </div>

            <motion.article
              v-for="(post, i) in posts"
              :key="post.id"
              class="surface overflow-hidden"
              :initial="{ opacity: 0, y: 12 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: i * 0.05 }"
            >
              <header class="p-4 flex items-center gap-3">
                <img :src="user.avatar" alt="" class="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p class="font-semibold text-[14px]">{{ displayName }}</p>
                  <p class="text-[12px]" style="color: var(--text-3)">{{ post.time }}</p>
                </div>
              </header>
              <p class="px-4 pb-3 text-[15px] leading-relaxed">{{ post.text }}</p>
              <img
                v-if="post.image"
                :src="post.image"
                :alt="post.text"
                class="w-full max-h-[420px] object-cover"
              />
              <div
                class="px-4 py-2.5 flex justify-between text-[13px]"
                style="color: var(--text-3); border-top: 1px solid var(--line)"
              >
                <span>{{ post.likes }} lượt thích</span>
                <span>{{ post.comments }} bình luận</span>
              </div>
              <div class="grid grid-cols-3 px-2 pb-2" style="border-top: 1px solid var(--line)">
                <button type="button" class="py-2.5 text-[13.5px] font-semibold rounded-xl hover:bg-[var(--bg-2)]" style="color: var(--text-2)">
                  Thích
                </button>
                <button type="button" class="py-2.5 text-[13.5px] font-semibold rounded-xl hover:bg-[var(--bg-2)]" style="color: var(--text-2)">
                  Bình luận
                </button>
                <button type="button" class="py-2.5 text-[13.5px] font-semibold rounded-xl hover:bg-[var(--bg-2)]" style="color: var(--text-2)">
                  Chia sẻ
                </button>
              </div>
            </motion.article>
          </div>

          <!-- About -->
          <div v-else-if="tab === 'about'" class="surface p-6 space-y-5">
            <h2 class="font-heading font-bold text-[20px]">Chi tiết</h2>
            <dl class="grid sm:grid-cols-2 gap-4 text-[14px]">
              <div>
                <dt style="color: var(--text-3)">Họ tên</dt>
                <dd class="font-semibold mt-1">{{ displayName }}</dd>
              </div>
              <div>
                <dt style="color: var(--text-3)">Email</dt>
                <dd class="font-semibold mt-1 break-all">{{ user.email || '—' }}</dd>
              </div>
              <div>
                <dt style="color: var(--text-3)">Điện thoại</dt>
                <dd class="font-semibold mt-1">{{ user.phone || '—' }}</dd>
              </div>
              <div>
                <dt style="color: var(--text-3)">Trình độ</dt>
                <dd class="font-semibold mt-1">{{ levelLabels[user.level] || user.level }}</dd>
              </div>
              <div>
                <dt style="color: var(--text-3)">Ngày tham gia</dt>
                <dd class="font-semibold mt-1">{{ formatJoinDate(user.join_date) }}</dd>
              </div>
              <div>
                <dt style="color: var(--text-3)">Trạng thái</dt>
                <dd class="font-semibold mt-1 capitalize">{{ user.status || 'active' }}</dd>
              </div>
            </dl>
          </div>

          <!-- Stats -->
          <div v-else-if="tab === 'stats'" class="space-y-4">
            <div class="surface p-6">
              <h2 class="font-heading font-bold text-[18px] mb-5">Tỷ lệ thắng/thua</h2>
              <div class="space-y-3">
                <div v-for="b in bars" :key="b.label">
                  <div class="flex justify-between mb-1.5">
                    <span class="text-[12px]" style="color: var(--text-2)">{{ b.label }}</span>
                    <span class="mono text-sm font-semibold" :style="{ color: b.color }">{{ b.pct }}%</span>
                  </div>
                  <div class="h-2.5 rounded-full overflow-hidden" style="background: var(--bg-2)">
                    <motion.div
                      class="h-full rounded-full"
                      :style="{ background: b.color }"
                      :initial="{ width: 0 }"
                      :animate="{ width: `${b.pct}%` }"
                      :transition="{ duration: 0.9, ease: 'easeOut' }"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="surface p-6">
              <h2 class="font-heading font-bold text-[18px] mb-5">Chi phí hàng tháng</h2>
              <div class="flex items-end gap-3 h-28">
                <div
                  v-for="(row, i) in months"
                  :key="row.m"
                  class="flex-1 flex flex-col items-center gap-2 h-full"
                >
                  <motion.div
                    class="w-full rounded-t-lg mt-auto"
                    style="background: color-mix(in srgb, var(--accent) 35%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent)"
                    :initial="{ height: 0 }"
                    :animate="{ height: `${(row.v / maxCost) * 100}%` }"
                    :transition="{ delay: 0.1 + i * 0.08, duration: 0.75, ease: [0.22, 1, 0.36, 1] }"
                  />
                  <div class="text-[10px]" style="color: var(--text-3)">{{ row.short }}</div>
                </div>
              </div>
              <div class="flex justify-between mt-3">
                <div
                  v-for="row in months"
                  :key="`${row.m}-val`"
                  class="flex-1 text-center mono text-[10px]"
                  style="color: var(--text-3)"
                >
                  {{ (row.v / 1000).toFixed(0) }}K
                </div>
              </div>
            </div>
          </div>

          <!-- Photos -->
          <div v-else class="surface p-5">
            <h2 class="font-heading font-bold text-[20px] mb-4">Ảnh</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <img
                v-for="(ph, i) in photoUrls"
                :key="i"
                :src="ph"
                alt=""
                class="aspect-square object-cover rounded-xl"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
