<script setup>
import { computed } from 'vue'

const props = defineProps({
  values: { type: Array, default: () => [1, 1, 1] },
  rolling: { type: Boolean, default: false },
  size: { type: Number, default: 64 },
})

const LAYOUT = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
}

const FACE_ROT = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 },
}

function clamp(n) {
  return Math.min(6, Math.max(1, Number(n) || 1))
}

const dice = computed(() =>
  (props.values.length ? props.values : [1]).slice(0, 3).map((n, i) => {
    const v = clamp(n)
    const rot = FACE_ROT[v]
    return { v, rot, i }
  }),
)
</script>

<template>
  <div class="dice-row" :class="{ rolling }" :style="{ '--d': size + 'px' }" aria-label="Xúc xắc">
    <div
      v-for="die in dice"
      :key="die.i"
      class="scene"
      :style="{ '--i': die.i, '--rx': die.rot.x + 'deg', '--ry': die.rot.y + 'deg' }"
    >
      <div class="cube">
        <span v-for="face in 6" :key="face" class="face" :class="`f${face}`">
          <i v-for="p in 9" :key="p" class="pip" :class="{ on: LAYOUT[face].includes(p) }" />
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dice-row {
  display: flex;
  gap: 16px;
  align-items: center;
  perspective: 420px;
}
.scene {
  width: var(--d);
  height: var(--d);
  transform-style: preserve-3d;
}
.cube {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform 0.45s cubic-bezier(.2, .8, .2, 1);
}
.rolling .cube {
  animation: tumble 0.55s ease-in-out infinite;
  animation-delay: calc(var(--i) * 80ms);
}
.face {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  padding: 10%;
  background: linear-gradient(160deg, #fff, #e8eef8);
  border: 2px solid #cbd5e1;
  border-radius: 18%;
  box-shadow: inset 0 0 0 3px #fff8;
  backface-visibility: hidden;
}
.pip {
  width: 86%;
  height: 86%;
  margin: auto;
  border-radius: 50%;
  background: transparent;
}
.pip.on {
  background: radial-gradient(circle at 32% 28%, #4c6fff, #1e3a8a 52%, #0b1224);
  box-shadow: 0 1px 0 #fff6, inset 0 -2px 0 #0b1224aa;
}
.f1 { transform: rotateY(0deg) translateZ(calc(var(--d) / 2)); }
.f2 { transform: rotateY(90deg) translateZ(calc(var(--d) / 2)); }
.f3 { transform: rotateX(90deg) translateZ(calc(var(--d) / 2)); }
.f4 { transform: rotateX(-90deg) translateZ(calc(var(--d) / 2)); }
.f5 { transform: rotateY(-90deg) translateZ(calc(var(--d) / 2)); }
.f6 { transform: rotateY(180deg) translateZ(calc(var(--d) / 2)); }

@keyframes tumble {
  0% { transform: rotateX(12deg) rotateY(-20deg); }
  35% { transform: rotateX(200deg) rotateY(140deg); }
  70% { transform: rotateX(-80deg) rotateY(280deg); }
  100% { transform: rotateX(var(--rx)) rotateY(var(--ry)); }
}
@media (prefers-reduced-motion: reduce) {
  .rolling .cube { animation: none; }
}
</style>
