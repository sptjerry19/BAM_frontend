<script setup>
import { computed } from 'vue'
import pawns from '../../../assets/games/tour/pawns-transparent.png'

const props = defineProps({ skin: { type: String, default: 'ace' }, size: { type: Number, default: 56 }, anim: { type: String, default: 'idle' }, label: { type: String, default: '' } })
// Crop the four original 2D characters from the supplied artwork; no 3D renderer.
const frames = { ruby: [0, 195, 290, 565], ace: [290, 195, 245, 565], kiwi: [535, 250, 250, 515], blaze: [780, 300, 244, 475] }
const frame = computed(() => frames[props.skin] || frames.ace)
const artStyle = computed(() => {
  const [x, y, w, h] = frame.value
  return { backgroundImage: `url(${pawns})`, backgroundSize: `${1024 / w * 100}% ${1024 / h * 100}%`, backgroundPosition: `${x / (1024 - w) * 100}% ${y / (1024 - h) * 100}%`, aspectRatio: `${w}/${h}` }
})
</script>
<template>
  <span class="asset-pawn" :class="[`anim-${anim}`, skin]" :style="{ width: `${size}px` }" role="img" :aria-label="label || skin">
    <span class="character" :style="artStyle" />
    <span v-if="label" class="tag">{{ label }}</span>
  </span>
</template>
<style scoped>
.asset-pawn { display:inline-block; position:relative; flex:none; filter:drop-shadow(0 7px 3px #21433f40); }
.character { display:block; width:100%; transform-origin:50% 94%; background-repeat:no-repeat; }
.anim-idle .character { animation:idle 2s ease-in-out infinite; }
.anim-walk .character { animation:walk .28s ease-in-out infinite alternate; }
.anim-cheer .character { animation:cheer .6s ease-in-out infinite; }
.tag { position:absolute; bottom:-4px; left:50%; transform:translateX(-50%); padding:1px 5px; border:1px solid #fff; border-radius:5px; background:#164c73; color:white; white-space:nowrap; font-size:9px; font-weight:700; }
@keyframes idle { 50% { transform:translateY(-2px) rotate(1deg); } }
@keyframes walk { from { transform:translateY(-5px) rotate(-5deg); } to { transform:rotate(5deg); } }
@keyframes cheer { 50% { transform:translateY(-9px) rotate(-4deg); } }
@media(prefers-reduced-motion:reduce) { .character { animation:none!important; } }
</style>
