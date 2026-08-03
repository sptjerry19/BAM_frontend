<script setup>
import { motion } from 'motion-v'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <div class="min-h-[100dvh] mesh-bg grid-dots flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-y-auto overflow-x-hidden">
    <div
      class="absolute top-1/4 left-1/5 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
      style="background: radial-gradient(circle, #84cc16, transparent 70%)"
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
          style="background: linear-gradient(135deg, #84cc16, #a3e635)"
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
          <span style="color: #f0f4ff"> Manager</span>
        </h1>
        <p class="text-sm mt-2" style="color: #64748b">{{ subtitle || title }}</p>
      </div>

      <div
        class="rounded-3xl p-5 sm:p-7"
        style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(20px)"
      >
        <h2 class="font-heading font-bold text-xl mb-5">{{ title }}</h2>
        <slot />
      </div>
    </motion.div>
  </div>
</template>
