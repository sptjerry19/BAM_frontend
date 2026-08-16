import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { trackSpotlight } from './utils/spotlight'
import { useTheme } from './composables/useTheme'
import { useLocale } from './composables/useLocale'

useTheme()
useLocale()
trackSpotlight()

createApp(App).use(router).mount('#app')
