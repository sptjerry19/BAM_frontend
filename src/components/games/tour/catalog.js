import skinAce from '../../../assets/games/tour/skins/ace.jpg'
import skinRuby from '../../../assets/games/tour/skins/ruby.jpg'
import skinKiwi from '../../../assets/games/tour/skins/kiwi.jpg'
import skinBlaze from '../../../assets/games/tour/skins/blaze.jpg'
import propDice from '../../../assets/games/tour/props/dice.jpg'
import propCoin from '../../../assets/games/tour/props/coin.jpg'
import propShuttle from '../../../assets/games/tour/props/shuttle.jpg'
import propHouse from '../../../assets/games/tour/props/house.jpg'
import houseAce1 from '../../../assets/games/tour/houses/ace-1.jpg'
import houseAce2 from '../../../assets/games/tour/houses/ace-2.jpg'
import houseAce3 from '../../../assets/games/tour/houses/ace-3.jpg'
import houseAce4 from '../../../assets/games/tour/houses/ace-4.jpg'
import houseRuby1 from '../../../assets/games/tour/houses/ruby-1.jpg'
import houseRuby2 from '../../../assets/games/tour/houses/ruby-2.jpg'
import houseRuby3 from '../../../assets/games/tour/houses/ruby-3.jpg'
import houseRuby4 from '../../../assets/games/tour/houses/ruby-4.jpg'
import houseKiwi1 from '../../../assets/games/tour/houses/kiwi-1.jpg'
import houseKiwi2 from '../../../assets/games/tour/houses/kiwi-2.jpg'
import houseKiwi3 from '../../../assets/games/tour/houses/kiwi-3.jpg'
import houseKiwi4 from '../../../assets/games/tour/houses/kiwi-4.jpg'
import houseBlaze1 from '../../../assets/games/tour/houses/blaze-1.jpg'
import houseBlaze2 from '../../../assets/games/tour/houses/blaze-2.jpg'
import houseBlaze3 from '../../../assets/games/tour/houses/blaze-3.jpg'
import houseBlaze4 from '../../../assets/games/tour/houses/blaze-4.jpg'

export const TOUR_ANIMS = ['idle', 'walk', 'hop', 'cheer', 'sad', 'win']

export const HOUSE_LEVELS = [
  { level: 1, name: 'Sân tập', model: '/games/tour/models/house_lv1.gltf' },
  { level: 2, name: 'Nhà VĐV', model: '/games/tour/models/house_lv2.gltf' },
  { level: 3, name: 'Club', model: '/games/tour/models/house_lv3.gltf' },
  { level: 4, name: 'Arena', model: '/games/tour/models/house_lv4.gltf' },
]

export const HOUSE_SPRITES = {
  ace: [houseAce1, houseAce2, houseAce3, houseAce4],
  ruby: [houseRuby1, houseRuby2, houseRuby3, houseRuby4],
  kiwi: [houseKiwi1, houseKiwi2, houseKiwi3, houseKiwi4],
  blaze: [houseBlaze1, houseBlaze2, houseBlaze3, houseBlaze4],
}

export function houseSprite(skin, level) {
  const row = HOUSE_SPRITES[skin] ?? HOUSE_SPRITES.ace
  const i = Math.min(4, Math.max(1, Number(level) || 1)) - 1
  return row[i]
}

export const TOUR_SKINS = [
  {
    id: 'ace',
    name: 'Ace',
    role: 'VĐV',
    type: 'human',
    color: '#2563eb',
    accent: '#fbbf24',
    portrait: skinAce,
    model: '/games/tour/models/pawn_ace.gltf',
    clips: ['idle', 'walk', 'hop', 'cheer', 'sad', 'win'],
  },
  {
    id: 'ruby',
    name: 'Ruby',
    role: 'VĐV',
    type: 'human',
    color: '#db2777',
    accent: '#fecdd3',
    portrait: skinRuby,
    model: '/games/tour/models/pawn_ruby.gltf',
    clips: ['idle', 'walk', 'hop', 'cheer', 'sad', 'win'],
  },
  {
    id: 'kiwi',
    name: 'Kiwi',
    role: 'Mascot',
    type: 'mascot',
    color: '#65a30d',
    accent: '#f59e0b',
    portrait: skinKiwi,
    model: '/games/tour/models/pawn_kiwi.gltf',
    clips: ['idle', 'walk', 'hop', 'cheer', 'sad', 'win'],
  },
  {
    id: 'blaze',
    name: 'Blaze',
    role: 'Trọng tài',
    type: 'human',
    color: '#ea580c',
    accent: '#111827',
    portrait: skinBlaze,
    model: '/games/tour/models/pawn_blaze.gltf',
    clips: ['idle', 'walk', 'hop', 'cheer', 'sad', 'win'],
  },
]

export const TOUR_PROPS = [
  {
    id: 'dice',
    name: 'Xúc xắc',
    portrait: propDice,
    model: '/games/tour/models/dice.gltf',
    clips: ['roll'],
  },
  {
    id: 'coin',
    name: 'Vàng',
    portrait: propCoin,
    model: '/games/tour/models/coin.gltf',
    clips: ['spin'],
  },
  {
    id: 'shuttle',
    name: 'Cầu',
    portrait: propShuttle,
    model: '/games/tour/models/shuttle.gltf',
    clips: ['idle', 'fly'],
  },
  {
    id: 'house',
    name: 'Sân nhà',
    portrait: propHouse,
    model: '/games/tour/models/house.gltf',
    clips: ['pop'],
  },
  ...HOUSE_LEVELS.map((h) => ({
    id: `house_lv${h.level}`,
    name: h.name,
    portrait: propHouse,
    model: h.model,
    clips: ['pop'],
  })),
]

export function skinById(id) {
  return TOUR_SKINS.find((s) => s.id === id) ?? TOUR_SKINS[0]
}

export function propSprite(id) {
  return TOUR_PROPS.find((p) => p.id === id)?.portrait ?? propCoin
}
