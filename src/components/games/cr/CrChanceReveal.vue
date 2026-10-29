<script setup>
import { computed } from 'vue'
import { useLocale } from '../../../composables/useLocale'
const props = defineProps({ card: { type: Object, default: null }, stage: { type: String, default: 'drawing' }, error: { type: String, default: '' }, destination: { type: String, default: '' }, canRetry: { type: Boolean, default: true } })
defineEmits(['close', 'retry'])
const { t } = useLocale()
const flipped = computed(() => props.card && ['revealed', 'applied'].includes(props.stage))
const symbol = computed(() => ({ credit: '★', debit: '−', move: '✈', go_start: '➜' }[props.card?.kind] || '✦'))
const change = computed(() => props.card?.cash_change ?? 0)
</script>
<template>
  <div class="chance-overlay" role="dialog" aria-modal="true" :aria-label="t('games.cr.cardTitle')">
    <section class="reveal" aria-live="polite">
      <p class="eyebrow">{{ t('games.cr.cardTitle') }}</p>
      <div class="card-scene" :class="{ drawing: stage === 'drawing' }">
        <i class="stack stack-one" /><i class="stack stack-two" />
        <div class="flipper" :class="{ flipped }">
          <div class="card-face card-back"><span>✦</span><strong>WORLD TOUR</strong><small>{{ t('games.cr.cardTitle') }}</small></div>
          <div class="card-face card-front">
            <span class="card-symbol">{{ symbol }}</span>
            <small>{{ card?.player_name }}</small>
            <h2>{{ card?.title }}</h2>
            <p>{{ card?.text }}</p>
            <strong v-if="change" class="amount" :class="{ debit: change < 0 }">{{ change > 0 ? '+' : '−' }}${{ Math.abs(change) }}</strong>
            <strong v-else-if="destination" class="destination">{{ destination }}</strong>
          </div>
        </div>
      </div>
      <p v-if="stage === 'drawing'" class="status">{{ t('games.cr.drawingCard') }}</p>
      <p v-else-if="stage === 'revealed'" class="status">{{ t('games.cr.applyingCard') }}</p>
      <template v-else-if="stage === 'applied'">
        <p class="status">{{ card?.bankrupt ? t('games.cr.cardBankrupt') : t('games.cr.cardApplied') }}</p>
        <button type="button" class="continue" autofocus @click="$emit('close')">{{ t('games.cr.continueGame') }}</button>
      </template>
      <template v-else-if="stage === 'error'">
        <p class="error" role="alert">{{ error }}</p>
        <button v-if="canRetry" type="button" class="continue" @click="$emit('retry')">{{ t('games.cr.retryCard') }}</button>
        <button v-else type="button" class="continue" @click="$emit('close')">{{ t('games.cr.continueGame') }}</button>
      </template>
    </section>
  </div>
</template>
<style scoped>
.chance-overlay { position:fixed; inset:0; z-index:90; display:grid; place-items:center; padding:1rem; background:#071a32c9; backdrop-filter:blur(6px); }
.reveal { display:flex; flex-direction:column; align-items:center; gap:16px; width:min(100%,360px); color:#fff; text-align:center; }
.eyebrow { font-size:13px; font-weight:800; letter-spacing:.13em; color:#fbe0a3; text-transform:uppercase; }
.card-scene { position:relative; width:min(72vw,280px); height:355px; perspective:1100px; }
.flipper { position:relative; width:100%; height:100%; transform-style:preserve-3d; }
.flipper.flipped { animation:flip .75s cubic-bezier(.2,.7,.2,1) both; }
.card-face,.stack { position:absolute; inset:0; border:5px solid #fae6b4; border-radius:20px; box-shadow:0 16px 45px #06172b66,inset 0 0 0 2px #ffffff38; }
.card-face { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:22px; backface-visibility:hidden; }
.card-back { background:repeating-linear-gradient(45deg,#1b6b9d 0 10px,#236f9c 10px 20px); color:#fff6dd; }
.card-back > span { font-size:100px; line-height:1; color:#ffde80; }
.card-back strong { font-size:22px; letter-spacing:.12em; }
.card-front { transform:rotateY(180deg); background:linear-gradient(145deg,#fffdf5,#e5f1f7); color:#173957; }
.card-front h2 { font-size:23px; line-height:1.15; font-weight:850; }
.card-front p { font-size:15px; line-height:1.5; }
.card-front small { color:#6c7b8e; }
.card-symbol { display:grid; place-items:center; width:58px; height:58px; border-radius:50%; background:#ffe49b; color:#94671d; font-size:34px; box-shadow:inset 0 -4px #e7bb55; }
.amount { font-size:28px; color:#23825a; font-variant-numeric:tabular-nums; }
.amount.debit { color:#b64c4c; }
.destination { font-size:18px; color:#286fb2; }
.stack { background:#3a84b2; transform:translate(9px,6px) rotate(5deg); z-index:-1; }
.stack-two { transform:translate(-8px,8px) rotate(-5deg); }
.drawing .flipper { animation:shuffle .4s ease-in-out infinite alternate; }
.status { min-height:22px; font-size:14px; color:#e4eef5; }
.continue { padding:11px 24px; border:2px solid #81cdff; border-radius:10px; background:#1585cf; color:white; font-weight:750; box-shadow:0 4px #075994; }
.continue:hover { background:#279be5; }
.continue:focus-visible { outline:3px solid #ffe49b; outline-offset:4px; }
.error { color:#ffd5c9; }
@keyframes flip { from { transform:rotateY(0deg) translateY(-15px); } to { transform:rotateY(180deg) translateY(0); } }
@keyframes shuffle { from { transform:translateX(-8px) rotate(-4deg); } to { transform:translateX(8px) translateY(-8px) rotate(4deg); } }
@media(prefers-reduced-motion:reduce) { .drawing .flipper { animation:none; } .flipper.flipped { animation:none; transform:rotateY(180deg); } }
@media(max-height:600px) { .reveal { gap:8px; } .card-scene { height:280px; width:240px; } .card-face { gap:8px; padding:14px; } }
</style>
