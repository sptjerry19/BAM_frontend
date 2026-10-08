<script setup>
import { motion } from 'motion-v'
import ThemeToggle from '../common/ThemeToggle.vue'
import LocaleToggle from '../common/LocaleToggle.vue'
import Icon from '../common/Icon.vue'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="min-h-[100dvh] mesh-bg grid-dots flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-y-auto overflow-x-hidden">
    <RouterLink
      :to="{ name: 'home' }"
      class="btn-text absolute top-4 left-4 sm:top-6 sm:left-6 z-10"
    >
      <Icon name="arrowLeft" :size="16" />
      Trang chủ
    </RouterLink>
    <div class="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex items-center gap-2">
      <LocaleToggle />
      <ThemeToggle />
    </div>

    <div
      class="absolute top-1/4 left-1/5 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
      style="background: radial-gradient(circle, var(--accent), transparent 70%)"
    />
    <div
      class="absolute bottom-1/4 right-1/5 w-80 h-80 rounded-full pointer-events-none blur-3xl"
      style="background: radial-gradient(circle, #6366f1, transparent 70%); opacity: 0.08"
    />

    <motion.div
      class="relative w-full max-w-md"
      :initial="{ opacity: 0, y: 24 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }"
    >
      <div class="text-center mb-8">
        <motion.div
          class="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-3xl"
          style="background: linear-gradient(135deg, var(--accent-deep), var(--accent))"
          :animate="{
            boxShadow: [
              '0 0 16px rgba(132,204,22,0.35)',
              '0 0 36px rgba(132,204,22,0.55)',
              '0 0 16px rgba(132,204,22,0.35)',
            ],
          }"
          :transition="{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }"
        >
          🏸
        </motion.div>
        <h1 class="font-heading font-extrabold tracking-tight" style="font-size: clamp(26px, 7vw, 32px)">
          <span class="grad-lime">Badminton</span>
          <span style="color: var(--text)"> Manager</span>
        </h1>
        <p class="text-sm mt-2" style="color: var(--text-3)">{{ subtitle || title }}</p>
      </div>

      <div
        class="rounded-3xl p-5 sm:p-7 glass-strong"
        style="border-radius: var(--r-xl)"
      >
        <h2 class="font-heading font-bold text-xl mb-5">{{ title }}</h2>
        <slot />
      </div>
    </motion.div>
  </div>
</template>
