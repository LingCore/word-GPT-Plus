import { beforeEach, describe, expect, it } from 'vitest'

import { applyTheme, initTheme, useTheme } from '../useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('applyTheme sets data-theme attribute', () => {
    applyTheme('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    applyTheme('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('initTheme defaults to dark when no stored value', () => {
    initTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('initTheme uses stored theme value', () => {
    localStorage.setItem('theme', 'light')
    initTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('initTheme falls back to dark for invalid stored value', () => {
    localStorage.setItem('theme', 'invalid-value')
    initTheme()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('useTheme returns isDark ref and toggleTheme function', () => {
    initTheme()
    const { isDark, toggleTheme } = useTheme()

    expect(isDark.value).toBe(true)
    expect(typeof toggleTheme).toBe('function')
  })

  it('toggleTheme switches from dark to light', () => {
    initTheme()
    const { isDark, toggleTheme } = useTheme()

    expect(isDark.value).toBe(true)

    toggleTheme()

    expect(isDark.value).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('toggleTheme switches from light to dark', () => {
    localStorage.setItem('theme', 'light')
    initTheme()
    const { isDark, toggleTheme } = useTheme()

    expect(isDark.value).toBe(false)

    toggleTheme()

    expect(isDark.value).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem('theme')).toBe('dark')
  })
})
