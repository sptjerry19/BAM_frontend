<script setup>
/**
 * Real basemap (Leaflet + OpenStreetMap France tiles) with one pin per court.
 * Courts without lat/lng are skipped — they still show in the list next to the map.
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useTheme } from '../../composables/useTheme'
import { formatCurrency } from '../../utils/labels'

const props = defineProps({
  courts: { type: Array, default: () => [] },
  selected: { type: Object, default: null },
  statusColors: { type: Object, required: true },
  statusShort: { type: Object, required: true },
})

const emit = defineEmits(['select', 'book'])

const { isDark } = useTheme()

const HANOI_CENTER = [21.0278, 105.8342]
const TILES = 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'

const container = ref(null)
let map = null
/** @type {Map<string | number, import('leaflet').Marker>} */
const markers = new Map()

const located = computed(() =>
  props.courts.filter((c) => Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng))),
)

function pinIcon(court, active) {
  const color = props.statusColors[court.status] ?? '#94a3b8'

  return L.divIcon({
    className: 'jb-pin-wrap',
    html: `
      <span class="jb-pin${active ? ' is-active' : ''}" style="--pin: ${color}">
        <span class="jb-pin__count">${court.courts ?? ''}</span>
      </span>`,
    iconSize: [34, 44],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
  })
}

function popupHtml(court) {
  const color = props.statusColors[court.status] ?? '#94a3b8'
  const status = props.statusShort[court.status] ?? ''

  return `
    <div class="jb-pop">
      <span class="jb-pop__status" style="--pin: ${color}">${status} · ${escapeHtml(court.district ?? '')}</span>
      <strong class="jb-pop__name">${escapeHtml(court.name ?? '')}</strong>
      <span class="jb-pop__addr">${escapeHtml(court.address ?? '')}</span>
      <div class="jb-pop__foot">
        <span class="jb-pop__price">${formatCurrency(court.price)}<i>/giờ</i></span>
        <button type="button" class="jb-pop__cta" ${court.status === 'closed' ? 'disabled' : ''}>
          ${court.status === 'closed' ? 'Đang đóng' : 'Đặt sân'}
        </button>
      </div>
    </div>`
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  )
}

function renderMarkers() {
  if (!map) return

  const ids = new Set()

  located.value.forEach((court) => {
    ids.add(court.id)
    const latlng = [Number(court.lat), Number(court.lng)]
    const active = props.selected?.id === court.id
    const existing = markers.get(court.id)

    if (existing) {
      existing.setLatLng(latlng)
      existing.setIcon(pinIcon(court, active))
      existing.setPopupContent(popupHtml(court))
      return
    }

    const marker = L.marker(latlng, { icon: pinIcon(court, active), title: court.name })
      .addTo(map)
      .bindPopup(popupHtml(court), { closeButton: false, offset: [0, 0] })

    marker.on('click', () => emit('select', court))
    marker.on('popupopen', (e) => {
      e.popup
        .getElement()
        ?.querySelector('.jb-pop__cta')
        ?.addEventListener('click', () => emit('book', court), { once: true })
    })

    markers.set(court.id, marker)
  })

  markers.forEach((marker, id) => {
    if (ids.has(id)) return
    marker.remove()
    markers.delete(id)
  })
}

function fitToCourts() {
  if (!map || located.value.length === 0) return

  const bounds = L.latLngBounds(located.value.map((c) => [Number(c.lat), Number(c.lng)]))
  map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14, animate: false })
}

onMounted(async () => {
  await nextTick()

  map = L.map(container.value, {
    center: HANOI_CENTER,
    zoom: 12,
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: true,
  })

  container.value.classList.toggle('is-dark', isDark.value)

  L.tileLayer(TILES, {
    maxZoom: 20,
    subdomains: 'abc',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; OSM France',
  }).addTo(map)

  // Scroll zoom stays off until the user commits to the map.
  map.on('click', () => map.scrollWheelZoom.enable())
  map.on('mouseout', () => map.scrollWheelZoom.disable())

  renderMarkers()
  fitToCourts()
  requestAnimationFrame(() => map?.invalidateSize())
})

onUnmounted(() => {
  map?.remove()
  map = null
  markers.clear()
})

watch(isDark, (dark) => {
  container.value?.classList.toggle('is-dark', dark)
})

watch(
  () => props.courts,
  () => {
    renderMarkers()
    fitToCourts()
    map?.invalidateSize()
  },
  { deep: true },
)

watch(
  () => props.selected,
  (court) => {
    if (!map) return
    renderMarkers()

    const marker = court && markers.get(court.id)
    if (!marker) return

    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 14), { duration: 0.6 })
    marker.openPopup()
  },
)
</script>

<template>
  <div class="relative w-full h-full">
    <div ref="container" class="jb-map w-full h-full" />

    <div
      v-if="located.length === 0"
      class="absolute inset-0 z-[500] flex items-center justify-center text-center px-6 pointer-events-none"
    >
      <p class="glass rounded-2xl px-4 py-3 text-[13px]" style="color: var(--text-2)">
        Chưa có sân nào được gắn tọa độ. Thêm vĩ độ / kinh độ trong trang quản trị.
      </p>
    </div>
  </div>
</template>

<style>
.jb-map {
  height: 100%;
  width: 100%;
  background: var(--bg-2);
}

.jb-map.is-dark .leaflet-tile-pane {
  filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9);
}

.jb-map .leaflet-control-attribution {
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  color: var(--text-3);
  font-size: 10px;
}

.jb-map .leaflet-control-attribution a {
  color: var(--text-2);
}

.jb-map .leaflet-bar a {
  background: var(--bg-2);
  color: var(--text-1);
  border-bottom-color: var(--line);
}

.jb-map .leaflet-bar a:hover {
  background: var(--bg);
}

/* Teardrop pin: circle with the court count, pointing at the exact location. */
.jb-pin {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  background: var(--pin);
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.28);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.jb-pin__count {
  transform: rotate(45deg);
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 12px;
  font-weight: 700;
  color: #0a1200;
}

.jb-pin-wrap:hover .jb-pin {
  transform: rotate(-45deg) scale(1.12);
}

.jb-pin.is-active {
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--pin) 35%, transparent), 0 8px 18px rgba(0, 0, 0, 0.3);
  z-index: 500;
}

.jb-map .leaflet-popup-content-wrapper {
  background: var(--bg-2);
  color: var(--text-1);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: var(--shadow-lg, 0 18px 40px rgba(0, 0, 0, 0.3));
}

.jb-map .leaflet-popup-tip {
  background: var(--bg-2);
  border: 1px solid var(--line);
}

.jb-map .leaflet-popup-content {
  margin: 12px 14px;
  width: 210px !important;
}

.jb-pop {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.jb-pop__status {
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--pin);
}

.jb-pop__name {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
}

.jb-pop__addr {
  font-size: 11.5px;
  color: var(--text-3);
}

.jb-pop__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
}

.jb-pop__price {
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}

.jb-pop__price i {
  font-style: normal;
  font-size: 10.5px;
  color: var(--text-3);
}

.jb-pop__cta {
  background: var(--accent);
  color: var(--bg);
  border-radius: 10px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.jb-pop__cta:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
