<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
import { motion, AnimatePresence } from 'motion-v'
import { getCourts } from '../../api'
import Stars from '../common/Stars.vue'
import Icon from '../common/Icon.vue'
import { formatCurrency, productImageUrl } from '../../utils/labels'

const emit = defineEmits(['book'])

const goToShop = inject('goToShop', null)
const openBooking = inject('openBooking', null)

const courts = ref([])
const selected = ref(null)
const filter = ref('all')
const loading = ref(true)

const SLIDE_MS = 6000
const heroIndex = ref(0)
let slideTimer = null

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const statusColors = { open: '#a3e635', busy: '#facc15', closed: '#f87171' }
const statusLabels = { all: 'Tất cả', open: 'Còn sân', busy: 'Đông khách', closed: 'Đã đóng' }
const statusShort = { open: 'Còn sân', busy: 'Đông', closed: 'Đóng' }
const filterKeys = ['all', 'open', 'busy', 'closed']

const shown = computed(() =>
  filter.value === 'all' ? courts.value : courts.value.filter((c) => c.status === filter.value),
)

const openCount = computed(() => courts.value.filter((c) => c.status === 'open').length)
const totalCourts = computed(() => courts.value.reduce((sum, c) => sum + (c.courts || 0), 0))
const lowestPrice = computed(() =>
  courts.value.length ? Math.min(...courts.value.map((c) => c.price)) : 0,
)

/** Slides come from real courts so the hero doubles as a shortcut to booking. */
const heroSlides = computed(() => {
  const list = courts.value.slice(0, 5)
  return list.length ? list : [{ id: 'intro', image: null }]
})

const activeSlide = computed(
  () => heroSlides.value[heroIndex.value] ?? heroSlides.value[0],
)

const activeCourt = computed(() =>
  courts.value.find((c) => c.id === activeSlide.value?.id) ?? null,
)

function slideImage(slide) {
  return productImageUrl(slide?.image, { w: 1920, h: 1200 })
}

function advanceSlide() {
  const total = heroSlides.value.length
  if (total < 2) return
  heroIndex.value = (heroIndex.value + 1) % total
}

function restartTimer() {
  clearInterval(slideTimer)
  slideTimer = null
  if (reducedMotion || heroSlides.value.length < 2) return
  slideTimer = setInterval(() => {
    if (!document.hidden) advanceSlide()
  }, SLIDE_MS)
}

function goToSlide(index) {
  const total = heroSlides.value.length
  heroIndex.value = ((index % total) + total) % total
  restartTimer()
}

watch(heroSlides, () => {
  heroIndex.value = 0
  restartTimer()
})

onMounted(async () => {
  try {
    courts.value = await getCourts()
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  clearInterval(slideTimer)
})

function selectCourt(c) {
  selected.value = selected.value?.id === c.id ? null : c
}

function onBook(court, e) {
  e?.stopPropagation()
  if (openBooking) openBooking(court)
  else emit('book', court)
}

function scrollToCourts() {
  document.getElementById('courts')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="hero-stage" aria-labelledby="hero-title">
      <div class="absolute inset-0 bg-black" aria-hidden="true">
        <AnimatePresence>
          <motion.img
            :key="activeSlide.id"
            :src="slideImage(activeSlide)"
            alt=""
            class="absolute inset-0 w-full h-full object-cover"
            :initial="{ opacity: 0, scale: 1.12 }"
            :animate="{ opacity: 1, scale: 1 }"
            :exit="{ opacity: 0, scale: 1.04 }"
            :transition="{
              opacity: { duration: 1.2, ease: [0.4, 0, 0.2, 1] },
              scale: { duration: 9, ease: 'linear' },
            }"
          />
        </AnimatePresence>
      </div>

      <div class="hero-scrim" aria-hidden="true" />
      <div class="absolute inset-0 court-lines opacity-25" aria-hidden="true" />

      <div class="shell relative w-full pt-16 pb-28 sm:pt-24 sm:pb-32">
        <motion.div
          class="max-w-[660px]"
          :initial="{ opacity: 0, y: 22 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }"
        >
          <span class="eyebrow">
            <Icon name="bolt" :size="14" />
            Sân trống cập nhật theo phút
          </span>

          <h1
            id="hero-title"
            class="display mt-5"
            style="font-size: clamp(40px, 7.4vw, 76px)"
          >
            Đặt sân cầu lông<br />
            <span class="grad-lime">rồi ra sân trong 2 giờ</span>
          </h1>

          <p class="lede mt-6">
            Chọn khung giờ ở {{ courts.length || 6 }} cụm sân tại Hà Nội, xem giá theo giờ trước khi
            đặt, và mua vợt, giày, cầu chính hãng ngay trong cùng một ứng dụng.
          </p>

          <div class="flex flex-wrap items-center gap-3 mt-9">
            <motion.button
              type="button"
              class="btn-primary px-7 py-3.5 rounded-2xl text-[15px] flex items-center gap-2"
              :while-hover="{ scale: 1.02 }"
              :while-tap="{ scale: 0.98 }"
              @click="scrollToCourts"
            >
              Tìm sân trống
              <Icon name="arrowRight" :size="18" />
            </motion.button>
            <button
              v-if="goToShop"
              type="button"
              class="btn-text px-2 py-3.5"
              @click="goToShop()"
            >
              Ghé cửa hàng trang bị
              <Icon name="arrowRight" :size="16" />
            </button>
          </div>

          <dl class="grid grid-cols-3 gap-5 mt-11 max-w-lg">
            <div v-for="stat in [
              { k: 'Sân còn trống', v: loading ? '—' : String(openCount) },
              { k: 'Mặt sân đang mở', v: loading ? '—' : String(totalCourts) },
              { k: 'Giá từ', v: loading ? '—' : `${Math.round(lowestPrice / 1000)}k/h` },
            ]" :key="stat.k">
              <dt class="text-[11px] uppercase tracking-[0.12em]" style="color: var(--text-3)">
                {{ stat.k }}
              </dt>
              <dd class="mono text-2xl font-medium mt-1.5" style="color: var(--accent)">{{ stat.v }}</dd>
            </div>
          </dl>
        </motion.div>
      </div>

      <!-- Card for the court currently on screen -->
      <div class="shell absolute left-0 right-0 bottom-24 hidden lg:flex justify-end">
        <AnimatePresence>
          <motion.div
            v-if="activeCourt"
            :key="activeCourt.id"
            class="w-[300px] glass-strong p-5"
            style="border-radius: var(--r-lg)"
            :initial="{ opacity: 0, y: 16 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -12 }"
            :transition="{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }"
          >
            <div class="flex items-center gap-2">
              <span
                class="w-1.5 h-1.5 rounded-full pulse-dot"
                :style="{ background: statusColors[activeCourt.status] }"
              />
              <span class="text-[11px] uppercase tracking-[0.12em]" style="color: var(--text-3)">
                {{ statusShort[activeCourt.status] }} · {{ activeCourt.district }}
              </span>
            </div>

            <div class="font-heading font-bold text-[17px] mt-2 leading-snug">
              {{ activeCourt.name }}
            </div>

            <div class="flex items-center justify-between gap-3 mt-4">
              <div class="mono text-[15px] font-medium" style="color: var(--accent)">
                {{ formatCurrency(activeCourt.price) }}<span class="text-[12px]" style="color: var(--text-3)">/giờ</span>
              </div>
              <button
                type="button"
                class="btn-primary px-4 py-2 rounded-xl text-[13px]"
                @click="onBook(activeCourt, $event)"
              >
                Đặt sân
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <!-- Slide indicators double as a progress bar -->
      <div
        v-if="heroSlides.length > 1"
        class="shell absolute left-0 right-0 bottom-8 sm:bottom-10 flex items-center gap-2.5"
      >
        <button
          v-for="(slide, i) in heroSlides"
          :key="slide.id"
          type="button"
          class="hero-dot"
          :class="{ 'is-active': i === heroIndex }"
          :aria-label="`Xem ảnh sân ${i + 1}`"
          :aria-current="i === heroIndex"
          @click="goToSlide(i)"
        >
          <span
            v-if="i === heroIndex"
            :key="heroIndex"
            class="hero-dot-fill"
            :style="{ animationDuration: `${SLIDE_MS}ms` }"
          />
        </button>
      </div>
    </section>

    <!-- Courts -->
    <section id="courts" class="shell pt-6 pb-4 scroll-mt-24" aria-labelledby="courts-title">
      <div class="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h2 id="courts-title" class="section-head">Sân ở Hà Nội</h2>
          <p class="lede mt-2.5 text-[14.5px]">
            Giá theo giờ đã gồm thuê sân và đèn. Đặt trước 30 phút là chắc chỗ.
          </p>
        </div>

        <div class="flex flex-wrap gap-2" role="group" aria-label="Lọc theo trạng thái">
          <button
            v-for="s in filterKeys"
            :key="s"
            type="button"
            class="chip"
            :aria-pressed="filter === s"
            @click="filter = s"
          >
            <span
              v-if="s !== 'all'"
              class="w-1.5 h-1.5 rounded-full"
              :style="{ background: filter === s ? '#0a1200' : statusColors[s] }"
            />
            {{ statusLabels[s] }}
          </button>
        </div>
      </div>

      <!-- Loading skeleton matches the card shape -->
      <div v-if="loading" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        <div v-for="n in 5" :key="n" class="skeleton h-[268px]" style="border-radius: var(--r-lg)" />
      </div>

      <div
        v-else-if="shown.length === 0"
        class="surface-quiet mt-8 px-6 py-16 text-center"
      >
        <span
          class="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
          style="background: var(--accent-soft); color: var(--accent)"
        >
          <Icon name="court" :size="24" />
        </span>
        <p class="font-heading font-bold text-[17px] mt-4">Không có sân nào ở trạng thái này</p>
        <p class="mt-1.5 text-[13.5px]" style="color: var(--text-3)">
          Thử bỏ bộ lọc để xem toàn bộ danh sách.
        </p>
        <button type="button" class="btn-text mt-5 mx-auto" @click="filter = 'all'">
          Xem tất cả sân
          <Icon name="arrowRight" :size="16" />
        </button>
      </div>

      <!-- Asymmetric grid: the first court gets a wide feature card -->
      <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        <motion.article
          v-for="(c, i) in shown"
          :key="c.id"
          class="surface spotlight lift overflow-hidden flex flex-col"
          :class="i === 0 ? 'sm:col-span-2' : ''"
          :initial="{ opacity: 0, y: 22 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: Math.min(i, 6) * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }"
        >
          <div
            class="relative overflow-hidden cursor-pointer"
            :class="i === 0 ? 'h-52 sm:h-60' : 'h-40'"
            @click="selectCourt(c)"
          >
            <img
              :src="productImageUrl(c.image, i === 0 ? { w: 1000, h: 560 } : { w: 560, h: 400 })"
              :alt="`Sân cầu lông ${c.name}`"
              class="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              loading="lazy"
            />
            <div
              class="absolute inset-0"
              style="background: linear-gradient(200deg, color-mix(in srgb, var(--bg) 5%, transparent), color-mix(in srgb, var(--bg) 82%, transparent))"
            />
            <span
              class="tag absolute top-3.5 left-3.5"
              :style="{
                background: `${statusColors[c.status]}22`,
                color: statusColors[c.status],
                backdropFilter: 'blur(6px)',
              }"
            >
              <span class="w-1.5 h-1.5 rounded-full" :style="{ background: statusColors[c.status] }" />
              {{ statusShort[c.status] }}
            </span>
            <div class="absolute left-4 right-4 bottom-3.5 flex items-end justify-between gap-3">
              <div class="min-w-0">
                <h3 class="font-heading font-bold leading-tight" :class="i === 0 ? 'text-xl' : 'text-[15px]'">
                  {{ c.name }}
                </h3>
                <p class="text-[12px] truncate mt-0.5" style="color: var(--text-2)">{{ c.district }}</p>
              </div>
              <span class="mono text-[15px] font-medium shrink-0" style="color: var(--accent)">
                {{ formatCurrency(c.price) }}<span class="text-[11px]">/h</span>
              </span>
            </div>
          </div>

          <div class="p-4 sm:p-5 flex flex-col flex-1">
            <div class="flex items-center gap-3 flex-wrap">
              <Stars :rating="c.rating" />
              <span class="text-[12.5px]" style="color: var(--text-3)">{{ c.courts }} mặt sân</span>
              <span class="text-[12.5px]" style="color: var(--text-3)">·</span>
              <span class="text-[12.5px]" style="color: var(--text-3)">{{ c.surfaces }}</span>
            </div>

            <p class="text-[13px] mt-2.5" style="color: var(--text-2)">{{ c.address }}</p>

            <div v-if="i === 0" class="flex flex-wrap gap-2 mt-4">
              <span class="chip text-[12px] py-1.5 px-3">
                <Icon name="clock" :size="14" />
                {{ c.hours }}
              </span>
              <span class="chip text-[12px] py-1.5 px-3">
                <Icon name="pin" :size="14" />
                {{ c.phone }}
              </span>
            </div>

            <!-- Pinned to the bottom so CTAs line up across cards -->
            <div class="flex items-center gap-3 mt-auto pt-5">
              <motion.button
                type="button"
                class="btn-primary flex-1 py-3 rounded-xl text-[13.5px] disabled:opacity-35 disabled:cursor-not-allowed"
                :disabled="c.status === 'closed'"
                :while-hover="c.status !== 'closed' ? { scale: 1.015 } : {}"
                :while-tap="c.status !== 'closed' ? { scale: 0.98 } : {}"
                @click="onBook(c, $event)"
              >
                {{ c.status === 'closed' ? 'Đang đóng cửa' : 'Đặt sân' }}
              </motion.button>
              <button
                type="button"
                class="btn-text text-[13px]"
                @click="selectCourt(c)"
              >
                Xem vị trí
              </button>
            </div>
          </div>
        </motion.article>
      </div>
    </section>

    <!-- Map -->
    <section class="shell pt-14" aria-labelledby="map-title">
      <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 id="map-title" class="section-head">Vị trí trên bản đồ</h2>
          <p class="lede mt-2.5 text-[14.5px]">
            Chạm vào điểm đánh dấu để xem chi tiết cụm sân. Số trên điểm là số mặt sân.
          </p>
        </div>
        <span class="mono text-[12.5px]" style="color: var(--text-3)">Hà Nội, VN</span>
      </div>

      <div class="grid gap-5 lg:grid-cols-5">
        <motion.div
          class="lg:col-span-3 relative overflow-hidden map-canvas"
          style="border-radius: var(--r-xl); background: #0b1526; border: 1px solid var(--line)"
          :initial="{ opacity: 0, scale: 0.985 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ duration: 0.5 }"
        >
          <div
            class="absolute inset-0"
            style="background-image: linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px); background-size: 36px 36px"
          />
          <div
            class="absolute inset-0 pointer-events-none"
            style="background: radial-gradient(ellipse 60% 60% at 45% 45%, rgba(163,230,53,0.07), transparent)"
          />

          <svg class="absolute inset-0 w-full h-full" aria-hidden="true">
            <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="rgba(148,163,184,0.12)" stroke-width="2" />
            <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(148,163,184,0.12)" stroke-width="2" />
            <ellipse
              cx="46%"
              cy="44%"
              rx="5%"
              ry="3.5%"
              fill="rgba(56,189,248,0.12)"
              stroke="rgba(56,189,248,0.2)"
              stroke-width="1"
            />
          </svg>
          <span
            class="mono absolute"
            style="left: 43%; top: 47%; font-size: 9px; color: rgba(125,190,255,0.65); letter-spacing: 0.05em"
          >
            Hồ Hoàn Kiếm
          </span>

          <motion.button
            v-for="(c, i) in shown"
            :key="c.id"
            type="button"
            class="absolute"
            :style="{
              left: `${c.x}%`,
              top: `${c.y}%`,
              transform: 'translate(-50%, -100%)',
              zIndex: selected?.id === c.id ? 10 : 1,
            }"
            :aria-label="`${c.name}, ${c.courts} mặt sân`"
            :initial="{ scale: 0, opacity: 0 }"
            :animate="{ scale: 1, opacity: 1 }"
            :transition="{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 300, damping: 20 }"
            :while-hover="{ scale: 1.18 }"
            :while-tap="{ scale: 0.9 }"
            @click="selectCourt(c)"
          >
            <motion.span
              v-if="c.status !== 'closed'"
              class="absolute rounded-full block"
              :style="{ inset: '-4px', background: statusColors[c.status], opacity: 0.3 }"
              :animate="{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }"
              :transition="{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }"
            />
            <motion.span
              class="w-9 h-9 rounded-full flex items-center justify-center mono text-xs font-bold relative"
              :style="{
                background: selected?.id === c.id ? statusColors[c.status] : `${statusColors[c.status]}22`,
                border: `2px solid ${statusColors[c.status]}`,
                color: selected?.id === c.id ? '#0a1200' : statusColors[c.status],
              }"
            >
              {{ c.courts }}
            </motion.span>
          </motion.button>

          <div
            class="absolute bottom-3.5 left-3.5 rounded-xl px-3.5 py-2.5 flex gap-3.5 glass"
            style="border-radius: var(--r-sm)"
          >
            <span
              v-for="(col, s) in statusColors"
              :key="s"
              class="flex items-center gap-1.5 text-[10.5px]"
              style="color: var(--text-2)"
            >
              <span class="w-1.5 h-1.5 rounded-full" :style="{ background: col }" />
              {{ statusShort[s] }}
            </span>
          </div>
        </motion.div>

        <div class="lg:col-span-2 space-y-2.5 lg:max-h-[460px] lg:overflow-y-auto pr-1">
          <button
            v-for="c in shown"
            :key="c.id"
            type="button"
            class="w-full text-left rounded-2xl p-4 transition-all"
            :style="{
              background: selected?.id === c.id ? 'rgba(163,230,53,0.07)' : 'rgba(255,255,255,0.035)',
              border: `1px solid ${selected?.id === c.id ? 'var(--accent-line)' : 'var(--line)'}`,
            }"
            @click="selectCourt(c)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="font-semibold text-[13.5px] leading-snug">{{ c.name }}</div>
                <div class="text-[11.5px] truncate mt-0.5" style="color: var(--text-3)">{{ c.address }}</div>
              </div>
              <span class="mono text-[12.5px] font-medium shrink-0" style="color: var(--accent)">
                {{ formatCurrency(c.price) }}
              </span>
            </div>
            <div class="flex items-center gap-2 mt-2.5">
              <Stars :rating="c.rating" />
              <span class="text-[11.5px]" style="color: var(--text-3)">{{ c.courts }} sân</span>
            </div>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
