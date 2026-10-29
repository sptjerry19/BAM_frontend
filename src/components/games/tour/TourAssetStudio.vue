<script setup>
import { ref } from 'vue'
import TourPawn from './TourPawn.vue'
import TourDice from './TourDice.vue'
import TourCoin from './TourCoin.vue'
import TourShuttle from './TourShuttle.vue'
import TourHouse from './TourHouse.vue'
import { TOUR_SKINS, TOUR_ANIMS, TOUR_PROPS, HOUSE_LEVELS } from './catalog'

const anim = ref('idle')
const rolling = ref(false)
const dice = ref([2, 5, 3])

function roll() {
  rolling.value = true
  window.setTimeout(() => {
    dice.value = [1, 2, 3].map(() => 1 + Math.floor(Math.random() * 6))
    rolling.value = false
  }, 700)
}
</script>

<template>
  <div class="studio">
    <header>
      <p class="kicker">JB Tour</p>
      <h1>Asset studio</h1>
      <p class="lead">
        Pawn / props / xúc xắc đều là khối CSS 3D (không nền ảnh). Bấm walk để thấy khớp chân tay.
        <code>&lt;TourPawn skin="ace" anim="walk" /&gt;</code>.
      </p>
    </header>

    <section>
      <div class="row">
        <h2>Pawn</h2>
        <div class="anims">
          <button
            v-for="a in TOUR_ANIMS"
            :key="a"
            type="button"
            :class="{ on: anim === a }"
            @click="anim = a"
          >
            {{ a }}
          </button>
        </div>
      </div>
      <div class="grid pawns">
        <figure v-for="s in TOUR_SKINS" :key="s.id">
          <TourPawn :skin="s.id" :anim="anim" :size="120" :name="s.name" />
          <figcaption>
            <strong>{{ s.name }}</strong>
            <span>{{ s.role }} · {{ s.id }}</span>
            <code>{{ s.model }}</code>
          </figcaption>
        </figure>
      </div>
    </section>

    <section>
      <div class="row">
        <h2>Props</h2>
        <button type="button" class="roll" @click="roll">Roll</button>
      </div>
      <div class="grid props">
        <figure>
          <TourDice :values="dice" :rolling="rolling" :size="68" />
          <figcaption>
            <strong>Xúc xắc</strong>
            <span>{{ dice.join(' · ') }}</span>
            <code>/games/tour/models/dice.gltf</code>
          </figcaption>
        </figure>
        <figure>
          <TourCoin :amount="'1.5M'" :size="72" />
          <figcaption>
            <strong>Vàng</strong>
            <span>spin</span>
            <code>/games/tour/models/coin.gltf</code>
          </figcaption>
        </figure>
        <figure>
          <TourShuttle anim="idle" :size="72" />
          <figcaption>
            <strong>Cầu</strong>
            <span>idle / fly</span>
            <code>/games/tour/models/shuttle.gltf</code>
          </figcaption>
        </figure>
      </div>
    </section>

    <section>
      <h2>Sân nhà · 4 màu × 4 cấp</h2>
      <p class="lead sub">Lv1 sân tập · Lv2 nhà VĐV · Lv3 club · Lv4 arena. Prop: <code>level</code> + <code>color</code>.</p>
      <div class="house-grid">
        <div class="head"></div>
        <div v-for="h in HOUSE_LEVELS" :key="h.level" class="head">Lv{{ h.level }} {{ h.name }}</div>
        <template v-for="s in TOUR_SKINS" :key="s.id">
          <div class="head side">{{ s.name }}</div>
          <figure v-for="h in HOUSE_LEVELS" :key="s.id + h.level" class="house-cell">
            <TourHouse :skin="s.id" :color="s.color" :level="h.level" :size="96" />
            <figcaption>
              <code>house_lv{{ h.level }}.gltf</code>
            </figcaption>
          </figure>
        </template>
      </div>
    </section>

    <section>
      <h2>glTF clips</h2>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Clips</th>
            <th>Dùng cho</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in [...TOUR_SKINS, ...TOUR_PROPS]" :key="m.id">
            <td><code>{{ m.model }}</code></td>
            <td>{{ m.clips.join(', ') }}</td>
            <td>{{ m.name }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<style scoped>
.studio {
  max-width: 980px;
  margin: 0 auto;
  padding: 24px 16px 80px;
  color: var(--text, #0f172a);
}
.kicker {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
  font-weight: 600;
  margin: 0;
}
h1 { font-size: 1.6rem; margin: 4px 0 8px; }
.lead { color: #475569; margin: 0 0 28px; line-height: 1.5; }
code {
  font-size: 11px;
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 4px;
}
section { margin-bottom: 36px; }
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
h2 { font-size: 1.05rem; margin: 0; }
.anims, .roll {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.anims button, .roll {
  border: 1px solid #cbd5e1;
  background: #fff;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}
.anims button.on, .roll { background: #2563eb; color: #fff; border-color: #2563eb; }
.grid {
  display: grid;
  gap: 16px;
}
.pawns { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.pawns figure { min-height: 260px; }
.props { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
figure {
  margin: 0;
      background: repeating-conic-gradient(#e2e8f0 0% 25%, #f8fafc 0% 50%) 50% / 16px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 28px 12px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 240px;
  overflow: visible;
}
figcaption {
  margin-top: auto;
  padding-top: 12px;
  display: grid;
  gap: 2px;
  text-align: center;
  font-size: 12px;
  color: #64748b;
}
figcaption strong { color: #0f172a; font-size: 13px; }
.lead.sub { margin: 6px 0 16px; font-size: 13px; }
.house-grid {
  display: grid;
  grid-template-columns: 72px repeat(4, 1fr);
  gap: 10px;
  align-items: end;
}
.head {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-align: center;
}
.head.side { text-align: left; align-self: center; }
.house-cell {
  min-height: 210px;
  padding: 20px 8px 12px;
  overflow: visible;
}
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { text-align: left; padding: 8px 6px; border-bottom: 1px solid #e2e8f0; }
</style>
