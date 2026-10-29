<script setup>
import { computed } from 'vue'
const props = defineProps({ values: { type: Array, default: () => [1, 1] }, rolling: Boolean, size: { type: Number, default: 54 } })
const dots = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] }
const rotations = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] }
const dice = computed(() => props.values.map((value) => {
  const n = Math.min(6, Math.max(1, Number(value) || 1))
  return { value: n, x: rotations[n][0], y: rotations[n][1] }
}))
</script>
<template>
  <div class="dice" :class="{ rolling }" :style="{ '--size': `${size}px` }" role="img" :aria-label="rolling ? 'Đang tung xúc xắc' : `Xúc xắc: ${dice.map((die) => die.value).join(', ')}`" :aria-busy="rolling">
    <div v-for="(die, index) in dice" :key="index" class="die" :style="{ '--rx': `${die.x}deg`, '--ry': `${die.y}deg`, '--delay': `${index * -100}ms` }">
      <span class="shadow" />
      <div class="camera"><div class="cube">
        <span v-for="face in 6" :key="face" class="face" :class="`face-${face}`">
          <i v-for="position in 9" :key="position" class="pip" :class="{ visible: dots[face].includes(position) }" />
        </span>
      </div></div>
      <span class="value" aria-hidden="true">{{ rolling ? '…' : die.value }}</span>
    </div>
  </div>
</template>
<style scoped>
.dice { display:flex; gap:24px; padding:14px 12px 4px; perspective:600px; }
.die { width:var(--size); position:relative; padding-bottom:21px; transform-style:preserve-3d; }
.camera { width:var(--size); height:var(--size); transform:rotateX(-18deg) rotateY(-24deg); transform-style:preserve-3d; }
.cube { position:relative; width:100%; height:100%; transform-style:preserve-3d; transform:rotateX(var(--rx)) rotateY(var(--ry)); transition:transform .45s cubic-bezier(.2,.8,.2,1); }
.face { position:absolute; inset:0; display:grid; grid-template:repeat(3,1fr)/repeat(3,1fr); padding:13%; border:1px solid #b9cde0; border-radius:12%; background:linear-gradient(135deg,#fff,#e1ecf5); box-shadow:inset 0 0 0 2px #fff9; backface-visibility:hidden; }
.pip { display:block; width:75%; aspect-ratio:1; margin:auto; border-radius:50%; }
.pip.visible { background:radial-gradient(circle at 35% 25%,#3679b7,#123657); box-shadow:inset 0 1px 2px #09233a99; }
.face-1 { transform:translateZ(calc(var(--size) / 2)); }
.face-2 { transform:rotateY(90deg) translateZ(calc(var(--size) / 2)); }
.face-3 { transform:rotateX(90deg) translateZ(calc(var(--size) / 2)); }
.face-4 { transform:rotateX(-90deg) translateZ(calc(var(--size) / 2)); }
.face-5 { transform:rotateY(-90deg) translateZ(calc(var(--size) / 2)); }
.face-6 { transform:rotateY(180deg) translateZ(calc(var(--size) / 2)); }
.shadow { position:absolute; left:-8%; right:-8%; bottom:16px; height:15px; border-radius:50%; background:#315a6c38; filter:blur(4px); }
.value { position:relative; display:block; text-align:center; margin-top:12px; font-size:12px; color:#1c466b; font-weight:850; }
.rolling .camera { animation:hop .5s ease-in-out infinite; animation-delay:var(--delay); }
.rolling .cube { animation:tumble .6s linear infinite; animation-delay:var(--delay); }
.rolling .shadow { animation:shadow .5s ease-in-out infinite; }
@keyframes tumble { from { transform:rotateX(0deg) rotateY(0deg) rotateZ(0deg); } to { transform:rotateX(360deg) rotateY(720deg) rotateZ(180deg); } }
@keyframes hop { 50% { transform:translateY(-14px) rotateX(-28deg) rotateY(24deg); } }
@keyframes shadow { 50% { transform:scale(.65); opacity:.45; } }
@media(prefers-reduced-motion:reduce) { .cube { transition:none; } .rolling .camera,.rolling .cube,.rolling .shadow { animation:none; } }
</style>
