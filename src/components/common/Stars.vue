<script setup>
defineProps({
  rating: { type: Number, default: 0 },
  max: { type: Number, default: 5 },
})
</script>

<template>
  <div class="flex items-center gap-0.5">
    <span
      v-for="i in max"
      :key="i"
      class="text-sm leading-none"
      :style="{ color: i <= Math.round(rating) ? '#facc15' : '#1e293b' }"
    >★</span>
    <span class="ml-1 text-xs mono" style="color: #64748b">{{ rating.toFixed(1) }}</span>
  </div>
</template>
