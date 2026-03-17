import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import json5Plugin from 'vite-plugin-json5'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), vue(), json5Plugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      async_hook: fileURLToPath(new URL('./async_hook.js', import.meta.url)),
      'node:async_hooks': fileURLToPath(new URL('./async_hook.js', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          langchain: ['langchain', '@langchain/core', '@langchain/langgraph'],
          'langchain-openai': ['@langchain/openai'],
          'langchain-google': ['@langchain/google-genai'],
          'langchain-ollama': ['@langchain/ollama'],
          'langchain-groq': ['@langchain/groq'],
          vendor: ['vue', 'vue-router', 'pinia', 'vue-i18n'],
        },
      },
    },
  },
})
