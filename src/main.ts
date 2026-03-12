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
  const debounce = (fn: (...args: unknown[]) => void, delay?: number) => {
    let timer: number | null = null
    return function (this: unknown, ...args: unknown[]) {
      const context = this

      if (timer !== null) clearTimeout(timer)
      timer = window.setTimeout(() => {
        fn.apply(context, args)
      }, delay)
    }
  }

  const _ResizeObserver = window.ResizeObserver
  window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      callback = debounce(callback, 16)
      super(callback)
    }
  }
  app.use(createPinia())
  app.use(i18n)
  app.use(router)
  app.mount('#app')
})
