<script setup>
import { useTheme } from '../../composables/useTheme'
import Icon from './Icon.vue'

defineProps({
  class: { type: String, default: '' },
})

const { isDark, toggleTheme } = useTheme()

function onToggle(event) {
  toggleTheme(event)
}
</script>

<template>
  <button
    type="button"
    class="icon-btn theme-toggle"
    :class="$props.class"
    :aria-label="isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'"
    :title="isDark ? 'Chế độ sáng' : 'Chế độ tối'"
    @click="onToggle"
  >
    <span class="theme-toggle__icon" :key="isDark ? 'sun' : 'moon'">
      <Icon :name="isDark ? 'sun' : 'moon'" :size="18" />
    </span>
  </button>
</template>
