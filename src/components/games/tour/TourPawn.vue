<script setup>
import { computed } from 'vue'
import { skinById } from './catalog'
import TourBox from './TourBox.vue'

const props = defineProps({
  skin: { type: String, default: 'ace' },
  anim: { type: String, default: 'idle' },
  size: { type: Number, default: 110 },
  facing: { type: String, default: 'se' },
  name: { type: String, default: '' },
  label: { type: String, default: '' },
})

const def = computed(() => skinById(props.skin))
const displayName = computed(() => props.name || def.value.name)
const u = computed(() => props.size / 10)
const isMascot = computed(() => def.value.type === 'mascot')
const dark = '#1e293b'
const skin = '#f1c7a4'
</script>

<template>
  <div
    class="pawn"
    :class="[`anim-${anim}`, `face-${facing}`, { mascot: isMascot }]"
    :style="{ '--s': size + 'px', '--u': u + 'px' }"
    :aria-label="`${displayName} ${anim}`"
  >
    <div class="iso">
      <template v-if="isMascot">
        <div class="leg L">
          <TourBox :w="u * 1.1" :h="u * 2.2" :d="u * 1.1" :color="dark" />
        </div>
        <div class="leg R">
          <TourBox :w="u * 1.1" :h="u * 2.2" :d="u * 1.1" :color="dark" />
        </div>
        <div class="body">
          <TourBox :w="u * 4.2" :h="u * 4.4" :d="u * 3.6" :color="def.color" />
        </div>
        <div class="wing L">
          <TourBox :w="u * 1.1" :h="u * 2.6" :d="u * 2.8" :color="def.accent" />
        </div>
        <div class="wing R">
          <TourBox :w="u * 1.1" :h="u * 2.6" :d="u * 2.8" :color="def.accent" />
        </div>
        <div class="head">
          <TourBox :w="u * 2.4" :h="u * 1.8" :d="u * 2.4" :color="def.accent" />
        </div>
        <div class="beak">
          <TourBox :w="u * 1.1" :h="u * 0.8" :d="u * 1.4" :color="def.accent" />
        </div>
      </template>
      <template v-else>
        <div class="leg L">
          <TourBox :w="u * 1.2" :h="u * 3" :d="u * 1.2" :color="dark" />
        </div>
        <div class="leg R">
          <TourBox :w="u * 1.2" :h="u * 3" :d="u * 1.2" :color="dark" />
        </div>
        <div class="torso">
          <TourBox :w="u * 3.2" :h="u * 3.8" :d="u * 2" :color="def.color" />
        </div>
        <div class="head">
          <TourBox :w="u * 2.4" :h="u * 2.4" :d="u * 2.4" :color="skin" />
        </div>
        <div class="arm L">
          <TourBox :w="u * 1" :h="u * 2.8" :d="u * 1" :color="def.color" />
        </div>
        <div class="arm R">
          <TourBox :w="u * 1" :h="u * 2.8" :d="u * 1" :color="def.color" />
          <div class="racket">
            <TourBox :w="u * 0.8" :h="u * 3.2" :d="u * 1.6" :color="def.accent" />
          </div>
        </div>
      </template>
    </div>
    <span v-if="label || name" class="tag">{{ displayName }}</span>
  </div>
</template>

<style scoped>
.pawn {
  --s: 110px;
  --u: 11px;
  width: var(--s);
  height: calc(var(--s) * 1.35);
  perspective: 480px;
  position: relative;
  display: grid;
  place-items: end center;
}
.iso {
  width: calc(var(--u) * 6);
  height: calc(var(--u) * 11);
  position: relative;
  transform-style: preserve-3d;
  transform: rotateX(-16deg) rotateY(38deg);
  transform-origin: 50% 100%;
  margin-bottom: 8%;
}
.iso > * {
  position: absolute;
  transform-style: preserve-3d;
}
.leg {
  bottom: 0;
  transform-origin: 50% 0%;
}
.leg.L { left: calc(var(--u) * 1.2); }
.leg.R { right: calc(var(--u) * 1.2); }
.torso {
  left: calc(var(--u) * 1.4);
  bottom: calc(var(--u) * 2.8);
}
.head {
  left: calc(var(--u) * 1.8);
  bottom: calc(var(--u) * 6.6);
}
.arm {
  bottom: calc(var(--u) * 4.2);
  transform-origin: 50% 0%;
}
.arm.L { left: calc(var(--u) * 0.3); }
.arm.R { right: calc(var(--u) * 0.3); }
.racket {
  position: absolute;
  left: calc(var(--u) * -0.1);
  top: calc(var(--u) * 2.2);
  transform-style: preserve-3d;
}
.body {
  left: calc(var(--u) * 0.9);
  bottom: calc(var(--u) * 2);
}
.mascot .head {
  left: calc(var(--u) * 1.8);
  bottom: calc(var(--u) * 6.4);
}
.beak {
  left: calc(var(--u) * 2.45);
  bottom: calc(var(--u) * 5.4);
}
.wing {
  bottom: calc(var(--u) * 3.4);
  transform-origin: 50% 80%;
}
.wing.L { left: calc(var(--u) * 0.05); }
.wing.R { right: calc(var(--u) * 0.05); }
.face-nw .iso, .face-sw .iso { transform: rotateX(-16deg) rotateY(-38deg); }
.tag {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  background: #0f172acc;
  padding: 1px 6px;
  border-radius: 999px;
  white-space: nowrap;
}

.anim-idle .iso { animation: bob 1.2s ease-in-out infinite; }
.anim-walk .leg.L { animation: stride 0.42s ease-in-out infinite; }
.anim-walk .leg.R { animation: stride 0.42s ease-in-out infinite reverse; }
.anim-walk .arm.L { animation: swing 0.42s ease-in-out infinite reverse; }
.anim-walk .arm.R { animation: swing 0.42s ease-in-out infinite; }
.anim-walk .wing { animation: flap 0.42s ease-in-out infinite; }
.anim-walk .iso { animation: bob 0.42s ease-in-out infinite; }
.anim-hop .iso { animation: hop 0.5s ease-in-out 1; }
.anim-cheer .arm.R { animation: raise 0.55s ease-in-out infinite alternate; }
.anim-cheer .arm.L { animation: raise 0.55s ease-in-out infinite alternate; }
.anim-cheer .wing { animation: flap 0.35s ease-in-out infinite; }
.anim-cheer .iso { animation: bob 0.5s ease-in-out infinite; }
.anim-sad .torso, .anim-sad .body { transform: rotateX(18deg); }
.anim-win .iso { animation: win 0.85s ease-in-out infinite; }
.anim-win .arm.R, .anim-win .arm.L { animation: raise 0.45s ease-in-out infinite alternate; }

@keyframes bob {
  0%, 100% { transform: rotateX(-16deg) rotateY(38deg) translateY(0); }
  50% { transform: rotateX(-16deg) rotateY(38deg) translateY(-8%); }
}
.face-nw.anim-idle .iso, .face-sw.anim-idle .iso,
.face-nw.anim-walk .iso, .face-sw.anim-walk .iso,
.face-nw.anim-cheer .iso, .face-sw.anim-cheer .iso {
  animation-name: bob-flip;
}
@keyframes bob-flip {
  0%, 100% { transform: rotateX(-16deg) rotateY(-38deg) translateY(0); }
  50% { transform: rotateX(-16deg) rotateY(-38deg) translateY(-8%); }
}
@keyframes stride {
  0%, 100% { transform: rotateX(28deg); }
  50% { transform: rotateX(-28deg); }
}
@keyframes swing {
  0%, 100% { transform: rotateX(-24deg); }
  50% { transform: rotateX(24deg); }
}
@keyframes flap {
  0%, 100% { transform: rotateZ(-18deg); }
  50% { transform: rotateZ(22deg); }
}
@keyframes hop {
  0%, 100% { transform: rotateX(-16deg) rotateY(38deg) translateY(0); }
  40% { transform: rotateX(-16deg) rotateY(38deg) translateY(-22%); }
}
@keyframes raise {
  from { transform: rotateX(10deg); }
  to { transform: rotateX(-110deg); }
}
@keyframes win {
  0%, 100% { transform: rotateX(-16deg) rotateY(38deg) translateY(0); }
  30% { transform: rotateX(-16deg) rotateY(32deg) translateY(-20%); }
  60% { transform: rotateX(-16deg) rotateY(44deg) translateY(-8%); }
}
@media (prefers-reduced-motion: reduce) {
  .iso, .leg, .arm, .wing { animation: none !important; }
}
</style>
