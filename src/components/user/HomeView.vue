<script setup>
/**
 * Home — cinematic storefront landing.
 * Motion stack: scroll-scrub, sticky horizontal pin, magnetic CTA, accordion expand.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'motion-v'
import Icon from '../common/Icon.vue'
import HomeBestsellers from './HomeBestsellers.vue'

const router = useRouter()
const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const brand = 'JBadminton'
const brandLetters = brand.split('')

const heroRef = ref(null)
const revealRef = ref(null)
const accordionRef = ref(null)
const finaleRef = ref(null)
const ctaWrap = ref(null)

const accordionInView = useInView(accordionRef, { once: true, margin: '-12% 0px' })
const finaleInView = useInView(finaleRef, { once: true, margin: '-18% 0px' })

/* —— Hero parallax —— */
const { scrollYProgress: heroProgress } = useScroll({
  target: heroRef,
  offset: ['start start', 'end start'],
})
const heroImgY = useTransform(heroProgress, [0, 1], ['0%', '18%'])
const heroImgScale = useTransform(heroProgress, [0, 1], [1.06, 1.2])
const heroFloatY = useTransform(heroProgress, [0, 1], ['0%', '28%'])
const heroCopyOpacity = useTransform(heroProgress, [0, 0.6], [1, 0])

/* —— Scrubbing word reveal —— */
const revealWords = 'Một cú smash. Một khung giờ trống. Một đôi giày mới — rồi bạn đã đứng trên đường biên.'
  .split(' ')

const { scrollYProgress: revealProgress } = useScroll({
  target: revealRef,
  offset: ['start 0.85', 'end 0.35'],
})

function wordOpacity(i) {
  const start = i / revealWords.length
  const end = (i + 1.2) / revealWords.length
  return useTransform(revealProgress, [start, end], [0.12, 1])
}

const wordOpacities = revealWords.map((_, i) => wordOpacity(i))

const pinSlides = [
  {
    id: 'p1',
    title: 'Đêm trong nhà',
    copy: 'Đèn vàng trên mặt sân, cầu cắt không khí.',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1400&h=900&fit=crop',
  },
  {
    id: 'p2',
    title: 'Chuẩn bị giao',
    copy: 'Giữ chỗ trước 30 phút — chắc suất cao điểm.',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1400&h=900&fit=crop',
  },
  {
    id: 'p3',
    title: 'Vợt trong tay',
    copy: 'Chính hãng, lọc theo trình độ, giao trong 48 giờ.',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1400&h=900&fit=crop',
  },
  {
    id: 'p4',
    title: 'Sau trận',
    copy: 'Đổi trả 14 ngày. Giá đã gồm thuế trên từng giờ sân.',
    image: 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=1400&h=900&fit=crop',
  },
]

/* —— Accordion —— */
const accordionOpen = ref(0)
const accordionItems = [
  {
    key: 'courts',
    title: 'Đặt sân',
    copy: 'Sân trống cập nhật theo phút tại Hà Nội. Xem giá trước, giữ chỗ vài thao tác.',
    cta: 'Tìm sân trống',
    to: 'courts',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&h=1400&fit=crop',
  },
  {
    key: 'shop',
    title: 'Cửa hàng',
    copy: 'Vợt, giày, cầu và phụ kiện. Thêm vào giỏ hoặc gắn vào túi đồ của bạn.',
    cta: 'Vào cửa hàng',
    to: 'shop',
    image: 'https://images.unsplash.com/photo-1613918431703-aa0c4d3c4a55?w=1200&h=1400&fit=crop',
  },
  {
    key: 'kit',
    title: 'Trang bị',
    copy: 'Túi đồ cá nhân — lưu vợt đang dùng, sẵn sàng trước mỗi trận.',
    cta: 'Xem trang bị',
    to: 'equipment',
    image: 'https://images.unsplash.com/photo-1599586120429-48281b6f0ece?w=1200&h=1400&fit=crop',
  },
]

/* —— Magnetic CTA —— */
const mag = ref({ x: 0, y: 0 })
function onMagMove(e) {
  if (reducedMotion || !ctaWrap.value) return
  const r = ctaWrap.value.getBoundingClientRect()
  mag.value = {
    x: (e.clientX - (r.left + r.width / 2)) * 0.2,
    y: (e.clientY - (r.top + r.height / 2)) * 0.2,
  }
}
function onMagLeave() {
  mag.value = { x: 0, y: 0 }
}

/* —— Live pulse —— */
const beats = ['smash', 'drop', 'clear', 'drive']
const beat = ref(0)
let beatTimer = null
const beatWord = computed(() => beats[beat.value])

const year = new Date().getFullYear()
const marquee = [
  'Smash', 'Drop', 'Clear', 'Drive', 'Net', 'Rally',
  'Đặt sân', 'Giá theo giờ', 'Vợt chính hãng', 'Giao 48h',
]

onMounted(() => {
  if (reducedMotion) return
  beatTimer = setInterval(() => {
    beat.value = (beat.value + 1) % beats.length
  }, 2600)
})

onUnmounted(() => {
  if (beatTimer) clearInterval(beatTimer)
})

function go(name) {
  router.push({ name })
}
</script>

<template>
  <div class="home">
    <!-- ATTENTION: artistic asymmetric hero -->
    <section ref="heroRef" class="home-hero" aria-labelledby="home-brand">
      <div class="home-hero__bg" aria-hidden="true">
        <motion.img
          class="home-hero__bg-img"
          src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1400&h=900&fit=crop"
          alt=""
          :style="reducedMotion ? undefined : { y: heroImgY, scale: heroImgScale }"
        />
        <div class="home-hero__scrim" />
        <div class="home-hero__grain" />
      </div>

      <motion.div
        class="shell home-hero__layout"
        :style="reducedMotion ? undefined : { opacity: heroCopyOpacity }"
      >
        <div class="home-hero__copy">
          <motion.p
            class="eyebrow"
            :initial="{ opacity: 0, y: 12 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.5, delay: 0.1 }"
          >
            <Icon name="bolt" :size="14" />
            Hà Nội · {{ year }}
          </motion.p>

          <h1 id="home-brand" class="home-hero__brand" aria-label="JBadminton">
            <motion.span
              v-for="(ch, i) in brandLetters"
              :key="`${ch}-${i}`"
              class="home-hero__ch"
              :class="{ accent: i === 0 }"
              :initial="{ opacity: 0, y: '0.6em', filter: 'blur(8px)' }"
              :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
              :transition="{
                duration: 0.72,
                delay: 0.18 + i * 0.042,
                ease: [0.22, 1, 0.36, 1],
              }"
            >{{ ch }}</motion.span>
          </h1>

          <motion.p
            class="home-hero__lede"
            :initial="{ opacity: 0, y: 16 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.55, delay: 0.72 }"
          >
            Đặt sân theo giờ và mua trang bị chính hãng — một nhịp từ nhà đến đường biên.
          </motion.p>

          <motion.div
            class="home-hero__actions"
            :initial="{ opacity: 0, y: 14 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.5, delay: 0.9 }"
          >
            <div
              ref="ctaWrap"
              class="home-hero__mag"
              @mousemove="onMagMove"
              @mouseleave="onMagLeave"
            >
              <motion.button
                type="button"
                class="btn-primary home-hero__cta"
                :style="{ x: mag.x, y: mag.y }"
                :transition="{ type: 'spring', stiffness: 340, damping: 24, mass: 0.35 }"
                @click="go('courts')"
              >
                Đặt sân ngay
                <Icon name="arrowRight" :size="18" />
              </motion.button>
            </div>
            <button type="button" class="btn-text" @click="go('shop')">
              Xem cửa hàng
              <Icon name="arrowRight" :size="16" />
            </button>
          </motion.div>

          <motion.div
            class="home-hero__live"
            aria-hidden="true"
            :initial="{ opacity: 0 }"
            :animate="{ opacity: 1 }"
            :transition="{ delay: 1.15 }"
          >
            <span class="mono">live</span>
            <AnimatePresence mode="wait">
              <motion.span
                :key="beatWord"
                class="home-hero__live-word"
                :initial="{ opacity: 0, y: 10, rotateX: -40 }"
                :animate="{ opacity: 1, y: 0, rotateX: 0 }"
                :exit="{ opacity: 0, y: -10, rotateX: 40 }"
                :transition="{ duration: 0.38 }"
              >
                {{ beatWord }}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>

        <!-- Floating overlapping frame — artistic asymmetry -->
        <motion.div
          class="home-hero__float"
          aria-hidden="true"
          :style="reducedMotion ? undefined : { y: heroFloatY }"
          :initial="{ opacity: 0, x: 40, rotate: 4 }"
          :animate="{ opacity: 1, x: 0, rotate: -2.5 }"
          :transition="{ duration: 1, delay: 0.35, ease: [0.22, 1, 0.36, 1] }"
        >
          <img
            src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=900&h=1100&fit=crop"
            alt=""
          />
          <span class="home-hero__float-cap">court lights · indoor</span>
        </motion.div>
      </motion.div>
    </section>

    <!-- INTEREST: marquee -->
    <section class="home-marquee" aria-hidden="true">
      <div class="home-marquee__track">
        <span v-for="n in 2" :key="n" class="home-marquee__group">
          <span v-for="w in marquee" :key="`${n}-${w}`" class="home-marquee__item">
            {{ w }}
            <i />
          </span>
        </span>
      </div>
    </section>

    <!-- DESIRE: scrubbing text -->
    <section ref="revealRef" class="home-reveal" aria-labelledby="reveal-title">
      <div class="shell">
        <h2 id="reveal-title" class="sr-only">Câu chuyện trên sân</h2>
        <p class="home-reveal__text">
          <motion.span
            v-for="(word, i) in revealWords"
            :key="`${word}-${i}`"
            class="home-reveal__word"
            :style="reducedMotion ? { opacity: 1 } : { opacity: wordOpacities[i] }"
          >
            {{ word }}{{ ' ' }}
          </motion.span>
        </p>
      </div>
    </section>

    <!-- Gallery: native horizontal scroll (no 280vh pin gap) -->
    <section class="home-pin" aria-labelledby="pin-title">
      <div class="shell home-pin__head">
        <p class="eyebrow">
          <Icon name="court" :size="14" />
          Vuốt ngang
        </p>
        <h2 id="pin-title" class="section-head">Khung hình trên sân</h2>
        <p class="lede mt-2.5 text-[14.5px]">Kéo ngang để xem từng khoảnh khắc.</p>
      </div>

      <div class="home-pin__rail" tabindex="0" aria-label="Thư viện ảnh sân">
        <article v-for="slide in pinSlides" :key="slide.id" class="home-pin__slide">
          <div class="home-pin__media">
            <img :src="slide.image" :alt="slide.title" loading="lazy" />
          </div>
          <h3>{{ slide.title }}</h3>
          <p>{{ slide.copy }}</p>
        </article>
      </div>
    </section>

    <!-- Top 5 bestsellers — stacked card motion (SVG reference) -->
    <HomeBestsellers />

    <!-- INTEREST: horizontal accordion -->
    <section ref="accordionRef" class="home-acc" aria-labelledby="acc-title">
      <div class="shell">
        <motion.h2
          id="acc-title"
          class="section-head"
          :initial="{ opacity: 0, y: 22 }"
          :animate="accordionInView ? { opacity: 1, y: 0 } : undefined"
          :transition="{ duration: 0.55 }"
        >
          Chọn một lối vào
        </motion.h2>
        <motion.p
          class="lede mt-3"
          :initial="{ opacity: 0, y: 14 }"
          :animate="accordionInView ? { opacity: 1, y: 0 } : undefined"
          :transition="{ duration: 0.5, delay: 0.06 }"
        >
          Rê chuột để mở — từng hướng một nhịp.
        </motion.p>
      </div>

      <div class="home-acc__row" role="list">
        <button
          v-for="(item, i) in accordionItems"
          :key="item.key"
          type="button"
          role="listitem"
          class="home-acc__pane"
          :class="{ 'is-open': accordionOpen === i }"
          :aria-expanded="accordionOpen === i"
          @mouseenter="accordionOpen = i"
          @focus="accordionOpen = i"
          @click="go(item.to)"
        >
          <img :src="item.image" alt="" class="home-acc__img" />
          <div class="home-acc__veil" />
          <div class="home-acc__body">
            <span class="home-acc__index mono">0{{ i + 1 }}</span>
            <h3>{{ item.title }}</h3>
            <p v-show="accordionOpen === i">{{ item.copy }}</p>
            <span v-show="accordionOpen === i" class="home-acc__cta">
              {{ item.cta }}
              <Icon name="arrowRight" :size="16" />
            </span>
          </div>
        </button>
      </div>
    </section>

    <!-- ACTION: finale -->
    <section ref="finaleRef" class="home-finale" aria-labelledby="finale-title">
      <div class="home-finale__glow" aria-hidden="true" />
      <motion.div
        class="shell home-finale__inner"
        :initial="{ opacity: 0, y: 32, clipPath: 'inset(8% 0% 0% 0%)' }"
        :animate="
          finaleInView
            ? { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)' }
            : undefined
        "
        :transition="{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }"
      >
        <p class="eyebrow">Tối nay</p>
        <h2 id="finale-title" class="home-finale__title">
          Còn chỗ trên sân.<br />
          <span class="grad-lime">Bạn vào chứ?</span>
        </h2>
        <div class="home-finale__actions">
          <motion.button
            type="button"
            class="btn-primary px-7 py-3.5 rounded-2xl inline-flex items-center gap-2"
            :while-hover="{ scale: 1.03 }"
            :while-tap="{ scale: 0.98 }"
            @click="go('courts')"
          >
            Đặt sân
            <Icon name="court" :size="18" />
          </motion.button>
          <motion.button
            type="button"
            class="home-finale__ghost"
            :while-hover="{ scale: 1.02 }"
            :while-tap="{ scale: 0.98 }"
            @click="go('shop')"
          >
            Mua trang bị
            <Icon name="bag" :size="17" />
          </motion.button>
        </div>
      </motion.div>
    </section>
  </div>
</template>
