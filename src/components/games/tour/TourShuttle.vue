<script setup>
import TourBox from './TourBox.vue'

const props = defineProps({
  size: { type: Number, default: 64 },
  anim: { type: String, default: 'idle' },
})
const u = (n) => Math.round((props.size / 10) * n)
</script>

<template>
  <div class="scene" :class="`anim-${anim}`" :style="{ '--s': size + 'px' }">
    <div class="iso">
      <div class="skirt">
        <TourBox :w="u(7)" :h="u(5.5)" :d="u(7)" color="#f8fafc" />
      </div>
      <div class="band">
        <TourBox :w="u(4)" :h="u(1.1)" :d="u(4)" color="#eab308" />
      </div>
      <div class="cork">
        <TourBox :w="u(3.2)" :h="u(2.6)" :d="u(3.2)" color="#e7e5e4" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.scene {
  width: var(--s);
  height: calc(var(--s) * 1.25);
  perspective: 420px;
  display: grid;
  place-items: end center;
}
.iso {
  position: relative;
  width: calc(var(--s) * 0.72);
  height: calc(var(--s) * 1.05);
  transform-style: preserve-3d;
  transform: rotateX(-16deg) rotateY(36deg);
  transform-origin: 50% 100%;
}
.iso > * {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  transform-style: preserve-3d;
}
.cork { bottom: 0; }
.band { bottom: 28%; }
.skirt { bottom: 38%; }
.anim-idle .iso { animation: float 1.6s ease-in-out infinite; }
.anim-fly .iso { animation: fly 0.9s ease-in-out infinite; }
@keyframes float {
  0%, 100% { transform: rotateX(-16deg) rotateY(36deg) translateY(0); }
  50% { transform: rotateX(-16deg) rotateY(42deg) translateY(-10px); }
}
@keyframes fly {
  0%, 100% { transform: rotateX(-28deg) rotateY(20deg) translateY(6px); }
  50% { transform: rotateX(-8deg) rotateY(48deg) translateY(-12px); }
}
@media (prefers-reduced-motion: reduce) {
  .iso { animation: none; }
}
</style>
