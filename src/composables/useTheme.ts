import { localStorageKey } from '@/utils/enum'

export type ThemeValue = 'light' | 'dark' | 'system'

let mediaQueryCleanup: (() => void) | null = null

function resolveSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(value: ThemeValue): void {
  if (mediaQueryCleanup) {
    mediaQueryCleanup()
    mediaQueryCleanup = null
  }

  const resolved = value === 'system' ? resolveSystemTheme() : value
  document.documentElement.setAttribute('data-theme', resolved)

  if (value === 'system') {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
    }
    mql.addEventListener('change', handler)
    mediaQueryCleanup = () => mql.removeEventListener('change', handler)
  }
}

export function initTheme(): void {
  const stored = localStorage.getItem(localStorageKey.theme) as ThemeValue | null
  applyTheme(stored ?? 'system')
}
