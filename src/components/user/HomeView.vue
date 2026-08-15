<script setup>
/**
 * Home — Nike-inspired campaign storefront for JBadminton.
 * Full-bleed hero, stacked campaigns, two-up grid, trending strip.
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { motion, AnimatePresence } from 'motion-v'
import HomeBestsellers from './HomeBestsellers.vue'

const router = useRouter()
const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const HERO_HOLD = 6000
const heroShots = [
  {
    id: 'court',
    src: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1920&h=1200&fit=crop',
    kicker: 'Đặt sân Hà Nội',
    title: 'Còn chỗ\ntrên sân.',
    cta: 'Đặt sân',
    to: 'courts',
  },
  {
    id: 'rally',
    src: 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=1920&h=1200&fit=crop',
    kicker: 'Trận tối nay',
    title: 'Một cú smash.\nMột khung giờ.',
    cta: 'Tìm sân',
    to: 'courts',
  },
  {
    id: 'gear',
    src: 'https://images.unsplash.com/photo-1613918431703-aa0c4d3c4a55?w=1920&h=1200&fit=crop',
    kicker: 'Cửa hàng',
    title: 'Trang bị\nchính hãng.',
    cta: 'Mua ngay',
    to: 'shop',
  },
]

const shot = ref(0)
let shotTimer = null

const campaigns = [
  {
    id: 'c1',
    span: 'full',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1600&h=900&fit=crop',
    kicker: 'Sân trong nhà',
    title: 'Đêm trong nhà',
    copy: 'Đèn vàng trên mặt sân. Giữ chỗ trước 30 phút — chắc suất cao điểm.',
    cta: 'Khám phá',
    to: 'courts',
  },
  {
    id: 'c2',
    span: 'half',
    image: 'https://images.unsplash.com/photo-1613918431703-aa0c4d3c4a55?w=1200&h=1400&fit=crop',
    kicker: 'Cửa hàng',
    title: 'Vợt trong tay',
    copy: 'Chính hãng, lọc theo trình độ, giao trong 48 giờ.',
    cta: 'Mua sắm',
    to: 'shop',
  },
  {
    id: 'c3',
    span: 'half',
    image: 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=1200&h=1400&fit=crop',
    kicker: 'Trang bị',
    title: 'Túi đồ của bạn',
    copy: 'Lưu vợt đang dùng — sẵn sàng trước mỗi trận.',
    cta: 'Xem trang bị',
    to: 'equipment',
  },
]

function showShot(i) {
  shot.value = (i + heroShots.length) % heroShots.length
  if (shotTimer) {
    clearInterval(shotTimer)
    startReel()
  }
}

function startReel() {
  shotTimer = setInterval(() => {
    shot.value = (shot.value + 1) % heroShots.length
  }, HERO_HOLD)
}

function go(name) {
  router.push({ name })
}

onMounted(() => {
  if (reducedMotion) return
  heroShots.slice(1).forEach((s) => {
    const img = new Image()
    img.src = s.src
  })
  startReel()
})

onUnmounted(() => {
  if (shotTimer) clearInterval(shotTimer)
})
</script>

<template>
  <div class="home">
    <!-- Hero campaign — full bleed, copy bottom-left -->
    <section class="nk-hero" aria-labelledby="home-brand">
      <div class="nk-hero__media" aria-hidden="true">
        <AnimatePresence>
          <motion.div
            :key="heroShots[shot].id"
            class="nk-hero__shot"
            :class="`is-kb-${shot % 3}`"
            :style="{ backgroundImage: `url(${heroShots[shot].src})` }"
            :initial="{ opacity: 0 }"
            :animate="{ opacity: 1 }"
            :exit="{ opacity: 0 }"
            :transition="{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }"
          />
        </AnimatePresence>
        <div class="nk-hero__scrim" />
      </div>

      <div class="shell nk-hero__copy">
        <AnimatePresence mode="wait">
          <motion.div
            :key="heroShots[shot].id + '-copy'"
            :initial="{ opacity: 0, y: 18 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: -12 }"
            :transition="{ duration: 0.45 }"
          >
            <p class="nk-hero__kicker">{{ heroShots[shot].kicker }}</p>
            <h1 id="home-brand" class="nk-hero__title">
              <span
                v-for="(line, li) in heroShots[shot].title.split('\n')"
                :key="li"
                class="nk-hero__line"
              >{{ line }}</span>
            </h1>
            <button
              type="button"
              class="btn-primary nk-hero__cta"
              @click="go(heroShots[shot].to)"
            >
              {{ heroShots[shot].cta }}
            </button>
          </motion.div>
        </AnimatePresence>

        <div class="nk-hero__dots" role="tablist" aria-label="Ảnh nền">
          <button
            v-for="(s, i) in heroShots"
            :key="s.id"
            type="button"
            role="tab"
            class="nk-hero__dot"
            :class="{ 'is-active': shot === i }"
            :aria-selected="shot === i"
            :aria-label="s.kicker"
            @click="showShot(i)"
          >
            <span
              v-if="shot === i && !reducedMotion"
              class="nk-hero__fill"
              :style="{ animationDuration: `${HERO_HOLD}ms` }"
            />
          </button>
        </div>
      </div>
    </section>

    <!-- Featured campaigns -->
    <section class="nk-campaigns" aria-label="Chiến dịch">
      <article
        v-for="c in campaigns"
        :key="c.id"
        class="nk-card"
        :class="c.span === 'full' ? 'nk-card--full' : 'nk-card--half'"
      >
        <div class="nk-card__media">
          <img :src="c.image" :alt="c.title" loading="lazy" />
        </div>
        <div class="nk-card__body">
          <p class="nk-card__kicker">{{ c.kicker }}</p>
          <h2 class="nk-card__title">{{ c.title }}</h2>
          <p class="nk-card__copy">{{ c.copy }}</p>
          <button type="button" class="btn-primary nk-card__cta" @click="go(c.to)">
            {{ c.cta }}
          </button>
        </div>
      </article>
    </section>

    <!-- Trending -->
    <HomeBestsellers />

    <!-- Closing strip -->
    <section class="nk-close" aria-labelledby="nk-close-title">
      <div class="shell nk-close__inner">
        <h2 id="nk-close-title">Sẵn sàng lên sân?</h2>
        <div class="nk-close__actions">
          <button type="button" class="btn-primary px-8 py-3.5" @click="go('courts')">
            Đặt sân
          </button>
          <button type="button" class="btn-ghost px-8 py-3.5" @click="go('shop')">
            Mua trang bị
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
