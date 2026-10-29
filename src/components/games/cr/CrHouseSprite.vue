<script setup>
import { computed } from 'vue'
import atlas from '../../../assets/games/tour/tiles-transparent.png'
const props = defineProps({ level: { type: Number, default: 1 }, skin: { type: String, default: 'ace' }, color: { type: String, default: '' } })
const houseLevel = computed(() => Math.min(4, Math.max(1, Number(props.level) || 1)))
const color = computed(() => props.color || ({ ace: '#2563eb', ruby: '#db2777', kiwi: '#65a30d', blaze: '#ea580c' }[props.skin] || '#2563eb'))
const frame = computed(() => [[0, 0, 160, 180], [640, 0, 160, 180], [800, 0, 160, 180], [895, 295, 225, 260]][houseLevel.value - 1])
const geometry = computed(() => {
  const [x, y, w, h] = frame.value
  return { size: `${1280 / w * 100}% ${720 / h * 100}%`, position: `${x / (1280 - w) * 100}% ${y / (720 - h) * 100}%`, aspectRatio: `${w}/${h}` }
})
</script>
<template>
  <span class="house-sprite" role="img" :aria-label="`Nhà cấp ${houseLevel}`" :style="{ aspectRatio: geometry.aspectRatio, '--owner-color': color }">
    <span class="base" :style="{ backgroundImage: `url(${atlas})`, backgroundSize: geometry.size, backgroundPosition: geometry.position }" />
    <span class="tint" :style="{ maskImage: `url(${atlas})`, maskSize: geometry.size, maskPosition: geometry.position }" />
    <span class="level">{{ houseLevel }}</span>
  </span>
</template>
<style scoped>
.house-sprite { display:block; position:relative; width:100%; isolation:isolate; filter:drop-shadow(0 5px 3px #31524638); }
.base,.tint { position:absolute; inset:0; background-repeat:no-repeat; }
.tint { background:var(--owner-color); mask-repeat:no-repeat; mix-blend-mode:color; opacity:.78; }
.level { position:absolute; bottom:3%; left:50%; transform:translateX(-50%); min-width:16px; padding:1px 4px; text-align:center; border:1px solid #fff; border-radius:5px; background:var(--owner-color); color:#fff; font-size:10px; font-weight:850; }
</style>
