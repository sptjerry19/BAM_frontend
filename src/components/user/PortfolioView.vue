<script setup>
import { onBeforeUnmount, onMounted } from 'vue'

const bodyClass = 'portfolio-exact-open'

onMounted(() => document.body.classList.add(bodyClass))
onBeforeUnmount(() => document.body.classList.remove(bodyClass))
</script>

<template>
  <iframe
    class="portfolio-exact-frame"
    src="/portfolio-exact/index.html"
    title="Jerry's Interactive Portfolio"
    allow="clipboard-write"
  />
</template>

<style>
body.portfolio-exact-open {
  overflow: hidden;
  background: #09090b;
}

.portfolio-exact-frame {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: block;
  width: 100%;
  height: 100dvh;
  border: 0;
  background: #09090b;
}
</style>
