<script setup>
defineProps({
  rating: { type: Number, default: 0 },
  max: { type: Number, default: 5 },
  size: { type: Number, default: 12 },
})
</script>

<template>
  <div class="flex items-center gap-0.5">
    <span
      v-for="i in max"
      :key="i"
      class="leading-none"
      :style="{ color: i <= Math.round(rating) ? '#facc15' : '#1e293b', fontSize: `${size}px` }"
    >★</span>
    <span class="ml-1 mono" style="color: #64748b" :style="{ fontSize: `${Math.max(size - 1, 10)}px` }">
      {{ rating.toFixed(1) }}
    </span>
  </div>
</template>
