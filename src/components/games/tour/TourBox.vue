<script setup>
defineProps({
  w: { type: Number, required: true },
  h: { type: Number, required: true },
  d: { type: Number, required: true },
  color: { type: String, default: '#2563eb' },
})
</script>

<template>
  <div
    class="box"
    :style="{
      '--w': w + 'px',
      '--h': h + 'px',
      '--d': d + 'px',
      '--c': color,
    }"
  >
    <i class="ft" />
    <i class="bk" />
    <i class="rt" />
    <i class="lf" />
    <i class="tp" />
    <i class="bt" />
  </div>
</template>

<style scoped>
.box {
  width: var(--w);
  height: var(--h);
  position: relative;
  transform-style: preserve-3d;
}
i {
  position: absolute;
  display: block;
  box-sizing: border-box;
  border: 1px solid color-mix(in srgb, var(--c) 70%, #0f172a);
}
.ft, .bk {
  width: var(--w);
  height: var(--h);
  left: 0;
  top: 0;
}
.ft {
  background: linear-gradient(180deg, color-mix(in srgb, var(--c) 78%, #fff), var(--c));
  transform: translateZ(calc(var(--d) / 2));
}
.bk {
  background: color-mix(in srgb, var(--c) 62%, #0f172a);
  transform: rotateY(180deg) translateZ(calc(var(--d) / 2));
}
.rt, .lf {
  width: var(--d);
  height: var(--h);
  top: 0;
  left: calc((var(--w) - var(--d)) / 2);
}
.rt {
  background: color-mix(in srgb, var(--c) 72%, #1e293b);
  transform: rotateY(90deg) translateZ(calc(var(--w) / 2));
}
.lf {
  background: color-mix(in srgb, var(--c) 88%, #fff);
  transform: rotateY(-90deg) translateZ(calc(var(--w) / 2));
}
.tp, .bt {
  width: var(--w);
  height: var(--d);
  left: 0;
  top: calc((var(--h) - var(--d)) / 2);
}
.tp {
  background: color-mix(in srgb, var(--c) 45%, #fff);
  transform: rotateX(90deg) translateZ(calc(var(--h) / 2));
}
.bt {
  background: color-mix(in srgb, var(--c) 50%, #0f172a);
  transform: rotateX(-90deg) translateZ(calc(var(--h) / 2));
}
</style>
