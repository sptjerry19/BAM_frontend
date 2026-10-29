<script setup>
import { computed } from 'vue'
import atlas from '../../../assets/games/tour/tiles-transparent.png'
import CrHouseSprite from './CrHouseSprite.vue'

const props = defineProps({ tile: { type: Object, required: true } })
// Source coordinates in the original 1280 × 720 atlas. The transparent copy
// preserves the same normalized layout, including all gaps between sprites.
const buildings = {
  umber: [0, 0, 160, 180], crimson: [160, 0, 160, 180],
  rose: [320, 0, 160, 180], pine: [480, 0, 160, 180],
  sky: [640, 0, 160, 180], gold: [800, 0, 160, 180],
  navy: [960, 0, 160, 180], amber: [1120, 0, 160, 180],
}
const special = computed(() => props.tile.special || ({ start: 'start', detention: 'island' }[props.tile.type]))
const frame = computed(() => {
  if (special.value === 'island' || special.value === 'beach') return [60, 315, 260, 235]
  if (['world_tour', 'championship'].includes(special.value)) return [350, 315, 245, 235]
  if (special.value === 'airport') return [895, 295, 225, 260]
  if (special.value === 'start') return [685, 535, 300, 180]
  if (props.tile.type === 'chance') return [100, 180, 220, 140]
  if (props.tile.type === 'tax') return [625, 180, 215, 140]
  if (props.tile.owner && props.tile.houseLevel >= 4) return [895, 295, 225, 260]
  if (props.tile.owner && props.tile.houseLevel >= 3) return buildings.gold
  if (props.tile.owner && props.tile.houseLevel >= 2) return buildings.sky
  return buildings[props.tile.group] || buildings.sky
})
const spriteStyle = computed(() => {
  const [x, y, w, h] = frame.value
  return {
    width: '100%', aspectRatio: `${w} / ${h}`,
    backgroundImage: `url(${atlas})`,
    backgroundSize: `${1280 / w * 100}% ${720 / h * 100}%`,
    backgroundPosition: `${x / (1280 - w) * 100}% ${y / (720 - h) * 100}%`,
  }
})
</script>

<template>
  <span class="asset-prop" :class="special" role="img" :aria-label="tile.name">
    <CrHouseSprite v-if="tile.type === 'property' && tile.owner" :level="tile.houseLevel" :skin="tile.ownerSkin" :color="tile.ownerColor" />
    <span v-else class="atlas-sprite" :style="spriteStyle" />
    <span v-if="special === 'airport'" class="airport-mark" aria-hidden="true">✈</span>
    <span v-if="special === 'start'" class="start-mark" aria-hidden="true">➜</span>
  </span>
</template>

<style scoped>
.asset-prop { position:relative; display:flex; align-items:flex-end; justify-content:center; width:100%; height:100%; pointer-events:none; filter:drop-shadow(0 5px 3px #35523c30); }
.atlas-sprite { display:block; flex:none; background-repeat:no-repeat; }
.airport-mark,.start-mark { position:absolute; inset:0; display:grid; place-items:center; font-size:clamp(22px,4vw,48px); color:#fff; text-shadow:0 3px 0 #2776aa,0 5px 8px #173e63; }
</style>
