<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  prefix: { type: String, default: '' },
  suffix: { type: String, default: '' },
})

const display = ref(0)
const DURATION = 1200

function animate(from, to) {
  const start = performance.now()
  const diff = to - from

  function step(now) {
    const progress = Math.min((now - start) / DURATION, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    display.value = Math.round(from + diff * eased)
    if (progress < 1) requestAnimationFrame(step)
  }

  requestAnimationFrame(step)
}

watch(
  () => props.value,
  (val, old) => animate(old ?? 0, val),
)

onMounted(() => animate(0, props.value))
</script>

<template>
  <span class="mono">{{ prefix }}{{ display.toLocaleString('vi-VN') }}{{ suffix }}</span>
</template>
