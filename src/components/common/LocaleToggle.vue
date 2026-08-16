<script setup>
import { useLocale } from '../../composables/useLocale'

defineProps({
  class: { type: String, default: '' },
})

const { locale, setLocale, t } = useLocale()
</script>

<template>
  <div
    class="locale-toggle"
    :class="$props.class"
    role="group"
    :aria-label="t('lang.switchTo')"
  >
    <button
      type="button"
      class="locale-toggle__btn"
      :class="{ 'is-active': locale === 'vi' }"
      :aria-pressed="locale === 'vi'"
      @click="setLocale('vi')"
    >
      {{ t('lang.vi') }}
    </button>
    <button
      type="button"
      class="locale-toggle__btn"
      :class="{ 'is-active': locale === 'en' }"
      :aria-pressed="locale === 'en'"
      @click="setLocale('en')"
    >
      {{ t('lang.en') }}
    </button>
  </div>
</template>
