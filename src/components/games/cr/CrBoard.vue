<script setup>
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import TourHouse from '../tour/TourHouse.vue'
import TourPawn from '../tour/TourPawn.vue'
import { CR_BG, crTileArt } from './crArt'

const STEP_MS = 200
const MAX_STEPS = 12

const props = defineProps({
  tiles: { type: Array, default: () => [] },
  players: { type: Array, default: () => [] },
  properties: { type: Array, default: () => [] },
  currentSeat: { type: [Number, String], default: null },
  youSeat: { type: [Number, String], default: null },
})

const emit = defineEmits(['walking'])

const SKIN = { ace: '#2563eb', ruby: '#db2777', kiwi: '#65a30d', blaze: '#ea580c' }

const GROUPS = {
  umber: '#92400e',
  sky: '#0284c7',
  rose: '#e11d48',
  amber: '#d97706',
  crimson: '#be123c',
  gold: '#ca8a04',
  pine: '#15803d',
  navy: '#1e3a8a',
}

function cell(index) {
  if (index <= 10) return { row: 11, col: 11 - index }
  if (index <= 20) return { row: 21 - index, col: 1 }
  if (index <= 30) return { row: 1, col: index - 19 }
  return { row: index - 29, col: 11 }
}

function pathForward(from, to) {
  const steps = []
  let i = ((Number(from) % 40) + 40) % 40
  const dest = ((Number(to) % 40) + 40) % 40
  while (i !== dest) {
    i = (i + 1) % 40
    steps.push(i)
  }
  return steps
}

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
      const steps = pathForward(displayPos[p.id], target)
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
    const pos = cell(tile.index)
    const owner = ownerByTile.value[tile.index]
    const ownerPlayer = owner ? playerBySeat.value[owner.owner_seat] : null
    const houseLevel = owner ? Math.max(1, Number(owner.level) || 0) : 0
    return {
      ...tile,
      ...pos,
      art: crTileArt(tile),
      color: GROUPS[tile.group] || null,
      owner,
      ownerColor: owner ? SKIN[ownerPlayer?.skin] || '#94a3b8' : null,
      ownerSkin: ownerPlayer?.skin || 'ace',
      houseLevel,
      popHouse: Boolean(popping[tile.index]),
      pawns: playersByTile.value[tile.index] || [],
    }
  }),
)
</script>

<template>
  <div class="board" role="grid" aria-label="Capital Rivals" :style="{ '--felt': `url(${CR_BG})` }">
    <div
      v-for="tile in cells"
      :key="tile.index"
      class="cell"
      :class="[tile.type, { current: tile.pawns.some((p) => p.seat === currentSeat), owned: !!tile.owner }]"
      :style="{
        gridColumn: tile.col,
        gridRow: tile.row,
        '--g': tile.color || 'transparent',
      }"
    >
      <img class="art" :src="tile.art" :alt="tile.name" />
      <i v-if="tile.color" class="stripe" />
      <span class="name">{{ tile.name }}</span>
      <span v-if="tile.price" class="price">${{ tile.price }}</span>
      <span v-else-if="tile.amount" class="price">−${{ tile.amount }}</span>
      <TourHouse
        v-if="tile.owner"
        class="house"
        :skin="tile.ownerSkin"
        :color="tile.ownerColor"
        :level="tile.houseLevel"
        :pop="tile.popHouse"
        fill
        compact
      />
      <div class="pawns">
        <TourPawn
          v-for="p in tile.pawns"
          :key="p.id"
          :skin="p.skin"
          :size="32"
          :anim="walking[p.id] ? 'walk' : p.seat === currentSeat ? 'idle' : 'idle'"
          :label="p.seat === youSeat ? 'you' : ''"
        />
      </div>
    </div>
    <div class="center">
      <strong>Capital Rivals</strong>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.board {
  display: grid;
  grid-template-columns: repeat(11, minmax(0, 1fr));
  grid-template-rows: repeat(11, minmax(0, 1fr));
  aspect-ratio: 1;
  width: min(92vw, 720px);
  margin: 0 auto;
  background: #0f172a;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 18px 40px rgb(15 23 42 / 0.35);
}
.cell {
  position: relative;
  min-height: 0;
  padding: 3px;
  background: #1e293b;
  color: #f8fafc;
  font-size: 9px;
  line-height: 1.15;
  border: 1px solid #0f172a;
  display: flex;
  flex-direction: column;
  overflow: visible;
  text-shadow: 0 1px 2px #0f172a;
}
.art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 40%;
  opacity: 0.92;
  pointer-events: none;
}
.cell::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(15 23 42 / 0.15), rgb(15 23 42 / 0.55));
  pointer-events: none;
}
.cell.start,
.cell.chance,
.cell.tax,
.cell.service,
.cell.detention,
.cell.go_to_detention,
.cell.rest {
  background: #1e293b;
}
.cell.current { outline: 2px solid #fbbf24; outline-offset: -2px; z-index: 1; }
.cell.owned {
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--g) 70%, white);
  z-index: 4;
}
.cell.owned .art { opacity: 0.28; }
.cell.owned .name,
.cell.owned .price { font-size: 8px; max-width: 46%; }
.stripe {
  height: 6px;
  background: var(--g);
  margin: -3px -3px 3px;
  z-index: 1;
}
.name,
.price {
  position: relative;
  z-index: 1;
}
.name {
  font-weight: 650;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.price { opacity: 0.9; }
.house {
  position: absolute;
  inset: 6% 2% 0;
  z-index: 2;
  pointer-events: none;
}
.pawns {
  margin-top: auto;
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  position: relative;
  z-index: 3;
}
.center {
  grid-column: 2 / 11;
  grid-row: 2 / 11;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #f8fafc;
  background:
    linear-gradient(180deg, rgb(15 23 42 / 0.42), rgb(15 23 42 / 0.62)),
    var(--felt) center / cover no-repeat;
}
.center strong {
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 0.85rem;
  text-shadow: 0 2px 8px #0f172a;
}
@media (max-width: 720px) {
  .name { font-size: 0; }
  .price { display: none; }
}
</style>
