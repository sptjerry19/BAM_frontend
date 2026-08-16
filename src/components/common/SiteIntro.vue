<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { motion, AnimatePresence } from 'motion-v'

const props = defineProps({
  /** App auth/bootstrap ready — intro waits for this before exiting. */
  ready: { type: Boolean, default: false },
})

const STORAGE_KEY = 'jb_intro_seen'
const BRAND = 'JBadminton'
const letters = BRAND.split('')

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const visible = ref(false)
const phase = ref('enter') // enter | hold | exit
const animDone = ref(false)
let timers = []

function later(fn, ms) {
  const id = setTimeout(fn, ms)
  timers.push(id)
  return id
}

function markSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* private mode */
  }
}

function finish() {
  if (phase.value === 'exit') return
  phase.value = 'exit'
  markSeen()
  later(() => {
    visible.value = false
    document.documentElement.classList.remove('intro-lock')
  }, reducedMotion ? 220 : 720)
}

function tryFinish() {
  if (animDone.value && props.ready) finish()
}

function skip() {
  animDone.value = true
  finish()
}

onMounted(() => {
  let seen = false
  try {
    seen = sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    seen = false
  }

  if (seen) {
    animDone.value = true
    return
  }

  visible.value = true
  document.documentElement.classList.add('intro-lock')

  if (reducedMotion) {
    later(() => {
      animDone.value = true
      tryFinish()
    }, 500)
    return
  }

  // Enter → hold → ready to leave once bootstrap also done
  later(() => {
    phase.value = 'hold'
  }, 1680)
  later(() => {
    animDone.value = true
    tryFinish()
  }, 2650)
})

watch(
  () => props.ready,
  () => tryFinish(),
)

onUnmounted(() => {
  timers.forEach(clearTimeout)
  document.documentElement.classList.remove('intro-lock')
})
</script>

<template>
  <AnimatePresence>
    <motion.div
      v-if="visible"
      class="site-intro"
      role="dialog"
      aria-label="Giới thiệu JBadminton"
      aria-modal="true"
      :initial="{ opacity: 1 }"
      :animate="{ opacity: 1 }"
      :exit="{ opacity: 0, y: '-8%', filter: 'blur(8px)' }"
      :transition="{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }"
    >
      <div class="site-intro__bg" aria-hidden="true">
        <div class="site-intro__lines court-lines" />
        <div class="site-intro__glow" />
        <div class="site-intro__vignette" />
      </div>

      <!-- Flying shuttle streak -->
      <motion.div
        v-if="!reducedMotion"
        class="site-intro__streak"
        aria-hidden="true"
        :initial="{ opacity: 0, x: '-42vw', rotate: -18 }"
        :animate="{ opacity: [0, 1, 1, 0], x: '48vw', rotate: 12 }"
        :transition="{ duration: 1.15, delay: 0.12, ease: [0.22, 1, 0.36, 1] }"
      />

      <div class="site-intro__stage">
        <!-- Brand mark -->
        <motion.div
          class="site-intro__mark"
          :initial="reducedMotion ? false : { opacity: 0, scale: 0.55, rotate: -18 }"
          :animate="{ opacity: 1, scale: 1, rotate: 0 }"
          :transition="{
            duration: 0.85,
            delay: 0.18,
            ease: [0.22, 1, 0.36, 1],
          }"
        >
          <span class="site-intro__mark-ring" aria-hidden="true" />
          <svg
            class="site-intro__mark-svg"
            viewBox="0 0 80 80"
            fill="none"
            aria-hidden="true"
          >
            <!-- Shuttlecock -->
            <path
              d="M40 14 30.5 30h19L40 14Z"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linejoin="round"
            />
            <path
              d="M30.5 30 25 40.5M40 30v10.5M49.5 30 55 40.5"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
            />
            <path
              d="M28 39c3.4 8.2 20.6 8.2 24 0"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
            />
            <path
              d="M30.5 45c2.8 5.6 16.2 5.6 19 0"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              opacity="0.7"
            />
            <!-- J stem -->
            <path
              d="M46 48v12.5c0 5.2-3.8 9-9.2 9s-9-3.6-9-9"
              stroke="currentColor"
              stroke-width="3.2"
              stroke-linecap="round"
            />
          </svg>
        </motion.div>

        <!-- Wordmark -->
        <h1 class="site-intro__word" aria-label="JBadminton">
          <motion.span
            v-for="(ch, i) in letters"
            :key="`${ch}-${i}`"
            class="site-intro__letter"
            :class="{ 'is-accent': i === 0 }"
            :initial="reducedMotion ? false : { opacity: 0, y: 28, filter: 'blur(10px)' }"
            :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
            :transition="{
              duration: 0.55,
              delay: 0.55 + i * 0.055,
              ease: [0.22, 1, 0.36, 1],
            }"
          >{{ ch }}</motion.span>
        </h1>

        <motion.p
          class="site-intro__tag"
          :initial="reducedMotion ? false : { opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ duration: 0.5, delay: 1.15, ease: [0.22, 1, 0.36, 1] }"
        >
          Đặt sân · Trang bị · Hà Nội
        </motion.p>

        <motion.div
          class="site-intro__rule"
          aria-hidden="true"
          :initial="reducedMotion ? false : { scaleX: 0, opacity: 0 }"
          :animate="{ scaleX: 1, opacity: 1 }"
          :transition="{ duration: 0.7, delay: 1.35, ease: [0.22, 1, 0.36, 1] }"
        />
      </div>

      <button type="button" class="site-intro__skip" @click="skip">
        Bỏ qua
      </button>
    </motion.div>
  </AnimatePresence>
</template>
