<script setup>
import { computed } from 'vue'
import { HOUSE_LEVELS, TOUR_SKINS } from './catalog'
import TourBox from './TourBox.vue'

const props = defineProps({
  skin: { type: String, default: '' },
  color: { type: String, default: '#2563eb' },
  level: { type: Number, default: 1 },
  floors: { type: Number, default: null },
  size: { type: Number, default: 88 },
  pop: { type: Boolean, default: true },
  compact: { type: Boolean, default: false },
  fill: { type: Boolean, default: false },
})

const lv = computed(() => {
  const raw = props.floors ?? props.level
  return Math.min(4, Math.max(1, Number(raw) || 1))
})

const wall = computed(() => {
  const match = TOUR_SKINS.find((s) => s.id === props.skin)
  return match?.color || props.color || '#2563eb'
})

const roof = computed(() => (lv.value >= 4 ? '#eab308' : '#dc2626'))
const meta = computed(() => HOUSE_LEVELS[lv.value - 1])
const u = computed(() => Math.max(4, props.fill ? 9.2 : props.size / 10))
</script>

<template>
  <div
    class="house"
    :class="{ pop, compact, fill, [`lv${lv}`]: true }"
    :style="{ '--s': size + 'px', '--u': u + 'px' }"
    :aria-label="`${meta.name}, cấp ${lv}`"
  >
    <div class="iso">
      <div v-if="lv >= 4" class="podium">
        <TourBox :w="u * 5.4" :h="u * 1.15" :d="u * 5.2" :color="wall" />
      </div>
      <div class="body">
        <TourBox
          :w="lv >= 4 ? u * 3.4 : u * 4.2"
          :h="u * (1.15 + lv * 0.95)"
          :d="lv >= 4 ? u * 3.2 : u * 3.8"
          :color="wall"
        />
      </div>
      <div class="win A">
        <TourBox :w="u * 1.1" :h="u * 1.05" :d="u * 0.35" color="#fde68a" />
      </div>
      <div v-if="lv >= 2" class="win B">
        <TourBox :w="u * 1.1" :h="u * 1.05" :d="u * 0.35" color="#fde68a" />
      </div>
      <div class="door">
        <TourBox :w="u * 1.05" :h="u * 1.5" :d="u * 0.4" color="#7c2d12" />
      </div>
      <div class="roof">
        <TourBox
          :w="lv >= 4 ? u * 3.6 : u * 4.3"
          :h="u * (lv >= 4 ? 0.5 : 0.85)"
          :d="lv >= 4 ? u * 3.4 : u * 3.9"
          :color="roof"
        />
      </div>
      <div v-if="lv >= 3" class="stack">
        <TourBox :w="u * 0.7" :h="u * 1.4" :d="u * 0.7" color="#94a3b8" />
      </div>
    </div>
    <span v-if="!compact" class="badge">Lv.{{ lv }} · {{ meta.name }}</span>
  </div>
</template>

<style scoped>
.house {
  --s: 88px;
  --u: 8px;
  width: var(--s);
  height: calc(var(--s) * 1.2);
  position: relative;
  perspective: 420px;
  display: grid;
  place-items: end center;
  pointer-events: none;
  filter: drop-shadow(0 10px 8px rgb(15 23 42 / 0.45));
}
.house.fill {
  width: 100%;
  height: 100%;
  --s: 100%;
}
.house.fill .iso {
  transform: rotateX(-24deg) rotateY(38deg) translateZ(8px) scale3d(1.18, 1.02, 1.18);
}
.iso {
  width: calc(var(--u) * 5.6);
  height: calc(var(--u) * (6 + 2.2));
  position: relative;
  transform-style: preserve-3d;
  transform: rotateX(-22deg) rotateY(36deg) translateZ(8px);
  transform-origin: 50% 100%;
}
.iso > * {
  position: absolute;
  transform-style: preserve-3d;
  left: 50%;
  bottom: 0;
  margin-left: calc(var(--u) * -2.1);
}
.podium {
  margin-left: calc(var(--u) * -2.7);
  z-index: 0;
}
.body { z-index: 1; }
.lv4 .body { bottom: calc(var(--u) * 1.05); }
.door {
  z-index: 2;
  bottom: calc(var(--u) * 0.15);
  margin-left: calc(var(--u) * -0.5);
}
.lv4 .door { bottom: calc(var(--u) * 1.2); }
.win {
  z-index: 2;
  margin-left: calc(var(--u) * 0.55);
}
.win.A { bottom: calc(var(--u) * 2.05); }
.win.B { bottom: calc(var(--u) * 3.45); }
.lv3 .win.B, .lv4 .win.B { bottom: calc(var(--u) * 4.2); }
.roof {
  z-index: 3;
  bottom: calc(var(--u) * (1.8 + 1.35));
  margin-left: calc(var(--u) * -2.15);
}
.lv1 .roof { bottom: calc(var(--u) * 2.05); }
.lv2 .roof { bottom: calc(var(--u) * 3.0); }
.lv3 .roof { bottom: calc(var(--u) * 3.95); }
.lv4 .roof {
  bottom: calc(var(--u) * 6.2);
  margin-left: calc(var(--u) * -1.9);
  transform: none;
}
.stack {
  z-index: 4;
  bottom: calc(var(--u) * 6.4);
  margin-left: calc(var(--u) * 1.1);
}
.lv4 .stack { bottom: calc(var(--u) * 8.6); }
.badge {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: #0f172acc;
  padding: 1px 6px;
  border-radius: 999px;
  white-space: nowrap;
  z-index: 5;
}
.house.pop .iso { animation: pop 0.5s cubic-bezier(.2, 1.4, .3, 1) both; }
.house.fill.pop .iso { animation-name: pop-fill; }
@keyframes pop {
  from { transform: rotateX(-22deg) rotateY(36deg) translateZ(8px) scale(0.35) translateY(18px); opacity: 0; }
  to { transform: rotateX(-22deg) rotateY(36deg) translateZ(8px) scale(1) translateY(0); opacity: 1; }
}
@keyframes pop-fill {
  from { transform: rotateX(-24deg) rotateY(38deg) translateZ(10px) scale3d(0.4, 0.4, 0.4) translateY(14px); opacity: 0; }
  to { transform: rotateX(-24deg) rotateY(38deg) translateZ(8px) scale3d(1.18, 1.02, 1.18) translateY(0); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .house.pop .iso { animation: none; }
}
</style>
