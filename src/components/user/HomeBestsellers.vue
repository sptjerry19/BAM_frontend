<script setup>
/**
 * Top-5 bestsellers — coverflow carousel: all cards visible, one highlighted at a time.
 */
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { motion } from 'motion-v'
import { getBestsellers } from '../../api'
import Icon from '../common/Icon.vue'
import { formatCurrency, productCoverUrl, categoryLabels } from '../../utils/labels'

const openProductDetail = inject('openProductDetail', null)
const addToCart = inject('addToCart', null)

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const products = ref([])
const loading = ref(true)
const active = ref(0)
const sectionRef = ref(null)
let cycleTimer = null
let swipeX = 0
let didSwipe = false

const EASE = [0.22, 1, 0.36, 1]
const isNarrow = ref(
  typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches,
)

const count = computed(() => products.value.length)

function relativeIndex(i) {
  const n = count.value
  if (n === 0) return 0
  let d = i - active.value
  if (d > n / 2) d -= n
  if (d < -n / 2) d += n
  return d
}

/** Coverflow: active large & center; neighbors peek left/right. */
function cardMotion(i) {
  const d = relativeIndex(i)
  const abs = Math.abs(d)
  const step = isNarrow.value ? 118 : 168

  if (abs > 2) {
    return {
      opacity: 0,
      scale: 0.62,
      x: d * step * 0.85,
      y: 36,
      zIndex: 0,
      filter: 'brightness(0.55)',
      pointerEvents: 'none',
    }
  }

  return {
    opacity: abs === 0 ? 1 : abs === 1 ? 0.88 : 0.55,
    scale: abs === 0 ? 1 : abs === 1 ? 0.84 : 0.72,
    x: d * step,
    y: abs === 0 ? 0 : abs === 1 ? 18 : 32,
    rotateY: d * -8,
    zIndex: 20 - abs,
    filter: abs === 0 ? 'brightness(1)' : `brightness(${1 - abs * 0.18})`,
    pointerEvents: 'auto',
  }
}

function go(i) {
  if (!count.value) return
  active.value = ((i % count.value) + count.value) % count.value
  restartCycle()
}

function next() {
  go(active.value + 1)
}

function prev() {
  go(active.value - 1)
}

function restartCycle() {
  clearInterval(cycleTimer)
  if (reducedMotion || count.value < 2) return
  cycleTimer = setInterval(() => {
    if (document.hidden) return
    active.value = (active.value + 1) % count.value
  }, 2800)
}

function openDetail(p) {
  if (openProductDetail) openProductDetail(p)
}

function onAdd(p, e) {
  e?.stopPropagation()
  if (addToCart) addToCart(p.id)
}

function onCardClick(p, i) {
  if (didSwipe) {
    didSwipe = false
    return
  }
  if (i === active.value) openDetail(p)
  else go(i)
}

function onPointerDown(e) {
  didSwipe = false
  swipeX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
}

function onPointerUp(e) {
  const x = e.clientX ?? e.changedTouches?.[0]?.clientX ?? swipeX
  const dx = x - swipeX
  if (Math.abs(dx) < 48) return
  didSwipe = true
  if (dx < 0) next()
  else prev()
}

function onResize() {
  isNarrow.value = window.matchMedia('(max-width: 640px)').matches
}

onMounted(async () => {
  window.addEventListener('resize', onResize)
  try {
    products.value = await getBestsellers()
  } catch {
    products.value = []
  } finally {
    loading.value = false
    restartCycle()
  }
})

onUnmounted(() => {
  clearInterval(cycleTimer)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <section ref="sectionRef" class="home-tops" aria-labelledby="tops-title">
    <div class="shell home-tops__head">
      <p class="eyebrow">Trending</p>
      <h2 id="tops-title" class="section-head">Bán chạy tuần này</h2>
      <p class="lede mt-2.5 text-[15px]">
        Xếp theo số lượng đã bán — vuốt hoặc chờ vòng quay tự động.
      </p>
    </div>

    <div class="home-tops__stage">
      <div class="home-tops__glow" aria-hidden="true" />

      <div v-if="loading" class="home-tops__stack home-tops__stack--loading" aria-busy="true">
        <div class="home-tops__card home-tops__card--static skeleton" />
      </div>

      <div v-else-if="!products.length" class="home-tops__empty">
        <p class="font-heading font-bold text-[16px]">Chưa có dữ liệu bán chạy</p>
        <p class="lede mt-2 text-[14px]">Sản phẩm sẽ hiện khi có đơn đã thanh toán.</p>
      </div>

      <div
        v-else
        class="home-tops__stack"
        aria-live="polite"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @touchstart.passive="onPointerDown"
        @touchend.passive="onPointerUp"
      >
        <motion.article
          v-for="(p, i) in products"
          :key="p.id"
          class="home-tops__card"
          :class="{ 'is-active': i === active }"
          :initial="reducedMotion ? false : { opacity: 0, scale: 0.7, y: 40 }"
          :animate="cardMotion(i)"
          :transition="{
            duration: reducedMotion ? 0 : 0.7,
            ease: EASE,
          }"
          role="button"
          tabindex="0"
          :aria-current="i === active ? 'true' : undefined"
          :aria-label="`${i + 1}. ${p.brand} ${p.name}`"
          @click="onCardClick(p, i)"
          @keydown.enter="onCardClick(p, i)"
        >
          <span class="home-tops__rank mono">#{{ i + 1 }}</span>
          <div class="home-tops__media">
            <img
              :src="productCoverUrl(p)"
              :alt="`${p.brand} ${p.name}`"
              loading="lazy"
              draggable="false"
            />
          </div>
          <div class="home-tops__body">
            <div class="home-tops__meta">
              {{ p.brand }} · {{ categoryLabels[p.category] || p.category }}
            </div>
            <h3 class="home-tops__name">{{ p.name }}</h3>
            <div class="home-tops__row">
              <div>
                <div class="home-tops__price mono">{{ formatCurrency(p.price) }}</div>
                <div class="home-tops__sold">
                  {{ p.sold_count ? `Đã bán ${p.sold_count}` : 'Nổi bật' }}
                </div>
              </div>
              <button
                v-if="i === active && addToCart"
                type="button"
                class="btn-primary home-tops__add"
                @click="onAdd(p, $event)"
              >
                Thêm
              </button>
            </div>
          </div>
        </motion.article>
      </div>

      <div v-if="products.length > 1" class="home-tops__controls">
        <button type="button" class="icon-btn" aria-label="Sản phẩm trước" @click="prev">
          <Icon name="arrowLeft" :size="18" />
        </button>
        <div class="home-tops__dots" role="tablist" aria-label="Chọn sản phẩm">
          <button
            v-for="(p, i) in products"
            :key="p.id"
            type="button"
            class="home-tops__dot"
            :class="{ 'is-active': i === active }"
            :aria-label="`Top ${i + 1}`"
            :aria-selected="i === active"
            @click="go(i)"
          />
        </div>
        <button type="button" class="icon-btn" aria-label="Sản phẩm sau" @click="next">
          <Icon name="arrowRight" :size="18" />
        </button>
      </div>
    </div>
  </section>
</template>
