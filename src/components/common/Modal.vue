<script setup>
import { motion } from 'motion-v'

defineProps({
  title: { type: String, default: '' },
  wide: { type: Boolean, default: false },
})

defineEmits(['close'])
</script>

<template>
  <motion.div
    class="modal-backdrop fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
    :initial="{ opacity: 0 }"
    :animate="{ opacity: 1 }"
    :exit="{ opacity: 0 }"
    :transition="{ duration: 0.2 }"
    @click.self="$emit('close')"
  >
    <motion.div
      class="glass-strong rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 w-full relative max-h-[92dvh] overflow-y-auto"
      :class="wide ? 'max-w-3xl' : 'max-w-md'"
      :initial="{ opacity: 0, y: 40, scale: 0.98 }"
      :animate="{ opacity: 1, y: 0, scale: 1 }"
      :exit="{ opacity: 0, y: 24, scale: 0.98 }"
      :transition="{ type: 'spring', damping: 25, stiffness: 300 }"
      @click.stop
    >
      <div class="flex items-center justify-between mb-6">
        <h2
          style="font-family: 'Be Vietnam Pro', sans-serif; font-size: 20px; font-weight: 800; color: var(--text)"
        >
          {{ title }}
        </h2>
        <motion.button
          type="button"
          class="btn-ghost w-9 h-9 p-0 rounded-full flex items-center justify-center text-xl leading-none"
          style="color: var(--text-3)"
          :whileHover="{ rotate: 90 }"
          :transition="{ duration: 0.2 }"
          @click="$emit('close')"
        >
          ×
        </motion.button>
      </div>
      <slot />
    </motion.div>
  </motion.div>
</template>
