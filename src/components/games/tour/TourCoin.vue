<script setup>
import TourBox from './TourBox.vue'

defineProps({
  amount: { type: [Number, String], default: null },
  size: { type: Number, default: 56 },
  spin: { type: Boolean, default: true },
})
</script>

<template>
  <span class="wrap" :style="{ '--s': size + 'px' }">
    <div class="scene">
      <div class="coin" :class="{ spin }">
        <TourBox :w="size" :h="size" :d="Math.max(10, size * 0.18)" color="#eab308" />
      </div>
    </div>
    <span v-if="amount != null" class="amt">{{ amount }}</span>
  </span>
</template>

<style scoped>
.wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.scene {
  width: var(--s);
  height: var(--s);
  perspective: 420px;
  transform-style: preserve-3d;
}
.coin {
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform: rotateX(-18deg) rotateY(32deg);
}
.coin.spin { animation: spin 1.4s linear infinite; }
.amt { font-weight: 700; color: #a16207; font-size: 14px; }
@keyframes spin {
  to { transform: rotateX(-18deg) rotateY(392deg); }
}
@media (prefers-reduced-motion: reduce) {
  .coin.spin { animation: none; }
}
</style>
