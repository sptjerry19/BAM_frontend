<script setup>
defineProps({ values: { type: Array, default: () => [1, 1] }, rolling: Boolean, size: { type: Number, default: 48 } })
const dots = { 1: [[42, 40]], 2: [[31, 29], [53, 51]], 3: [[31, 29], [42, 40], [53, 51]], 4: [[31, 29], [53, 29], [31, 51], [53, 51]], 5: [[31, 29], [53, 29], [42, 40], [31, 51], [53, 51]], 6: [[31, 27], [53, 27], [31, 40], [53, 40], [31, 53], [53, 53]] }
</script>
<template>
  <div class="dice" :class="{ rolling }" role="img" :aria-label="`Xúc xắc: ${values.join(', ')}`">
    <svg v-for="(value, i) in values" :key="i" viewBox="0 0 86 88" :style="{ width: `${size}px`, animationDelay: `${i * 90}ms` }" aria-hidden="true">
      <ellipse cx="45" cy="79" rx="31" ry="7" fill="#315c81" opacity=".18"/>
      <path d="m12 22 57-9 10 9v48L25 82 12 70z" fill="#b9d9ec" stroke="#96b9d0" stroke-width="2"/>
      <path d="m25 29 54-7v48L25 82z" fill="#dbeefa"/>
      <path d="M12 22q0-10 10-11l42-4q9-1 9 8v44q0 8-9 10l-40 8q-12 2-12-10z" fill="#fff" stroke="#d7e7ef" stroke-width="2"/>
      <ellipse v-for="([x, y], j) in (dots[value] || dots[1])" :key="j" :cx="x" :cy="y" rx="4.5" ry="4" fill="#135598"/>
      <circle cx="76" cy="46" r="2.5" fill="#659ab9"/>
    </svg>
  </div>
</template>
<style scoped>
.dice { display:flex; gap:12px; align-items:center; }
svg { overflow:visible; }
.rolling svg { animation: roll .4s ease-in-out infinite alternate; }
@keyframes roll { to { transform: translateY(-12px) rotate(22deg); } }
@media(prefers-reduced-motion:reduce) { .rolling svg { animation:none; } }
</style>
