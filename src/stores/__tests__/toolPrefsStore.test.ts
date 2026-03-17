import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useToolPrefsStore } from '../toolPrefsStore'

describe('toolPrefsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('loads all tools as enabled by default', () => {
    const store = useToolPrefsStore()
    expect(store.enabledWordTools.length).toBeGreaterThan(0)
    expect(store.enabledGeneralTools.length).toBeGreaterThan(0)
  })

  it('loads stored tool preferences from localStorage', () => {
    localStorage.setItem('enabledWordTools', JSON.stringify(['getSelectedText', 'insertText']))

    const store = useToolPrefsStore()

    expect(store.enabledWordTools).toEqual(['getSelectedText', 'insertText'])
  })

  it('filters out invalid tool names from localStorage', () => {
    localStorage.setItem('enabledWordTools', JSON.stringify(['getSelectedText', 'fakeToolName']))

    const store = useToolPrefsStore()

    expect(store.enabledWordTools).toEqual(['getSelectedText'])
  })

  it('falls back to defaults on invalid JSON', () => {
    localStorage.setItem('enabledWordTools', 'not-json')
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const store = useToolPrefsStore()

    expect(store.enabledWordTools.length).toBe(store.allWordTools.length)
    consoleSpy.mockRestore()
  })

  it('toggleWordTool adds a disabled tool', () => {
    localStorage.setItem('enabledWordTools', JSON.stringify(['getSelectedText']))
    const store = useToolPrefsStore()

    store.toggleWordTool('insertText')

    expect(store.enabledWordTools).toContain('insertText')
    expect(JSON.parse(localStorage.getItem('enabledWordTools')!)).toContain('insertText')
  })

  it('toggleWordTool removes an enabled tool', () => {
    localStorage.setItem('enabledWordTools', JSON.stringify(['getSelectedText', 'insertText']))
    const store = useToolPrefsStore()

    store.toggleWordTool('insertText')

    expect(store.enabledWordTools).not.toContain('insertText')
  })

  it('toggleGeneralTool toggles general tools', () => {
    const store = useToolPrefsStore()

    expect(store.isGeneralToolEnabled('fetchWebContent')).toBe(true)

    store.toggleGeneralTool('fetchWebContent')

    expect(store.isGeneralToolEnabled('fetchWebContent')).toBe(false)

    store.toggleGeneralTool('fetchWebContent')

    expect(store.isGeneralToolEnabled('fetchWebContent')).toBe(true)
  })

  it('isWordToolEnabled returns correct state', () => {
    localStorage.setItem('enabledWordTools', JSON.stringify(['getSelectedText']))
    const store = useToolPrefsStore()

    expect(store.isWordToolEnabled('getSelectedText')).toBe(true)
    expect(store.isWordToolEnabled('insertText')).toBe(false)
  })

  it('setWordTools replaces enabled tools and persists', () => {
    const store = useToolPrefsStore()

    store.setWordTools(['getSelectedText', 'appendText'])

    expect(store.enabledWordTools).toEqual(['getSelectedText', 'appendText'])
    expect(JSON.parse(localStorage.getItem('enabledWordTools')!)).toEqual(['getSelectedText', 'appendText'])
  })
})
