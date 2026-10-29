<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  bankruptCr,
  performCrAction,
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
import CrDice from './CrDice.vue'
import CrChanceReveal from './CrChanceReveal.vue'
import CrAssetPawn from './CrAssetPawn.vue'
import CrHouseSprite from './CrHouseSprite.vue'
import CrBoard from './CrBoard.vue'
import { vietnamTileName } from './vietnamTiles'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { t, locale } = useLocale()
const money = (value) => new Intl.NumberFormat(locale.value === 'vi' ? 'vi-VN' : 'en-US').format(Number(value) || 0)

const snapshot = ref(null)
const error = ref('')
const busy = ref(false)
const rolling = ref(false)
const rolledDice = ref(null)
const cardStage = ref('idle')
const revealedCard = ref(null)
const cardError = ref('')
let loaded = false
let disposed = false
let seenCardId = null
const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const animationDelay = (ms) => new Promise((resolve) => setTimeout(resolve, reducedMotion ? 0 : ms))
const boardWalking = ref(false)
const purchaseLevel = ref(1)
const destination = ref(-1)
const landscapeQuery = typeof window !== 'undefined' ? window.matchMedia('(orientation: landscape) and (max-height: 600px) and (max-width: 1100px)') : null
const compactLandscape = ref(landscapeQuery?.matches ?? false)
const updateOrientation = (event) => { compactLandscape.value = event.matches }
const nowTs = ref(Date.now())
let poll = null
let clock = null
let ticking = false

const code = computed(() => String(route.params.code || '').toUpperCase())
const token = computed(() => readCrToken(code.value))
const room = computed(() => snapshot.value?.room || null)
const modernRules = computed(() => Number(room.value?.rules_version || 1) >= 2)
const players = computed(() => snapshot.value?.players || [])
const tiles = computed(() => (snapshot.value?.tiles || []).map((tile) => ({ ...tile, name: tile.legacy_index !== undefined ? vietnamTileName(tile.legacy_index, tile.name) : snapshot.value.tiles.length === 32 ? tile.name : vietnamTileName(tile.index, tile.name) })))
const properties = computed(() => snapshot.value?.properties || [])
const ledger = computed(() => snapshot.value?.ledger || [])
const you = computed(() => snapshot.value?.you || null)
const me = computed(() => players.value.find((p) => p.seat === you.value?.seat) || null)
const started = computed(() => ['IN_PROGRESS', 'FINISHED'].includes(room.value?.status))
const immersive = computed(() => started.value && compactLandscape.value)
let previousBodyOverflow = null
function restoreBodyScroll() {
  if (previousBodyOverflow !== null) {
    document.body.style.overflow = previousBodyOverflow
    previousBodyOverflow = null
  }
}
watch(immersive, (active) => {
  if (active) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else restoreBodyScroll()
})
const finished = computed(() => room.value?.status === 'FINISHED')
const canStart = computed(() => you.value?.is_host && room.value?.status === 'READY')
const pending = computed(() => {
  const value = snapshot.value?.state?.pending
  return value ? { ...value, name: tiles.value.find((tile) => Number(tile.index) === Number(value.tile))?.name || vietnamTileName(value.tile, value.name) } : null
})
const dice = computed(() => rolledDice.value || snapshot.value?.state?.dice || [1, 1])
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
  () => Boolean(cardStage.value === 'idle' && !boardWalking.value && you.value?.can_buy && pending.value?.action === 'buy'),
)
const payOpen = computed(
  () => Boolean(cardStage.value === 'idle' && !boardWalking.value && you.value?.can_pay && pending.value?.action === 'pay'),
)
const cardOpen = computed(
  () => Boolean(!boardWalking.value && you.value?.can_draw && pending.value?.action === 'card'),
)
const lastCard = computed(() => snapshot.value?.state?.last_card || null)
const upgrades = computed(() => (you.value?.upgrades || []).map((option) => ({ ...option, name: tiles.value.find((tile) => Number(tile.index) === Number(option.tile))?.name || vietnamTileName(option.tile, option.name) })))
const buyingHouse = computed(() => tiles.value.find((tile) => Number(tile.index) === Number(pending.value?.tile))?.type === 'property')
const purchaseOptions = computed(() => you.value?.purchase_options || [])
const purchasePrice = computed(() => purchaseOptions.value.find((option) => option.level === purchaseLevel.value)?.price ?? pending.value?.price ?? 0)
const destinationOptions = computed(() => tiles.value.filter((tile) => Number(tile.index) !== Number(me.value?.position) && (pending.value?.action !== 'festival' || tile.type === 'property')))
const destinationOpen = computed(() => you.value?.can_choose_destination && !boardWalking.value && cardStage.value === 'idle')
const takeoverOpen = computed(() => you.value?.can_takeover && !boardWalking.value && cardStage.value === 'idle')
const selectedDestination = computed(() => destinationOptions.value.find((tile) => Number(tile.index) === destination.value))
watch(() => `${pending.value?.action}:${pending.value?.tile}`, () => { destination.value = -1 })
watch(() => pending.value?.tile, () => { purchaseLevel.value = 1 })
const cardDestination = computed(() => {
  if (!['move', 'go_start'].includes(revealedCard.value?.kind)) return ''
  return tiles.value.find((tile) => Number(tile.index) === revealedCard.value.position_after)?.name || ''
})
watch([cardOpen, busy, boardWalking, cardStage], async () => {
  await nextTick()
  if (!disposed && cardOpen.value && !boardWalking.value && cardStage.value === 'idle' && !busy.value) drawCard()
})
watch(() => lastCard.value?.draw_id, async (id) => {
  if (!loaded || !id || id === seenCardId || busy.value || !['idle', 'error'].includes(cardStage.value)) return
  const matchCode = code.value
  seenCardId = id
  revealedCard.value = lastCard.value
  cardStage.value = 'drawing'
  await animationDelay(500)
  if (disposed || matchCode !== code.value) return
  cardStage.value = 'revealed'
  await animationDelay(750)
  if (!disposed && matchCode === code.value) cardStage.value = 'applied'
})

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
    seenCardId = data.state?.last_card?.draw_id || null
    loaded = true
    error.value = ''
  } catch (e) {
    fail(e)
  }
}

async function act(fn) {
  if (!token.value || busy.value || cardStage.value !== 'idle') return
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
async function roll(isReroll = false) {
  isReroll = isReroll === true
  if (!token.value || busy.value || boardWalking.value || !(isReroll ? you.value?.can_reroll : you.value?.can_roll) || cardStage.value !== 'idle') return
  busy.value = true
  rolling.value = true
  const matchCode = code.value
  try {
    const [data] = await Promise.all([isReroll ? performCrAction(matchCode, token.value, 'reroll') : rollCrRoom(matchCode, token.value), animationDelay(950)])
    if (disposed || matchCode !== code.value) return
    rolledDice.value = data.state?.dice || [1, 1]
    rolling.value = false
    await animationDelay(450)
    if (disposed || matchCode !== code.value) return
    apply(data)
    error.value = ''
  } catch (e) {
    fail(e)
  } finally {
    rolling.value = false
    rolledDice.value = null
    busy.value = false
  }
}
async function buy() {
  await act(() => buyCrTile(code.value, token.value, buyingHouse.value ? purchaseLevel.value : 1))
}
async function gameAction(action, tileIndex) {
  if (boardWalking.value) return
  await act(() => performCrAction(code.value, token.value, action, tileIndex))
}
function selectDestination(index) {
  if (!destinationOpen.value || busy.value || !destinationOptions.value.some((tile) => Number(tile.index) === index)) return
  destination.value = index
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
  if (!token.value || busy.value || !you.value?.can_draw) return
  busy.value = true
  cardStage.value = 'drawing'
  cardError.value = ''
  revealedCard.value = null
  const matchCode = code.value
  try {
    const [data] = await Promise.all([drawCrCard(matchCode, token.value), animationDelay(900)])
    if (disposed || matchCode !== code.value) return
    revealedCard.value = data.state?.last_card || null
    seenCardId = revealedCard.value?.draw_id || null
    cardStage.value = 'revealed'
    await animationDelay(800)
    if (disposed || matchCode !== code.value) return
    apply(data)
    cardStage.value = 'applied'
    error.value = ''
  } catch (e) {
    cardError.value = e?.api?.message || e?.message || t('games.cr.error')
    cardStage.value = 'error'
  } finally {
    busy.value = false
  }
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
  landscapeQuery?.addEventListener('change', updateOrientation)
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
  landscapeQuery?.removeEventListener('change', updateOrientation)
  restoreBodyScroll()
  disposed = true
  if (poll) clearInterval(poll)
  if (clock) clearInterval(clock)
})

watch(code, () => {
  loaded = false
  seenCardId = null
  revealedCard.value = null
  cardStage.value = 'idle'
  load()
})
</script>

<template>
  <Teleport to="body" :disabled="!immersive">
  <section class="cr-room" :class="{ immersive }">
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
        <p v-if="room && modernRules" class="status">{{ t('games.cr.potLabel', { amount: money(room.pot), fee: money(room.entry_fee) }) }}</p>
      </div>
    </header>

    <p v-if="error" class="err">{{ error }}</p>
    <p v-if="room && !modernRules" class="legacy-board-note">{{ t('games.cr.legacyRules') }}</p>
    <p v-if="started && tiles.length !== 32" class="legacy-board-note">
      Phòng này đang dùng bàn cờ cũ.
      <RouterLink :to="{ name: 'cr-lobby' }">Tạo phòng mới để chơi bàn 9×9 với 4 bãi biển, 3 ô ngẫu nhiên và 1 ô thuế.</RouterLink>
    </p>
    <p v-if="lastEvent && started && !finished" class="event">{{ eventLabel(lastEvent) }}</p>

    <CrBoard
      v-if="started"
      :tiles="tiles"
      :players="players"
      :properties="properties"
      :festivals="snapshot?.state?.festivals || {}"
      :selecting="destinationOpen"
      :selectable-tiles="destinationOptions.map((tile) => tile.index)"
      :selected-tile="destination"
      :selection-busy="busy"
      :current-seat="room?.current_seat"
      :you-seat="you?.seat"
      @walking="boardWalking = $event"
      @select-tile="selectDestination"
    >
      <template #hud>
        <ul class="hud">
          <li
            v-for="p in players"
            :key="p.id"
            :class="{ you: p.seat === you?.seat, turn: p.seat === room?.current_seat, out: p.bankrupt }"
          >
            <CrAssetPawn :skin="p.skin" :size="26" :label="''" />
            <span class="hud-copy">
              <strong>{{ p.name }}</strong>
              <span>{{ p.bankrupt ? t('games.cr.broke') : `$${money(p.cash)}` }} · {{ t('games.cr.tile') }} {{ p.position }}</span>
              <span v-if="modernRules">{{ t('games.cr.playerStats', { laps: p.laps, gold: p.gold }) }}</span>
            </span>
          </li>
        </ul>
      </template>
      <div v-if="destinationOpen" class="board-selection" aria-live="polite">
        <strong>{{ t(pending.action === 'festival' ? 'games.cr.chooseFestival' : 'games.cr.chooseTravel') }}</strong>
        <p>{{ t('games.cr.selectOnBoard') }}</p>
        <small>{{ t(pending.action === 'festival' ? 'games.cr.festivalHelp' : 'games.cr.travelHelp', { fee: money(room.travel_fee) }) }}</small>
        <b v-if="selectedDestination" class="chosen-destination">{{ selectedDestination.name }}</b>
        <div class="bar">
          <button class="btn-primary" type="button" :disabled="busy || !selectedDestination || (pending.action === 'travel' && (me?.cash ?? 0) < room.travel_fee)" @click="gameAction(pending.action, destination)">{{ t('games.cr.confirmChoice') }}</button>
          <button class="btn-secondary" type="button" :disabled="busy" @click="skip">{{ t('games.cr.skip') }}</button>
        </div>
      </div>
      <div v-if="!finished && !destinationOpen" class="gui-stats">
        <div class="timer" :class="{ low: secondsLeft !== null && secondsLeft <= 8 }">
          <span aria-hidden="true">◷</span> {{ secondsLeft === null ? '—' : secondsLeft }}s
        </div>
        <div class="gold">${{ money(me?.cash) }}<small v-if="modernRules"> · ◆ {{ me?.gold ?? 0 }}</small></div>
      </div>
      <CrDice v-if="!destinationOpen" :values="dice" :rolling="rolling" :size="compactLandscape ? 26 : 48" />
      <div v-if="!finished && !destinationOpen" class="bar">
        <button v-if="you?.can_roll" type="button" class="btn-primary" :disabled="busy" @click="roll">
          {{ t('games.cr.roll') }}
        </button>
        <button v-if="you?.can_confirm_roll" type="button" class="btn-primary" :disabled="busy" @click="gameAction('confirm_roll')">{{ t('games.cr.confirmRoll') }}</button>
        <button v-if="you?.can_confirm_roll" type="button" class="btn-secondary" :disabled="busy || !you?.can_reroll" @click="roll(true)">{{ t('games.cr.reroll', { gold: room.reroll_cost }) }}</button>
        <template v-if="you?.can_wait_island">
          <p class="island-status">{{ t('games.cr.islandRemaining', { turns: me?.island_turns }) }}</p>
          <button type="button" class="btn-primary" :disabled="busy || !you?.can_escape_island" @click="gameAction('escape_island')">{{ t('games.cr.escapeIsland', { fee: money(room.island_fee) }) }}</button>
          <button type="button" class="btn-secondary" :disabled="busy" @click="gameAction('wait_island')">{{ t('games.cr.waitIsland') }}</button>
        </template>
        <template v-if="you?.can_upgrade">
          <button
            v-for="opt in upgrades"
            :key="opt.tile"
            type="button"
            class="btn-secondary"
            :disabled="busy"
            @click="upgrade(opt.tile)"
          >
            {{ modernRules ? t('games.cr.upgradeRule', { name: opt.name, level: opt.level + 1, cost: money(opt.cost) }) : t('games.cr.upgradeBtn', { name: opt.name, cost: opt.cost }) }}
          </button>
        </template>
        <button v-if="you?.can_skip && !you?.can_buy && !destinationOpen && !takeoverOpen" type="button" class="btn-secondary" :disabled="busy" @click="skip">{{ t('games.cr.skip') }}</button>
        <button v-if="you?.can_accept_winnings" type="button" class="btn-primary" :disabled="busy" @click="gameAction('accept_winnings')">{{ t('games.cr.acceptWinnings') }}</button>
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

    <CrChanceReveal v-if="cardStage !== 'idle'" :card="revealedCard" :stage="cardStage" :error="cardError" :destination="cardDestination" :can-retry="!!you?.can_draw" @retry="drawCard" @close="cardStage = 'idle'" />
    <div v-if="takeoverOpen" class="overlay" role="dialog" aria-modal="true">
      <div class="dialog">
        <h2>{{ t('games.cr.takeoverTitle') }}</h2>
        <p>{{ t('games.cr.takeoverHelp', { name: pending.name, price: money(pending.price) }) }}</p>
        <div class="bar">
          <button type="button" class="btn-primary" :disabled="busy || (me?.cash ?? 0) < pending.price" @click="gameAction('takeover')">{{ t('games.cr.takeoverTitle') }}</button>
          <button type="button" class="btn-secondary" :disabled="busy" @click="gameAction('decline_takeover')">{{ t('games.cr.skip') }}</button>
        </div>
      </div>
    </div>

    <p v-if="lastCard && started && !finished && !cardOpen && cardStage === 'idle'" class="event">
      {{ lastCard.title }} — {{ lastCard.text }}
    </p>

    <div v-if="buyOpen" class="overlay" role="dialog" aria-modal="true">
      <div class="dialog purchase-dialog">
        <h2>{{ buyingHouse ? t('games.cr.chooseHouse') : t('games.cr.buyTitle') }}</h2>
        <p>{{ pending.name }}</p>
        <p v-if="buyingHouse" class="purchase-hint">{{ t(modernRules && you?.max_initial_level === 2 ? 'games.cr.firstLapLimit' : 'games.cr.initialHouseLimit') }}</p>
        <div v-if="buyingHouse" class="house-options" role="radiogroup" :aria-label="t('games.cr.chooseHouse')">
          <button v-for="option in purchaseOptions" :key="option.level" type="button" class="house-option" role="radio" :aria-checked="purchaseLevel === option.level" :class="{ selected: purchaseLevel === option.level }" :disabled="busy || option.price > (me?.cash ?? 0)" @click="purchaseLevel = option.level">
            <CrHouseSprite :level="option.level" :skin="me?.skin || 'ace'" />
            <strong>{{ t('games.cr.houseLevel', { level: option.level }) }}</strong>
            <span>${{ option.price }}</span>
            <small v-if="option.price > (me?.cash ?? 0)">{{ t('games.cr.cannotAffordHouse') }}</small>
          </button>
        </div>
        <p class="cash">{{ t('games.cr.yourCash', { cash: me?.cash ?? 0 }) }}</p>
        <div class="bar">
          <button type="button" class="btn-primary" :disabled="busy || (me?.cash ?? 0) < purchasePrice || (buyingHouse && !purchaseOptions.length)" @click="buy">
            {{ t('games.cr.buy') }} ${{ purchasePrice }}
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
        <p v-if="modernRules">{{ t('games.cr.winningsAwarded', { amount: money(winner.winnings) }) }}</p>
        <button type="button" class="btn-primary" @click="leave">{{ t('games.cr.leave') }}</button>
      </div>
    </div>
  </section>
  </Teleport>
</template>

<style scoped>
.cr-room {
  max-width: 1440px;
  margin: 0 auto;
  padding: 1.35rem clamp(0.65rem, 2vw, 1.5rem) 5rem;
  min-height: 100dvh;
  border-radius: 1.5rem;
  background: linear-gradient(180deg, #8bbfdf, #c9e7e6);
  color: #15305b;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.9);
}
.eyebrow {
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: #168be0;
}
h1 {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 1.5rem;
  letter-spacing: -0.035em;
}
.code {
  font-family: ui-monospace, monospace;
  letter-spacing: 0.08em;
  border: 2px solid #4eb1ed;
  border-radius: 8px;
  padding: 0.2rem 0.55rem;
  color: #1167b2;
  background: #eef9ff;
  transition: background 180ms ease, transform 180ms ease;
}
.code:hover { background: #d9f1ff; }
.code:active { transform: translateY(1px); }
.status { color: #56708f; }
header {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background: transparent;
}
.hud {
  list-style: none;
  padding: 0;
  margin: 0;
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hud li {
  position: absolute;
  width: min(21%, 240px);
  border: 2px solid #d5e6ee;
  border-radius: 12px;
  min-width: 0;
  padding: 0.45rem 0.75rem 0.45rem 0.45rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 0.85rem;
  background: linear-gradient(145deg, #fff, #eef8fd);
  color: #17345f;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
}
.hud li:nth-child(1) { top:0; left:0; }
.hud li:nth-child(2) { top:0; right:0; }
.hud li:nth-child(3) { bottom:2%; left:0; }
.hud li:nth-child(4) { bottom:2%; right:0; }
.hud li img { width: 34px; height: 34px; object-fit: cover; border-radius: 8px; }
.hud-copy { display: grid; line-height: 1.25; }
.hud-copy > span { color: #5d718c; font-size: 0.76rem; font-variant-numeric: tabular-nums; }
.hud li.you { border-color: #ef58a1; box-shadow: 0 5px 0 #ef58a1, 0 10px 18px rgb(58 100 130 / 0.18); }
.hud li.turn { background: linear-gradient(145deg, #fff8d7, #fff); border-color: #ffc927; transform: translateY(-4px); box-shadow: 0 5px 0 #e6aa00, 0 10px 18px rgb(58 100 130 / 0.18); }
.hud li.out { opacity: 0.45; text-decoration: line-through; }
.hud-copy strong { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
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
  border-radius: 10px;
  padding: 0.7rem 1rem;
  font-weight: 600;
  transition: transform 180ms ease, filter 180ms ease, background 180ms ease;
}
.btn-primary { border: 3px solid #79ceff; background: linear-gradient(180deg, #30b7ff, #087bd4); color: #fff; box-shadow: 0 6px 0 #075ba8, 0 10px 20px rgb(23 119 184 / 0.25); text-shadow: 0 2px 0 rgb(0 74 135 / 0.45); }
.btn-secondary { border: 2px solid #9acde8; color: #13588e; background: linear-gradient(180deg, #fff, #e7f6fd); box-shadow: 0 4px 0 #b2cedc; }
.btn-ghost { color: #60758f; }
.btn-primary:hover, .btn-secondary:hover { filter: brightness(1.08); transform: translateY(-1px); }
.btn-primary:active, .btn-secondary:active, .btn-ghost:active { transform: translateY(1px) scale(0.98); }
.btn-primary:focus-visible, .btn-secondary:focus-visible, .btn-ghost:focus-visible, .code:focus-visible { outline: 3px solid #ef58a1; outline-offset: 3px; }
.err { color: #c2410c; }
.legacy-board-note { padding:0.65rem 0.9rem; margin-bottom:0.75rem; border-radius:8px; background:#ffffffb3; color:#234d69; font-size:0.85rem; }
.legacy-board-note a { text-decoration:underline; text-underline-offset:3px; font-weight:650; }
.event { color: var(--text-2); font-size: 0.9rem; margin-bottom: 0.75rem; }
.timer {
  font-variant-numeric: tabular-nums;
  font-size: 1.8rem;
  font-weight: 800;
  line-height: 1;
  color: #143b73;
}
.timer.low { color: #fb7185; }
.gui-stats { display: flex; align-items: center; gap: 0.65rem; }
.timer, .gold {
  min-width: 6.5rem;
  padding: 0.48rem 0.8rem;
  border: 3px solid #fff;
  border-radius: 999px;
  background: linear-gradient(180deg, #e8f8ff, #bfeaff);
  box-shadow: 0 4px 0 #83bdd8, 0 8px 18px rgb(33 107 151 / 0.16);
  text-align: center;
}
.center-panel .bar { gap:0.35rem; }
.gold {
  color: #765000;
  background: linear-gradient(180deg, #fff8c5, #ffd54c);
  box-shadow: 0 4px 0 #d69d00, 0 8px 18px rgb(154 102 0 / 0.14);
  font-size: 1.05rem;
  font-weight: 850;
  font-variant-numeric: tabular-nums;
}
.gold span { color: #fff; text-shadow: 0 1px 2px #ad7600; }
@media (max-width: 760px) {
  .hud li { width:44%; min-width:0; }
  .hud li:nth-child(3), .hud li:nth-child(4) { bottom:0; }
  .hud li img { width: 28px; height: 28px; }
  .gui-stats { gap: 0.3rem; }
  .timer, .gold { min-width: auto; padding: 0.3rem 0.55rem; font-size: 0.82rem; }
}
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
.purchase-dialog { max-width:38rem; max-height:90dvh; overflow-y:auto; }
.board-selection { display:grid; justify-items:center; gap:.4rem; text-align:center; color:#173957; font-size:clamp(11px,1.4vw,16px); }
.board-selection p { margin:0; }
.board-selection small { font-size:.75em; line-height:1.35; }
.chosen-destination { color:#08568e; }
.island-status { width:100%; text-align:center; font-size:.8rem; }
.purchase-hint { font-size:.85rem; color:var(--text-2); }
.house-options { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.65rem; }
.house-option { min-width:0; display:grid; justify-items:center; gap:.3rem; padding:.6rem; border:2px solid #9acde8; border-radius:12px; background:#eff8fd; color:#163957; transition:border-color .18s,transform .18s; }
.house-option .house-sprite { width:min(100%,105px); }
.house-option.selected { border-color:#1c87db; background:#dcefff; box-shadow:0 0 0 2px #1c87db33; }
.house-option:focus-visible { outline:3px solid #ef58a1; outline-offset:3px; }
.house-option:disabled { opacity:.5; cursor:not-allowed; }
.house-option small { font-size:.65rem; }
.cr-room.immersive {
  position:fixed; inset:0; z-index:1000; width:100%; max-width:none; height:100dvh; min-height:0;
  box-sizing:border-box; margin:0; border-radius:0; overflow:hidden;
  padding:max(4px,env(safe-area-inset-top)) max(8px,env(safe-area-inset-right)) max(4px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));
  display:flex; flex-direction:column;
}
.immersive header { flex:none; margin:0; padding:0 4px; min-height:28px; }
.immersive header > div { display:flex; flex-wrap:wrap; align-items:center; gap:4px 12px; width:100%; }
.immersive .eyebrow { display:none; }
.immersive h1 { font-size:12px; gap:4px; margin:0; }
.immersive .code { padding:2px 5px; font-size:11px; }
.immersive .status { font-size:10px; margin:0; }
.immersive > .event { display:none; }
.immersive > .err,.immersive > .legacy-board-note { flex:none; font-size:10px; padding:2px 4px; margin:0; }
.immersive .bar.outer { flex:none; margin:0; }
.immersive .btn-primary,.immersive .btn-secondary,.immersive .btn-ghost { min-height:28px; padding:4px 8px; font-size:10px; border-radius:7px; }
.immersive .bar { gap:5px; }
.immersive .hud li { width:21%; padding:3px 5px; gap:4px; font-size:10px; border-radius:7px; box-sizing:border-box; }
.immersive .hud-copy { min-width:0; }
.immersive .hud :deep(.asset-pawn) { width:16px!important; }
.immersive .hud-copy > span { font-size:9px; }
.immersive .hud li:nth-child(3),.immersive .hud li:nth-child(4) { bottom:4px; }
.immersive .gui-stats { gap:4px; }
.immersive .gui-stats .gold { display:none; }
.immersive .timer,.immersive .gold { min-width:0; padding:3px 6px; font-size:11px; border-width:1px; }
.immersive .board-selection { gap:3px; font-size:11px; }
.immersive .board-selection small { font-size:9px; }
.immersive .island-status { font-size:10px; margin:0; }
.immersive .dialog { max-height:calc(100dvh - 16px); overflow-y:auto; padding:12px; gap:8px; }
</style>
