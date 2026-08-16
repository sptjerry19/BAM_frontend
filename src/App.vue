<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { motion, AnimatePresence } from 'motion-v'
import { useAuth } from './composables/useAuth'
import { useLocale } from './composables/useLocale'
import SiteIntro from './components/common/SiteIntro.vue'

const route = useRoute()
const { bootstrapped } = useAuth()
const { locale, t } = useLocale()

/**
 * Keying on the top-level matched record keeps a layout mounted while its child
 * routes change, so only whole-section switches (auth <-> app) cross-fade.
 */
const sectionKey = computed(() => route.matched[0]?.path ?? route.path)

watch(
  locale,
  () => {
    const title = route.meta.titleKey ? t(route.meta.titleKey) : route.meta.title
    document.title = title ? `${title} — JBadminton` : 'JBadminton'
  },
)
</script>

<template>
  <SiteIntro :ready="bootstrapped" />

  <div
    v-if="!bootstrapped"
    class="min-h-[100dvh]"
    style="background: var(--bg)"
    aria-hidden="true"
  />

  <RouterView v-else v-slot="{ Component }">
    <AnimatePresence mode="wait">
      <motion.div
        :key="sectionKey"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1 }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.24 }"
      >
        <component :is="Component" />
      </motion.div>
    </AnimatePresence>
  </RouterView>
</template>
