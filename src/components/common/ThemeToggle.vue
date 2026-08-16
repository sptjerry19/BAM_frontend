<script setup>
import { useTheme } from '../../composables/useTheme'
import { useLocale } from '../../composables/useLocale'
import Icon from './Icon.vue'

defineProps({
  class: { type: String, default: '' },
})

const { isDark, toggleTheme } = useTheme()
const { t } = useLocale()

function onToggle(event) {
  toggleTheme(event)
}
</script>

<template>
  <button
    type="button"
    class="icon-btn theme-toggle"
    :class="$props.class"
    :aria-label="isDark ? t('theme.toLight') : t('theme.toDark')"
    :title="isDark ? t('theme.light') : t('theme.dark')"
    @click="onToggle"
  >
    <span class="theme-toggle__icon" :key="isDark ? 'sun' : 'moon'">
      <Icon :name="isDark ? 'sun' : 'moon'" :size="18" />
    </span>
  </button>
</template>
