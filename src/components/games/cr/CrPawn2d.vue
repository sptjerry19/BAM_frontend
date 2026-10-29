<script setup>
import { computed, useId } from 'vue'
const props = defineProps({ skin: { type: String, default: 'ace' }, size: { type: Number, default: 80 }, anim: { type: String, default: 'idle' }, label: { type: String, default: '' } })
const id = useId().replace(/:/g, '')
const palette = computed(() => ({ ace: ['#ffd644', '#cc8d08'], ruby: ['#ff69b4', '#b92c72'], kiwi: ['#f7a344', '#b35417'], blaze: ['#57b8ff', '#1762a9'] }[props.skin] || ['#ffd644', '#cc8d08']))
</script>

<template>
  <span class="sprite" :class="[`state-${anim}`, skin]" :style="{ '--size': `${size}px` }" :aria-label="label || skin" role="img">
    <svg viewBox="0 0 120 170" aria-hidden="true">
      <defs>
        <linearGradient :id="`${id}-shirt`" x2="1" y2="1"><stop :stop-color="palette[0]"/><stop offset="1" :stop-color="palette[1]"/></linearGradient>
        <radialGradient :id="`${id}-face`" cx=".32" cy=".25" r=".85"><stop stop-color="#ffe4c3"/><stop offset="1" stop-color="#d6996e"/></radialGradient>
        <linearGradient :id="`${id}-base`" x2="0" y2="1"><stop :stop-color="palette[0]"/><stop offset="1" :stop-color="palette[1]"/></linearGradient>
      </defs>
      <ellipse class="shadow" cx="59" cy="155" rx="36" ry="10" fill="#174b3e" opacity=".22"/>
      <path d="M23 147v8c0 16 72 16 72 0v-8" :fill="palette[1]"/>
      <ellipse cx="59" cy="147" rx="36" ry="12" :fill="`url(#${id}-base)`" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>
      <g class="body">
        <path v-if="skin === 'ruby'" d="M45 33C10 11 8 66 30 81l10-20" fill="#673c32"/>
        <path v-if="skin === 'kiwi'" d="M76 101c40-28 33 36 1 29" fill="#ef912f" stroke="#fff2d2" stroke-width="8"/>
        <g class="leg left"><path d="M47 111l-4 26" stroke="#243950" stroke-width="13" stroke-linecap="round"/><path d="M36 136l15 2v8H31q-3-7 5-10" fill="#fff" stroke="#cedce4" stroke-width="2"/></g>
        <g class="leg right"><path d="M66 111l6 25" stroke="#17293f" stroke-width="13" stroke-linecap="round"/><path d="M65 136l15 1 5 9H64z" fill="#f5fbff" stroke="#cedce4" stroke-width="2"/></g>
        <path d="M40 73q18-10 35 2l5 38q-20 12-43-1z" :fill="`url(#${id}-shirt)`" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
        <path d="M63 77v32M48 80l8 9 8-10" fill="none" stroke="#fff" stroke-opacity=".65" stroke-width="2"/>
        <g class="arm left"><path d="M40 80l-9 23 9 8" fill="none" :stroke="palette[1]" stroke-width="12" stroke-linecap="round"/><circle cx="40" cy="110" r="6" fill="#edb88e"/></g>
        <g class="arm right"><path d="M75 80l10 21 10-9" fill="none" :stroke="palette[0]" stroke-width="12" stroke-linecap="round"/><path d="M94 93l8-26" stroke="#394858" stroke-width="4"/><ellipse cx="106" cy="51" rx="12" ry="19" transform="rotate(20 106 51)" fill="#e0f9ff" fill-opacity=".55" stroke="#f5faff" stroke-width="4"/><path d="M97 43l17 8m-20 0 18 8m-11-24-9 30m16-27-10 30" stroke="#627d8f" stroke-opacity=".55"/><circle cx="94" cy="94" r="6" fill="#f0bf96"/></g>
        <g class="head">
          <path v-if="skin === 'kiwi'" d="M36 39 32 8l24 20L78 9l3 33" fill="#ef912f" stroke="#fff1cf" stroke-width="4"/>
          <ellipse cx="58" cy="47" rx="27" ry="29" :fill="skin === 'kiwi' ? '#f3a140' : `url(#${id}-face)`"/>
          <path v-if="skin !== 'kiwi'" d="M31 41C23 8 67 2 81 25l4 17-13-13-11 8-6-12-10 14z" fill="#49352e"/>
          <path v-if="skin === 'ruby'" d="M32 32q24-18 47 2" fill="none" stroke="#ff78bc" stroke-width="7"/>
          <path v-if="skin === 'blaze'" d="M29 34q-1-27 29-27 27 0 27 29l-10 3q-27-11-46-5" fill="#2279bd"/><path v-if="skin === 'blaze'" d="M53 34q22-7 39 5-16 8-38 2" fill="#1b5e9a"/>
          <path v-if="skin === 'kiwi'" d="M32 48q26 11 51-1-4 27-25 28-21-1-26-27" fill="#fff2d7"/>
          <ellipse cx="48" cy="47" rx="4" ry="6" fill="#302b2a"/><ellipse cx="70" cy="46" rx="4" ry="6" fill="#302b2a"/>
          <circle cx="49" cy="45" r="1.5" fill="white"/><circle cx="71" cy="44" r="1.5" fill="white"/>
          <path d="M54 62q7 6 13-1" fill="none" stroke="#914b3d" stroke-width="2.5" stroke-linecap="round"/>
        </g>
      </g>
    </svg>
    <span v-if="label" class="label">{{ label }}</span>
  </span>
</template>

<style scoped>
.sprite { display: inline-block; position: relative; width: var(--size); height: calc(var(--size) * 1.42); flex: none; }
svg { width: 100%; height: 100%; overflow: visible; }
.body,.head,.arm,.leg { transform-box: fill-box; transform-origin: center bottom; }
.body { animation: breathe 2s ease-in-out infinite; }
.arm { transform-origin: center top; }
.state-walk .body { animation: bounce .3s ease-in-out infinite; }
.state-walk .left { animation: stride .3s ease-in-out infinite alternate; }
.state-walk .right { animation: stride .3s ease-in-out infinite alternate-reverse; }
.state-cheer .arm.right { animation: wave .6s ease-in-out infinite alternate; }
.state-cheer .body { animation: bounce .65s ease-in-out infinite; }
.label { position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); background: #fff; color: #173d66; border: 2px solid #ffce36; border-radius: 8px; padding: 1px 5px; font-size: 9px; font-weight: 800; white-space: nowrap; }
@keyframes breathe { 50% { transform: translateY(-2px) rotate(1deg); } }
@keyframes bounce { 50% { transform: translateY(-7px) rotate(-3deg); } }
@keyframes stride { to { transform: rotate(14deg); } }
@keyframes wave { to { transform: rotate(-35deg); } }
@media(prefers-reduced-motion:reduce) { .body,.arm,.leg { animation:none!important; } }
</style>
