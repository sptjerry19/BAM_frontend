<script setup>
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import CrAssetPawn from './CrAssetPawn.vue'
import CrAssetProp from './CrAssetProp.vue'
import { vietnamTileName } from './vietnamTiles'
import { boardSide, boardCell, forwardPath } from './boardLayout'
import { useLocale } from '../../../composables/useLocale'

const STEP_MS = 200
const MAX_STEPS = 12

const props = defineProps({
  tiles: { type: Array, default: () => [] },
  players: { type: Array, default: () => [] },
  properties: { type: Array, default: () => [] },
  currentSeat: { type: [Number, String], default: null },
  youSeat: { type: [Number, String], default: null },
  festivals: { type: Object, default: () => ({}) },
  selecting: { type: Boolean, default: false },
  selectableTiles: { type: Array, default: () => [] },
  selectedTile: { type: Number, default: -1 },
  selectionBusy: { type: Boolean, default: false },
})

const emit = defineEmits(['walking', 'select-tile'])
const { locale } = useLocale()
const money = (value) => '$' + new Intl.NumberFormat(locale.value === 'vi' ? 'vi-VN' : 'en-US').format(Number(value) || 0)
const selectable = computed(() => new Set(props.selectableTiles.map(Number)))

const SKIN = { ace: '#2563eb', ruby: '#db2777', kiwi: '#65a30d', blaze: '#ea580c' }

const GROUPS = {
  A: '#92400e', B: '#0284c7', C: '#e11d48', D: '#d97706',
  E: '#be123c', F: '#ca8a04', G: '#15803d', H: '#1e3a8a',
  umber: '#92400e',
  sky: '#0284c7',
  rose: '#e11d48',
  amber: '#d97706',
  crimson: '#be123c',
  gold: '#ca8a04',
  pine: '#15803d',
  navy: '#1e3a8a',
}

const tileCount = computed(() => props.tiles.length || 32)
const edge = computed(() => boardSide(tileCount.value) - 1)

const reduceMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const displayPos = reactive({})
const walking = reactive({})
const popping = reactive({})
const seenProps = ref(new Set())
const timers = []

function clearTimers() {
  while (timers.length) clearTimeout(timers.pop())
}

onUnmounted(clearTimers)

watch(
  () => props.players.map((p) => `${p.id}:${p.position}:${p.bankrupt}`).join('|'),
  () => {
    for (const p of props.players) {
      const target = Number(p.position) || 0
      if (displayPos[p.id] === undefined || p.bankrupt || reduceMotion) {
        displayPos[p.id] = target
        walking[p.id] = false
        continue
      }
      if (displayPos[p.id] === target) continue
      const steps = forwardPath(displayPos[p.id], target, tileCount.value)
      if (!steps.length || steps.length > MAX_STEPS) {
        displayPos[p.id] = target
        walking[p.id] = false
        continue
      }
      walking[p.id] = true
      steps.forEach((idx, i) => {
        const t = setTimeout(() => {
          displayPos[p.id] = idx
          if (i === steps.length - 1) walking[p.id] = false
        }, STEP_MS * (i + 1))
        timers.push(t)
      })
    }
  },
  { immediate: true },
)

watch(
  () => Object.values(walking).some(Boolean),
  (v) => emit('walking', v),
  { immediate: true },
)

watch(
  () => props.properties.map((p) => `${p.tile_index}:${p.owner_seat}:${p.level}`).join('|'),
  () => {
    const next = new Set()
    for (const p of props.properties) {
      const key = `${p.tile_index}:${p.owner_seat}`
      next.add(key)
      if (!seenProps.value.has(key)) popping[p.tile_index] = true
    }
    seenProps.value = next
  },
  { immediate: true },
)

const playerBySeat = computed(() => {
  const map = {}
  for (const p of props.players) map[p.seat] = p
  return map
})

const ownerByTile = computed(() => {
  const map = {}
  for (const p of props.properties) map[p.tile_index] = p
  return map
})

const playersByTile = computed(() => {
  const map = {}
  for (const p of props.players) {
    if (p.bankrupt) continue
    const i = displayPos[p.id] ?? p.position
    if (!map[i]) map[i] = []
    map[i].push(p)
  }
  return map
})

const cells = computed(() =>
  (props.tiles || []).map((tile) => {
    const pos = boardCell(tile.index, tileCount.value)
    const owner = ownerByTile.value[tile.index]
    const ownerPlayer = owner ? playerBySeat.value[owner.owner_seat] : null
    const houseLevel = owner ? Math.max(1, Number(owner.level) || 0) : 0
    const landingFee = owner?.rent ?? (tile.type === 'property' ? tile.base_rent : tile.type === 'service' ? tile.rent?.[0] : null)
    return {
      ...tile,
      name: tileCount.value === 32 ? tile.name : vietnamTileName(tile.index, tile.name),
      ...pos,
      corner: tile.index % edge.value === 0,
      side: tile.index <= edge.value ? 'south' : tile.index <= edge.value * 2 ? 'west' : tile.index <= edge.value * 3 ? 'north' : 'east',
      color: GROUPS[tile.group] || null,
      owner,
      ownerColor: owner ? SKIN[ownerPlayer?.skin] || '#94a3b8' : null,
      ownerSkin: ownerPlayer?.skin || 'ace',
      houseLevel,
      landingFee,
      feeLabel: tile.type === 'tax' ? '10% tài sản' : landingFee !== null ? money(landingFee) : '',
      popHouse: Boolean(popping[tile.index]),
      pawns: playersByTile.value[tile.index] || [],
    }
  }),
)
</script>

<template>
  <div class="arena">
    <div class="board" :class="{ 'selection-mode': selecting }" role="group" aria-label="Bàn đấu World Tour Việt Nam" :style="{ '--cell-width': (83 / edge) + '%', '--cell-height': (69 / edge) + '%' }">
      <div class="board-base" aria-hidden="true" />
      <div class="field" aria-hidden="true"><div class="field-lines" /><span class="field-brand">VIỆT NAM<br /><b>WORLD TOUR</b></span></div>
      <div
        v-for="tile in cells"
        :key="tile.index"
        class="cell"
        :class="[tile.side, tile.special, { corner: tile.index % edge === 0, current: tile.pawns.some((p) => p.seat === currentSeat), owned: !!tile.owner, selectable: selecting && selectable.has(Number(tile.index)), selected: selecting && selectedTile === Number(tile.index) }]"
        :style="{ left: tile.x + '%', top: tile.y + '%', '--g': tile.color || '#a9d8e5', zIndex: tile.index % edge === 0 ? 300 + Math.round(tile.y) : Math.round(tile.y * 2) }"
        :title="tile.feeLabel ? `${tile.name} · Phí hiện tại ${tile.feeLabel}` : tile.name"
      >
        <div class="tile-plane" :class="tile.type">
          <span v-if="tile.owner" class="stripe" :style="{ background: tile.ownerColor }" />
        </div>
        <CrAssetProp v-if="tile.corner || tile.type === 'chance' || tile.owner" class="art" :tile="tile" />
        <span class="tile-copy">
          <span class="name">{{ tile.name }}</span>
          <span v-if="tile.feeLabel" class="price" :class="{ free: tile.landingFee === 0 }">{{ tile.feeLabel }}</span>
        </span>
        <button v-if="selecting && selectable.has(Number(tile.index))" type="button" class="tile-target" :disabled="selectionBusy" :aria-label="tile.feeLabel ? `${tile.name} · Phí hiện tại ${tile.feeLabel}` : tile.name" :aria-pressed="selectedTile === Number(tile.index)" @click="emit('select-tile', Number(tile.index))" />
        <span v-if="tile.owner" class="owner-level" :style="{ background: tile.ownerColor }">{{ tile.houseLevel }} ★</span>
        <span v-if="festivals[tile.index] > 1" class="festival-badge" :title="`Lễ hội: tiền thuê ×${festivals[tile.index]}`">⚑ ×{{ festivals[tile.index] }}</span>
        <div class="pawns">
          <CrAssetPawn
            v-for="p in tile.pawns"
            :key="p.id"
            :skin="p.skin"
            :size="40"
            :anim="walking[p.id] ? 'walk' : p.seat === currentSeat ? 'cheer' : 'idle'"
            :label="p.seat === youSeat ? 'Bạn' : ''"
          />
        </div>
      </div>
      <div class="center-panel"><slot /></div>
    </div>
    <div class="board-hud"><slot name="hud" /></div>
  </div>
</template>

<style scoped>
.arena { position:relative; width:100%; container-type:inline-size; }
.board { position:relative; width:100%; aspect-ratio:16/10; isolation:isolate; container-type:inline-size; }
.board-base { position:absolute; inset:4% 1% 13%; background:#927f6e; clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); filter:drop-shadow(0 14px 12px #39788f50); }
.board-base::before { content:''; position:absolute; inset:0 0 8px; background:#e3d7cd; clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); }
.field { position:absolute; inset:13% 12% 22%; background:repeating-linear-gradient(34deg,#b9d667 0 8%,#b1d061 8% 16%); clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); }
.field-lines { position:absolute; inset:15%; border:2px solid #e5edb24d; transform:rotate(-45deg); }
.field-lines::after { content:''; position:absolute; inset:50% 0 auto; border-top:2px solid #e5edb24d; }
.field-brand { position:absolute; left:50%; top:20%; transform:translateX(-50%); text-align:center; color:#496c2b60; font-size:clamp(9px,1.8cqw,22px); line-height:1.2; letter-spacing:.15em; }
.cell { position:absolute; width:var(--cell-width); height:var(--cell-height); transform:translate(-50%,-50%); overflow:visible; pointer-events:none; }
.tile-plane { position:absolute; inset:0; background:#ece6db; clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); box-shadow:inset 0 -3px #b3a399; }
.tile-plane::after { content:''; position:absolute; inset:2px; clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); background:#fff9ef; }
.corner .tile-plane { inset:-14%; background:#fff0a5; filter:drop-shadow(0 5px 0 #8b6c40) drop-shadow(0 0 5px #f8d17888); }
.corner .tile-plane::after { inset:4px; background:#c4e2e9; }
.island .tile-plane::after { background:#a8e1da; }
.start .tile-plane::after { background:#c6eaa0; }
.world_tour .tile-plane::after { background:#e5d5eb; }
.championship .tile-plane::after { background:#e5d5eb; }
.airport .tile-plane::after { background:#cbdde8; }
.beach .tile-plane::after { background:#c2e9e6; }
.stripe { position:absolute; inset:0; background:var(--g); z-index:1; clip-path:polygon(50% 0,100% 50%,89% 58%,50% 19%,11% 58%,0 50%); opacity:.7; }
.current .tile-plane { background:#f7c735; filter:drop-shadow(0 0 4px #ffe267); }
.current .tile-plane::after { inset:4px; background:#fff1b3; }
.owned .tile-plane { background:var(--g); }
.art { position:absolute; width:82%; height:145%; left:9%; bottom:24%; }
.corner .art { height:230%; width:125%; left:-12.5%; bottom:24%; filter:drop-shadow(0 10px 4px #284f4766); }
/* Project text onto the same diamond plane as the tiles (16:10 board). */
.tile-copy { position:absolute; left:50%; top:50%; width:70.71%; aspect-ratio:1; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; gap:2px; padding:0 4% 9%; box-sizing:border-box; transform:translate(-50%,-50%) matrix(.707107,.3674,-.707107,.3674,0,0); text-align:center; color:#253747; font-size:clamp(8px,1.05cqw,14px); font-weight:750; line-height:1.08; text-shadow:0 1px #fff; pointer-events:none; }
.west .tile-copy,.east .tile-copy { transform:translate(-50%,-50%) matrix(.707107,-.3674,.707107,.3674,0,0); }
.corner .tile-copy { width:88%; padding-bottom:5%; font-size:clamp(9px,1.15cqw,15px); color:#173957; font-weight:850; }
.name { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.price { font-size:clamp(10px,1.35cqw,18px); color:#172a3a; font-weight:900; font-variant-numeric:tabular-nums; white-space:nowrap; }
.price.free { color:#27835f; }
.tile-target { position:absolute; inset:0; z-index:5; border:0; padding:0; background:transparent; clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%); cursor:pointer; pointer-events:auto; }
.corner .tile-target { inset:-14%; }
.selectable .tile-plane { background:#0086cc; filter:drop-shadow(0 0 4px #15b6ee); }
.selectable .tile-plane::after { inset:4px; background:#e1f7ff; }
.selectable:has(.tile-target:hover) .tile-plane,.selectable:has(.tile-target:focus-visible) .tile-plane,.selected .tile-plane { background:#f19b00; filter:drop-shadow(0 0 6px #ffc433); }
.selectable:has(.tile-target:hover) .tile-plane::after,.selectable:has(.tile-target:focus-visible) .tile-plane::after,.selected .tile-plane::after { background:#ffeb9c; }
.selection-mode .cell:not(.selectable) { opacity:.55; }
.tile-target:disabled { cursor:wait; }
.owner-level { position:absolute; right:0; top:10%; color:white; font-size:8px; border:1px solid white; padding:0 3px; border-radius:3px; }
.festival-badge { position:absolute; left:0; top:-5%; color:#5f3c05; background:#ffe17b; border:1px solid #fff3be; border-radius:4px; padding:1px 3px; font-size:clamp(7px,.8cqw,11px); font-weight:850; }
.event-symbol { position:absolute; inset:-10% 15% 20%; display:grid; place-items:center; font-size:clamp(14px,3.5cqw,42px); color:#e44d90; text-shadow:2px 2px #fff; }
.event-symbol.tax { color:#d2a229; }
.pawns { position:absolute; bottom:35%; left:15%; right:0; display:flex; justify-content:center; pointer-events:none; }
.pawns > * + * { margin-left:-26px; }
.pawns :deep(.asset-pawn) { width:clamp(16px,3.8cqw,40px)!important; }
.center-panel { position:absolute; z-index:220; left:50%; top:44%; transform:translate(-50%,-50%); width:32%; display:flex; flex-direction:column; align-items:center; gap:9px; padding:8px; border-radius:12px; background:#ebf7e4d9; box-shadow:0 3px 14px #4d704b24; }
.board-hud { position:absolute; inset:0; pointer-events:none; }
.board-hud :slotted(.hud) { pointer-events:none; }
@media(max-width:760px) {
  .arena { padding:65px 0 80px; }
  .board-hud { inset:0 0 auto; height:100%; }
  .center-panel { gap:5px; }
  .tile-copy { font-size:1.3cqw; gap:1px; }
  .corner .tile-copy { font-size:1.4cqw; }
  .price { font-size:1.6cqw; }
  .owner-level,.festival-badge { font-size:1.2cqw; padding:0 2px; }
}
@media(orientation:landscape) and (max-height:600px) and (max-width:1100px) {
  .arena { flex:1; min-height:0; padding:0; container-type:size; }
  /* Include the tall corner artwork above the diamond when fitting its height. */
  .board { position:absolute; width:min(calc(100cqw - 200px),150cqh); left:calc(50% - 94px); top:58%; transform:translate(-50%,-50%); }
  .board-hud { inset:0; height:auto; }
  .tile-copy { font-size:1.15cqw; gap:1px; }
  .corner .tile-copy { font-size:1.3cqw; }
  .price { font-size:1.5cqw; }
  .owner-level,.festival-badge { font-size:1.1cqw; padding:0 2px; }
  .center-panel { left:calc(100% + 12px); top:50%; transform:translateY(-50%); width:176px; box-sizing:border-box; gap:3px; padding:4px; background:transparent; box-shadow:none; }
  .center-panel :deep(.dice) { gap:16px; padding:4px 8px 0; }
  .center-panel :deep(.die) { padding-bottom:0; }
  .center-panel :deep(.value) { margin-top:6px; font-size:10px; }
}
@media(prefers-reduced-motion:reduce) { * { animation:none!important; } }
</style>
