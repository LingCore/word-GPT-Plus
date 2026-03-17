import { ref } from 'vue'

import { localStorageKey } from '@/utils/enum'

export type ThemeValue = 'light' | 'dark'

const VALID_THEMES: ThemeValue[] = ['light', 'dark']

function isValidTheme(value: string | null): value is ThemeValue {
  return value !== null && VALID_THEMES.includes(value as ThemeValue)
}

export function applyTheme(value: ThemeValue): void {
  document.documentElement.setAttribute('data-theme', value)
}

const isDark = ref(false)

export function initTheme(): void {
  const stored = localStorage.getItem(localStorageKey.theme)
  const theme: ThemeValue = isValidTheme(stored) ? stored : 'dark'
  isDark.value = theme === 'dark'
  applyTheme(theme)
}

export function useTheme() {
  function toggleTheme() {
    const next: ThemeValue = isDark.value ? 'light' : 'dark'
    isDark.value = next === 'dark'
    localStorage.setItem(localStorageKey.theme, next)
    applyTheme(next)
  }

  return { isDark, toggleTheme }
}
