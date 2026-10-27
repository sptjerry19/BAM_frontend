import bg from '../../../assets/games/cr/cr-bg.jpg'
import tileStart from '../../../assets/games/cr/cr-tile-start.jpg'
import tileChance from '../../../assets/games/cr/cr-tile-chance.jpg'
import tileTax from '../../../assets/games/cr/cr-tile-tax.jpg'
import tileService from '../../../assets/games/cr/cr-tile-service.jpg'
import tileDetention from '../../../assets/games/cr/cr-tile-detention.jpg'
import tileRest from '../../../assets/games/cr/cr-tile-rest.jpg'
import tileRecall from '../../../assets/games/cr/cr-tile-recall.jpg'
import tileUmber from '../../../assets/games/cr/cr-tile-umber.jpg'
import tileSky from '../../../assets/games/cr/cr-tile-sky.jpg'
import tileRose from '../../../assets/games/cr/cr-tile-rose.jpg'
import tileAmber from '../../../assets/games/cr/cr-tile-amber.jpg'
import tileCrimson from '../../../assets/games/cr/cr-tile-crimson.jpg'
import tileGold from '../../../assets/games/cr/cr-tile-gold.jpg'
import tilePine from '../../../assets/games/cr/cr-tile-pine.jpg'
import tileNavy from '../../../assets/games/cr/cr-tile-navy.jpg'

export const CR_BG = bg

const GROUPS = {
  umber: tileUmber,
  sky: tileSky,
  rose: tileRose,
  amber: tileAmber,
  crimson: tileCrimson,
  gold: tileGold,
  pine: tilePine,
  navy: tileNavy,
}

const TYPES = {
  start: tileStart,
  chance: tileChance,
  tax: tileTax,
  service: tileService,
  detention: tileDetention,
  rest: tileRest,
  go_to_detention: tileRecall,
}

export function crTileArt(tile) {
  if (tile?.group && GROUPS[tile.group]) return GROUPS[tile.group]
  return TYPES[tile?.type] || tileRest
}
