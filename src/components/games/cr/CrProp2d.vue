<script setup>
import { computed } from 'vue'
const props = defineProps({ type: { type: String, default: 'property' }, color: { type: String, default: '#279cc7' }, level: { type: Number, default: 1 }, index: { type: Number, default: 0 } })
const tower = computed(() => props.level >= 3 || [9, 27, 33, 39].includes(Number(props.index)))
</script>
<template>
  <svg class="prop-sprite" viewBox="0 0 120 110" aria-hidden="true">
    <ellipse cx="61" cy="96" rx="43" ry="9" fill="#234c3a" opacity=".2"/>
    <path d="m9 82 51-24 51 24v10l-51 17L9 92z" fill="#b7a17a"/>
    <path d="m9 82 51-24 51 24-51 19z" fill="#d1e0aa" stroke="#fff4d5" stroke-width="3"/>
    <template v-if="type === 'chance'">
      <path d="M60 82V29" stroke="#ab7c39" stroke-width="5"/>
      <g class="wheel"><path d="M60 47C23 9 19 58 60 47" fill="#f85b9b"/><path d="M60 47C93 6 105 53 60 47" fill="#ffcd34"/><path d="M60 47C105 85 61 100 60 47" fill="#36a7ef"/><path d="M60 47C22 94 11 46 60 47" fill="#69bb45"/><circle cx="60" cy="47" r="7" fill="#ffe58c" stroke="#b98824" stroke-width="2"/></g>
    </template>
    <template v-else-if="type === 'tax'">
      <g v-for="n in 3" :key="n" :transform="`translate(${n * 22 - 12},${80 - n * 8})`"><path d="M0 0v-18c0-8 29-8 29 0V0c0 9-29 9-29 0" fill="#efb211" stroke="#b7830c" stroke-width="2"/><ellipse cx="14.5" cy="-18" rx="14.5" ry="6" fill="#ffe377"/><path d="M3-9q12 7 23 0" fill="none" stroke="#fff1ac" stroke-width="2"/></g>
    </template>
    <template v-else-if="type === 'rest'">
      <path d="m47 78 3-42h9l5 42" fill="#a87c40"/><path d="M54 38C17 15 15 48 45 44 19 65 42 71 54 45 71 77 98 49 64 41 100 41 83 11 54 38" fill="#4c9a37" stroke="#71ba43" stroke-width="3"/><path d="m70 83 5-23h6l5 23" fill="#bc8d49"/><path d="M78 62C52 45 52 70 73 66 84 86 104 60 78 62" fill="#79b841"/>
    </template>
    <template v-else-if="type === 'service'">
      <path d="m25 50 43-13 26 13v33L51 99 25 85z" fill="#e4f4ec" stroke="#7fa3a7" stroke-width="2"/><path d="m51 63 43-13v33L51 99z" fill="#88b7bc"/><path d="m21 47 47-18 32 17-49 19z" fill="#25879b"/><path d="M34 59v19m11-15v20m17-18 22-8v16l-22 9z" stroke="#29677f" stroke-width="6"/><path d="m14 97 89-30m-80 38 89-30" stroke="#6b7780" stroke-width="3"/>
    </template>
    <template v-else>
      <path :d="tower ? 'M36 29 64 18 84 31v52L58 96 36 82z' : 'M26 54 64 35 94 52v31L55 99 26 83z'" fill="#fff0d2" stroke="#cbb68c" stroke-width="2"/>
      <path :d="tower ? 'm58 40 26-9v52L58 96z' : 'm55 66 39-14v31L55 99z'" fill="#d6c09a"/>
      <path :d="tower ? 'm30 28 33-18 26 19-31 14z' : 'm17 53 37-35 49 31-47 21z'" :fill="color" stroke="#ffffff" stroke-opacity=".55" stroke-width="2"/>
      <path v-if="!tower" d="m54 18 2 52 47-21" fill="#103d56" opacity=".17"/>
      <path v-if="tower" d="M60 12V1l16 6-16 5" fill="#ef5269"/>
      <path :d="tower ? 'M44 43v10m0 9v10m23-22v11m9-15v11m-9 11v11m9-15v11' : 'M36 65v12m8-8v12m23-11v11m13-16v11'" stroke="#4e96b6" stroke-width="6"/>
      <path d="M53 91V78l9-4v16" fill="#93633d"/><ellipse cx="23" cy="85" rx="9" ry="6" fill="#66a04b"/><ellipse cx="98" cy="85" rx="8" ry="5" fill="#80b355"/>
    </template>
  </svg>
</template>
<style scoped>
.prop-sprite { overflow: visible; filter: drop-shadow(0 5px 3px #335e3430); }
.wheel { transform-origin: 60px 47px; animation: spin 12s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media(prefers-reduced-motion:reduce) { .wheel { animation:none; } }
</style>
