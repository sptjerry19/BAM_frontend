<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { motion } from 'motion-v'
import Icon from '../common/Icon.vue'
import { getAthlete } from '../../data/athletes'

const route = useRoute()
const router = useRouter()

const TABS = [
  { id: 'posts', label: 'Bài viết' },
  { id: 'about', label: 'Giới thiệu' },
  { id: 'photos', label: 'Ảnh' },
  { id: 'achievements', label: 'Thành tích' },
]

const tab = ref('posts')
const following = ref(false)

const athlete = computed(() => getAthlete(String(route.params.id)))

const winRate = computed(() => {
  const a = athlete.value
  if (!a) return 0
  const total = a.win + a.loss
  return total ? Math.round((a.win / total) * 100) : 0
})
</script>

<template>
  <div v-if="!athlete" class="shell py-14 text-center">
    <h1 class="page-title">Không tìm thấy vận động viên</h1>
    <button type="button" class="btn-primary mt-6 px-6 py-3 rounded-2xl" @click="router.push({ name: 'rankings' })">
      Về bảng xếp hạng
    </button>
  </div>

  <div v-else class="pb-10">
    <!-- Cover -->
    <div class="relative">
      <div class="h-[220px] sm:h-[320px] md:h-[380px] overflow-hidden bg-[var(--bg-2)]">
        <img :src="athlete.cover" :alt="`Ảnh bìa ${athlete.name}`" class="w-full h-full object-cover" />
      </div>
      <div
        class="absolute inset-0 pointer-events-none"
        style="background: linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.35))"
      />
    </div>

    <div class="shell">
      <!-- Identity row (FB style) -->
      <div class="relative flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 -mt-16 sm:-mt-20">
        <div class="relative shrink-0 self-start sm:self-auto">
          <img
            :src="athlete.avatar"
            :alt="athlete.name"
            class="w-[148px] h-[148px] sm:w-[168px] sm:h-[168px] rounded-full object-cover"
            style="border: 4px solid var(--bg); box-shadow: var(--shadow-md)"
          />
          <span
            class="absolute bottom-3 right-3 mono w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold"
            style="background: var(--accent); color: #0a1200; border: 3px solid var(--bg)"
          >
            {{ athlete.rank }}
          </span>
        </div>

        <div class="flex-1 min-w-0 pb-2">
          <h1 class="font-heading font-extrabold text-[28px] sm:text-[34px] leading-none tracking-tight">
            {{ athlete.name }}
          </h1>
          <p class="mt-2 text-[14px]" style="color: var(--text-2)">
            {{ athlete.friends.toLocaleString('vi-VN') }} bạn bè ·
            {{ athlete.followers.toLocaleString('vi-VN') }} người theo dõi
          </p>
          <p class="mt-1 text-[13.5px]" style="color: var(--text-3)">
            @{{ athlete.handle }} · {{ athlete.club }} · {{ athlete.city }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2 pb-2">
          <button
            type="button"
            class="px-4 py-2.5 rounded-xl text-[14px] font-semibold"
            :style="{
              background: following ? 'var(--bg-2)' : 'var(--accent)',
              color: following ? 'var(--text)' : '#0a1200',
              border: following ? '1px solid var(--line)' : 'none',
            }"
            @click="following = !following"
          >
            {{ following ? 'Đang theo dõi' : 'Theo dõi' }}
          </button>
          <button
            type="button"
            class="btn-ghost px-4 py-2.5 rounded-xl text-[14px] font-semibold"
          >
            Nhắn tin
          </button>
          <button
            type="button"
            class="icon-btn w-10 h-10"
            aria-label="Quay lại xếp hạng"
            @click="router.push({ name: 'rankings' })"
          >
            <Icon name="arrowLeft" :size="18" />
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
            {{ athlete.points.toLocaleString('vi-VN') }}
          </p>
        </div>
        <div>
          <p class="text-[11px] uppercase tracking-[0.1em]" style="color: var(--text-3)">Thắng–Thua</p>
          <p class="mono text-[20px] font-medium mt-1">{{ athlete.win }}–{{ athlete.loss }}</p>
        </div>
        <div>
          <p class="text-[11px] uppercase tracking-[0.1em]" style="color: var(--text-3)">Tỷ lệ thắng</p>
          <p class="mono text-[20px] font-medium mt-1">{{ winRate }}%</p>
        </div>
        <div>
          <p class="text-[11px] uppercase tracking-[0.1em]" style="color: var(--text-3)">Hạng</p>
          <p class="mono text-[20px] font-medium mt-1">#{{ athlete.rank }}</p>
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
        <!-- Left intro (FB about card) -->
        <aside class="space-y-4 lg:sticky lg:top-24">
          <div class="surface p-5">
            <h2 class="font-heading font-bold text-[18px]">Giới thiệu</h2>
            <p class="mt-3 text-[14px] leading-relaxed" style="color: var(--text-2)">{{ athlete.bio }}</p>
            <ul class="mt-4 space-y-2.5 text-[13.5px]">
              <li class="flex gap-2"><span style="color: var(--text-3)">CLB</span> <strong>{{ athlete.club }}</strong></li>
              <li class="flex gap-2"><span style="color: var(--text-3)">Sống tại</span> <strong>{{ athlete.city }}</strong></li>
              <li class="flex gap-2"><span style="color: var(--text-3)">Tay thuận</span> <strong>{{ athlete.handed }}</strong></li>
              <li class="flex gap-2"><span style="color: var(--text-3)">Lối chơi</span> <strong>{{ athlete.style }}</strong></li>
              <li class="flex gap-2"><span style="color: var(--text-3)">Chơi từ</span> <strong>{{ athlete.since }}</strong></li>
            </ul>
          </div>

          <div v-if="athlete.photos?.length" class="surface p-5">
            <div class="flex items-center justify-between">
              <h2 class="font-heading font-bold text-[18px]">Ảnh</h2>
              <button type="button" class="btn-text text-[13px]" @click="tab = 'photos'">Xem tất cả</button>
            </div>
            <div class="grid grid-cols-3 gap-1.5 mt-3">
              <img
                v-for="(ph, i) in athlete.photos.slice(0, 9)"
                :key="i"
                :src="ph"
                alt=""
                class="aspect-square object-cover rounded-lg"
                loading="lazy"
              />
            </div>
          </div>
        </aside>

        <!-- Main column -->
        <div>
          <!-- Posts -->
          <div v-if="tab === 'posts'" class="space-y-4">
            <div class="surface p-4 flex gap-3 items-center">
              <img :src="athlete.avatar" alt="" class="w-10 h-10 rounded-full object-cover" />
              <div
                class="flex-1 rounded-full px-4 py-2.5 text-[14px]"
                style="background: var(--bg-2); color: var(--text-3); border: 1px solid var(--line)"
              >
                Bạn đang nghĩ gì, {{ athlete.name.split(' ').pop() }}?
              </div>
            </div>

            <motion.article
              v-for="(post, i) in athlete.posts"
              :key="post.id"
              class="surface overflow-hidden"
              :initial="{ opacity: 0, y: 12 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: i * 0.05 }"
            >
              <header class="p-4 flex items-center gap-3">
                <img :src="athlete.avatar" alt="" class="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p class="font-semibold text-[14px]">{{ athlete.name }}</p>
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

            <p v-if="!athlete.posts?.length" class="surface p-8 text-center" style="color: var(--text-3)">
              Chưa có bài viết nào.
            </p>
          </div>

          <!-- About -->
          <div v-else-if="tab === 'about'" class="surface p-6 space-y-5">
            <h2 class="font-heading font-bold text-[20px]">Chi tiết</h2>
            <dl class="grid sm:grid-cols-2 gap-4 text-[14px]">
              <div>
                <dt style="color: var(--text-3)">Họ tên</dt>
                <dd class="font-semibold mt-1">{{ athlete.name }}</dd>
              </div>
              <div>
                <dt style="color: var(--text-3)">Username</dt>
                <dd class="font-semibold mt-1">@{{ athlete.handle }}</dd>
              </div>
              <div>
                <dt style="color: var(--text-3)">Câu lạc bộ</dt>
                <dd class="font-semibold mt-1">{{ athlete.club }}</dd>
              </div>
              <div>
                <dt style="color: var(--text-3)">Thành phố</dt>
                <dd class="font-semibold mt-1">{{ athlete.city }}</dd>
              </div>
              <div>
                <dt style="color: var(--text-3)">Lối chơi</dt>
                <dd class="font-semibold mt-1">{{ athlete.style }}</dd>
              </div>
              <div>
                <dt style="color: var(--text-3)">Tay thuận</dt>
                <dd class="font-semibold mt-1">{{ athlete.handed }}</dd>
              </div>
            </dl>
            <p class="text-[15px] leading-relaxed pt-2" style="border-top: 1px solid var(--line); color: var(--text-2)">
              {{ athlete.bio }}
            </p>
          </div>

          <!-- Photos -->
          <div v-else-if="tab === 'photos'" class="surface p-5">
            <h2 class="font-heading font-bold text-[20px] mb-4">Ảnh</h2>
            <div v-if="athlete.photos?.length" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <img
                v-for="(ph, i) in athlete.photos"
                :key="i"
                :src="ph"
                alt=""
                class="aspect-square object-cover rounded-xl"
                loading="lazy"
              />
            </div>
            <p v-else class="py-10 text-center" style="color: var(--text-3)">Chưa có ảnh.</p>
          </div>

          <!-- Achievements -->
          <div v-else class="surface p-5">
            <h2 class="font-heading font-bold text-[20px] mb-4">Thành tích</h2>
            <ul v-if="athlete.achievements?.length" class="space-y-3">
              <li
                v-for="(a, i) in athlete.achievements"
                :key="i"
                class="flex gap-4 p-3 rounded-xl"
                style="background: var(--bg-2); border: 1px solid var(--line)"
              >
                <span class="mono text-[13px] font-semibold w-12 shrink-0" style="color: var(--accent)">{{ a.year }}</span>
                <span class="text-[14px] font-medium">{{ a.title }}</span>
              </li>
            </ul>
            <p v-else class="py-10 text-center" style="color: var(--text-3)">Chưa cập nhật thành tích.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
