import './index.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { initTheme } from './composables/useTheme'
import { i18n } from './i18n'
import router from './router'
import { installGlobalErrorHandler } from './utils/errorTracker'

window.Office.onReady(() => {
  initTheme()
  installGlobalErrorHandler()
  const app = createApp(App)
  const _ResizeObserver = window.ResizeObserver
  window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      let timer: number | null = null
      const debounced: ResizeObserverCallback = (...args) => {
        if (timer !== null) clearTimeout(timer)
        timer = window.setTimeout(() => callback(...args), 16)
      }
      super(debounced)
    }
  }
  app.use(createPinia())
  app.use(i18n)
  app.use(router)
  app.mount('#app')
})
