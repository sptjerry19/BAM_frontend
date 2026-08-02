<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true },
})

const config = computed(() => {
  const map = {
    open: { label: 'Đang mở', color: '#84cc16' },
    busy: { label: 'Đông', color: '#facc15' },
    closed: { label: 'Đóng', color: '#ef4444' },
    active: { label: 'Hoạt động', color: '#84cc16' },
    inactive: { label: 'Dừng HĐ', color: '#64748b' },
  }
  return map[props.status] || map.inactive
})
</script>

<template>
  <span
    class="pill inline-flex items-center gap-1.5"
    :style="{
      background: `${config.color}1f`,
      color: config.color,
      border: `1px solid ${config.color}30`,
    }"
  >
    <span
      class="w-1.5 h-1.5 rounded-full shrink-0"
      :style="{ background: config.color }"
    />
    {{ config.label }}
  </span>
</template>
