<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  bankruptCr,
  buyCrTile,
  drawCrCard,
  endCrTurn,
  getCrSnapshot,
  payCrDue,
  joinCrRoom,
  leaveCrRoom,
  readyCrRoom,
  rollCrRoom,
  skipCrTile,
  startCrRoom,
  tickCrRoom,
  upgradeCrTile,
} from '../../../api'
import {
  clearCrToken,
  persistCrSession,
  readCrToken,
} from '../../../composables/useCapitalRivals'
import { useAuth } from '../../../composables/useAuth'
import { useLocale } from '../../../composables/useLocale'
import TourDice from '../tour/TourDice.vue'
import CrBoard from './CrBoard.vue'
import { CR_BG } from './crArt'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { t } = useLocale()

const snapshot = ref(null)
const error = ref('')
const busy = ref(false)
const rolling = ref(false)
const boardWalking = ref(false)
const nowTs = ref(Date.now())
let poll = null
let clock = null
let ticking = false

const code = computed(() => String(route.params.code || '').toUpperCase())
const token = computed(() => readCrToken(code.value))
const room = computed(() => snapshot.value?.room || null)
const players = computed(() => snapshot.value?.players || [])
const tiles = computed(() => snapshot.value?.tiles || [])
const properties = computed(() => snapshot.value?.properties || [])
const ledger = computed(() => snapshot.value?.ledger || [])
const you = computed(() => snapshot.value?.you || null)
const me = computed(() => players.value.find((p) => p.seat === you.value?.seat) || null)
const started = computed(() => ['IN_PROGRESS', 'FINISHED'].includes(room.value?.status))
const finished = computed(() => room.value?.status === 'FINISHED')
const canStart = computed(() => you.value?.is_host && room.value?.status === 'READY')
const pending = computed(() => snapshot.value?.state?.pending || null)
const dice = computed(() => snapshot.value?.state?.dice || [1, 1])
const currentName = computed(
  () => players.value.find((p) => p.seat === room.value?.current_seat)?.name || '',
)
const winner = computed(() =>
  players.value.find((p) => p.seat === room.value?.winner_seat) || null,
)
const secondsLeft = computed(() => {
  if (!started.value || finished.value || !room.value?.turn_deadline) return null
  return Math.max(0, Math.ceil((Date.parse(room.value.turn_deadline) - nowTs.value) / 1000))
})
const lastEvent = computed(() => ledger.value[0] || null)
const buyOpen = computed(
  () => Boolean(!boardWalking.value && you.value?.can_buy && pending.value?.action === 'buy'),
)
const payOpen = computed(
  () => Boolean(!boardWalking.value && you.value?.can_pay && pending.value?.action === 'pay'),
)
const cardOpen = computed(
  () => Boolean(!boardWalking.value && you.value?.can_draw && pending.value?.action === 'card'),
)
const lastCard = computed(() => snapshot.value?.state?.last_card || null)
const upgrades = computed(() => you.value?.upgrades || [])

function fail(e) {
  error.value = e?.api?.message || e?.message || t('games.cr.error')
}

function apply(data) {
  persistCrSession(data)
  snapshot.value = data
}

async function load() {
  try {
    let data
    try {
      data = persistCrSession(
        await joinCrRoom(code.value, {
          playerToken: token.value || undefined,
          name: user.value?.name || t('games.cr.guest'),
        }),
      )
    } catch {
      data = await getCrSnapshot(code.value, token.value || undefined)
    }
    snapshot.value = data
    error.value = ''
  } catch (e) {
    fail(e)
  }
}

async function act(fn) {
  if (!token.value) return
  busy.value = true
  try {
    apply(await fn())
    error.value = ''
  } catch (e) {
    fail(e)
  } finally {
    busy.value = false
    rolling.value = false
  }
}

async function toggleReady() {
  if (started.value) return
  await act(() => readyCrRoom(code.value, token.value, !me.value?.ready))
}
async function startMatch() {
  await act(() => startCrRoom(code.value, token.value))
}
async function roll() {
  rolling.value = true
  await act(() => rollCrRoom(code.value, token.value))
}
async function buy() {
  await act(() => buyCrTile(code.value, token.value))
}
async function skip() {
  await act(() => skipCrTile(code.value, token.value))
}
async function pay() {
  const key = pending.value
    ? `cr-${code.value}-${room.value?.version}-${pending.value.kind}-${pending.value.tile}`
    : undefined
  await act(() => payCrDue(code.value, token.value, key))
}
async function drawCard() {
  await act(() => drawCrCard(code.value, token.value))
}
async function upgrade(tileIndex) {
  await act(() => upgradeCrTile(code.value, token.value, tileIndex))
}
async function endTurn() {
  await act(() => endCrTurn(code.value, token.value))
}
async function bankrupt() {
  if (!window.confirm(t('games.cr.bankruptConfirm'))) return
  await act(() => bankruptCr(code.value, token.value))
}

async function leave() {
  busy.value = true
  try {
    if (token.value && room.value?.status !== 'IN_PROGRESS') {
      await leaveCrRoom(code.value, token.value)
    }
    clearCrToken(code.value)
    await router.push({ name: 'cr-lobby' })
  } catch (e) {
    fail(e)
  } finally {
    busy.value = false
  }
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(code.value)
  } catch {
    /* ignore */
  }
}

function eventLabel(row) {
  if (!row) return ''
  return t(`games.cr.events.${row.type}`, { amount: row.amount })
}

onMounted(async () => {
  await load()
  clock = setInterval(() => {
    nowTs.value = Date.now()
  }, 250)
  poll = setInterval(async () => {
    if (!code.value || busy.value || boardWalking.value) return
    try {
      const due = secondsLeft.value === 0 && room.value?.status === 'IN_PROGRESS'
      if (due && !ticking) {
        ticking = true
        try {
          apply(await tickCrRoom(code.value, readCrToken(code.value)))
        } finally {
          ticking = false
        }
        return
      }
      snapshot.value = await getCrSnapshot(code.value, readCrToken(code.value))
    } catch {
      /* keep last snapshot */
    }
  }, 1000)
})

onUnmounted(() => {
  if (poll) clearInterval(poll)
  if (clock) clearInterval(clock)
})

watch(code, () => {
  load()
})
</script>

<template>
  <section class="cr-room" :style="{ '--felt': `url(${CR_BG})` }">
    <header>
      <div>
        <p class="eyebrow">{{ t('games.cr.title') }}</p>
        <h1>
          {{ t('games.cr.room') }}
          <button type="button" class="code" @click="copyCode">{{ code }}</button>
        </h1>
        <p v-if="room" class="status">
          <span v-if="finished">{{ t('games.cr.winner', { name: winner?.name || '—' }) }}</span>
          <span v-else-if="started">{{ t('games.cr.turnOf', { name: currentName }) }}</span>
          <span v-else>{{ room.status }}</span>
          <span v-if="room.max_turns"> · {{ t('games.cr.turns', { n: room.turns_played, max: room.max_turns }) }}</span>
        </p>
      </div>
      <ul v-if="started" class="hud">
        <li
          v-for="p in players"
          :key="p.id"
          :class="{ you: p.seat === you?.seat, turn: p.seat === room?.current_seat, out: p.bankrupt }"
        >
          <strong>{{ p.name }}</strong>
          <span>{{ p.bankrupt ? t('games.cr.broke') : `$${p.cash}` }} · {{ t('games.cr.tile') }} {{ p.position }}</span>
        </li>
      </ul>
    </header>

    <p v-if="error" class="err">{{ error }}</p>
    <p v-if="lastEvent && started && !finished" class="event">{{ eventLabel(lastEvent) }}</p>

    <CrBoard
      v-if="started"
      :tiles="tiles"
      :players="players"
      :properties="properties"
      :current-seat="room?.current_seat"
      :you-seat="you?.seat"
      @walking="boardWalking = $event"
    >
      <div v-if="!finished" class="timer" :class="{ low: secondsLeft !== null && secondsLeft <= 8 }">
        {{ secondsLeft === null ? '—' : secondsLeft }}s
      </div>
      <TourDice :values="dice" :rolling="rolling" :size="48" />
      <div v-if="!finished" class="bar">
        <button v-if="you?.can_roll" type="button" class="btn-primary" :disabled="busy" @click="roll">
          {{ t('games.cr.roll') }}
        </button>
        <template v-if="you?.can_upgrade">
          <button
            v-for="opt in upgrades"
            :key="opt.tile"
            type="button"
            class="btn-secondary"
            :disabled="busy"
            @click="upgrade(opt.tile)"
          >
            {{ t('games.cr.upgradeBtn', { name: opt.name, cost: opt.cost }) }}
          </button>
        </template>
        <button v-if="you?.can_end_turn && !you?.can_buy" type="button" class="btn-secondary" :disabled="busy" @click="endTurn">
          {{ t('games.cr.endTurn') }}
        </button>
        <button v-if="you?.can_bankrupt && !finished" type="button" class="btn-ghost" :disabled="busy" @click="bankrupt">
          {{ t('games.cr.bankrupt') }}
        </button>
      </div>
    </CrBoard>

    <ul v-else class="seats">
      <li v-for="p in players" :key="p.id" :class="{ you: p.seat === you?.seat }">
        <strong>{{ p.name }}</strong>
        <span>{{ p.ready ? t('games.cr.ready') : t('games.cr.notReady') }}</span>
        <span v-if="p.is_host">{{ t('games.cr.host') }}</span>
      </li>
    </ul>

    <div class="bar outer">
      <button
        v-if="you && !started"
        type="button"
        class="btn-secondary"
        :disabled="busy"
        @click="toggleReady"
      >
        {{ me?.ready ? t('games.cr.unready') : t('games.cr.readyUp') }}
      </button>
      <button v-if="canStart" type="button" class="btn-primary" :disabled="busy" @click="startMatch">
        {{ t('games.cr.start') }}
      </button>
      <button type="button" class="btn-ghost" :disabled="busy" @click="leave">
        {{ t('games.cr.leave') }}
      </button>
    </div>

    <div v-if="payOpen" class="overlay" role="dialog" aria-modal="true">
      <div class="dialog">
        <h2>{{ t('games.cr.payTitle') }}</h2>
        <p>{{ t('games.cr.payPrompt', { name: pending.name, amount: pending.amount }) }}</p>
        <p class="cash">{{ t('games.cr.yourCash', { cash: me?.cash ?? 0 }) }}</p>
        <div class="bar">
          <button type="button" class="btn-primary" :disabled="busy" @click="pay">
            {{ t('games.cr.pay') }} ${{ pending.amount }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="cardOpen" class="overlay" role="dialog" aria-modal="true">
      <div class="dialog">
        <h2>{{ t('games.cr.cardTitle') }}</h2>
        <p>{{ t('games.cr.cardPrompt') }}</p>
        <div class="bar">
          <button type="button" class="btn-primary" :disabled="busy" @click="drawCard">
            {{ t('games.cr.draw') }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="lastCard && started && !finished && !cardOpen" class="event">
      {{ lastCard.title }} — {{ lastCard.text }}
    </p>

    <div v-if="buyOpen" class="overlay" role="dialog" aria-modal="true">
      <div class="dialog">
        <h2>{{ t('games.cr.buyTitle') }}</h2>
        <p>{{ t('games.cr.buyPrompt', { name: pending.name, price: pending.price }) }}</p>
        <p class="cash">{{ t('games.cr.yourCash', { cash: me?.cash ?? 0 }) }}</p>
        <div class="bar">
          <button type="button" class="btn-primary" :disabled="busy || (me?.cash ?? 0) < pending.price" @click="buy">
            {{ t('games.cr.buy') }} ${{ pending.price }}
          </button>
          <button type="button" class="btn-secondary" :disabled="busy" @click="skip">
            {{ t('games.cr.skip') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="finished && winner" class="overlay">
      <div class="dialog win">
        <p class="eyebrow">{{ t('games.cr.title') }}</p>
        <h2>{{ t('games.cr.winner', { name: winner.name }) }}</h2>
        <p>{{ t(`games.cr.winReason.${room.win_reason || 'last_standing'}`) }}</p>
        <button type="button" class="btn-primary" @click="leave">{{ t('games.cr.leave') }}</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cr-room {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.25rem 1rem 5rem;
  border-radius: 1.25rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--bg) 82%, transparent), color-mix(in srgb, var(--bg) 90%, transparent)),
    var(--felt) center / cover no-repeat;
}
.eyebrow {
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: var(--text-3);
}
h1 {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 1.5rem;
}
.code {
  font-family: ui-monospace, monospace;
  letter-spacing: 0.08em;
  border: 1px dashed var(--line);
  border-radius: var(--r-md);
  padding: 0.2rem 0.55rem;
}
.status { color: var(--text-3); }
header {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 1rem;
}
.hud {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.hud li {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 0.45rem 0.7rem;
  display: grid;
  font-size: 0.85rem;
}
.hud li.you { outline: 2px solid var(--text); }
.hud li.turn { background: color-mix(in srgb, var(--text) 8%, transparent); }
.hud li.out { opacity: 0.45; text-decoration: line-through; }
.seats {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 0.65rem;
}
.seats li {
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  padding: 0.85rem 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.85rem;
  align-items: baseline;
}
.bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  justify-content: center;
}
.bar.outer { margin-top: 1rem; }
.btn-primary,
.btn-secondary,
.btn-ghost {
  border-radius: var(--r-md);
  padding: 0.7rem 1rem;
  font-weight: 600;
}
.btn-primary { background: var(--text); color: var(--bg); }
.btn-secondary { border: 1px solid var(--line); }
.btn-ghost { color: var(--text-2); }
.err { color: #c2410c; }
.event { color: var(--text-2); font-size: 0.9rem; margin-bottom: 0.75rem; }
.timer {
  font-variant-numeric: tabular-nums;
  font-size: 1.6rem;
  font-weight: 800;
}
.timer.low { color: #fb7185; }
.overlay {
  position: fixed;
  inset: 0;
  background: rgb(15 23 42 / 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 80;
}
.dialog {
  background: var(--bg-1, #fff);
  color: var(--text);
  border-radius: 1rem;
  padding: 1.25rem 1.4rem;
  max-width: 22rem;
  width: 100%;
  display: grid;
  gap: 0.75rem;
}
.dialog.win { text-align: center; }
.cash { color: var(--text-2); }
</style>
