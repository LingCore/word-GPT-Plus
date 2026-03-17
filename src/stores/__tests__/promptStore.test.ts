import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePromptStore } from '../promptStore'

describe('promptStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('starts with empty savedPrompts', () => {
    const store = usePromptStore()
    expect(store.savedPrompts).toEqual([])
  })

  it('loads prompts from localStorage', () => {
    const prompts = [{ id: '1', name: 'Test', systemPrompt: 'sys', userPrompt: 'usr' }]
    localStorage.setItem('savedPrompts', JSON.stringify(prompts))

    const store = usePromptStore()
    store.load()

    expect(store.savedPrompts).toEqual(prompts)
  })

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('savedPrompts', 'not-json')
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const store = usePromptStore()
    store.load()

    expect(store.savedPrompts).toEqual([])
    consoleSpy.mockRestore()
  })

  it('adds a prompt and persists to localStorage', () => {
    const store = usePromptStore()
    const prompt = { id: 'p1', name: 'Prompt 1', systemPrompt: 'sys', userPrompt: 'usr' }

    store.addPrompt(prompt)

    expect(store.savedPrompts).toHaveLength(1)
    expect(store.savedPrompts[0]).toEqual(prompt)
    expect(JSON.parse(localStorage.getItem('savedPrompts')!)).toHaveLength(1)
  })

  it('removes a prompt by id', () => {
    const store = usePromptStore()
    store.addPrompt({ id: 'p1', name: 'A', systemPrompt: '', userPrompt: '' })
    store.addPrompt({ id: 'p2', name: 'B', systemPrompt: '', userPrompt: '' })

    store.removePrompt('p1')

    expect(store.savedPrompts).toHaveLength(1)
    expect(store.savedPrompts[0].id).toBe('p2')
  })

  it('clears selection when the selected prompt is removed', () => {
    const store = usePromptStore()
    store.addPrompt({ id: 'p1', name: 'A', systemPrompt: 'sys', userPrompt: 'usr' })
    store.selectPrompt('p1')

    expect(store.selectedPromptId).toBe('p1')
    expect(store.customSystemPrompt).toBe('sys')

    store.removePrompt('p1')

    expect(store.selectedPromptId).toBe('')
    expect(store.customSystemPrompt).toBe('')
  })

  it('updates a prompt by id', () => {
    const store = usePromptStore()
    store.addPrompt({ id: 'p1', name: 'Old', systemPrompt: 'old-sys', userPrompt: 'old-usr' })

    store.updatePrompt('p1', { name: 'New', systemPrompt: 'new-sys' })

    expect(store.savedPrompts[0].name).toBe('New')
    expect(store.savedPrompts[0].systemPrompt).toBe('new-sys')
    expect(store.savedPrompts[0].userPrompt).toBe('old-usr')
  })

  it('selectPrompt sets customSystemPrompt and returns prompt data', () => {
    const store = usePromptStore()
    store.addPrompt({ id: 'p1', name: 'Test', systemPrompt: 'Hello', userPrompt: 'World' })

    const result = store.selectPrompt('p1')

    expect(result).toEqual({ systemPrompt: 'Hello', userPrompt: 'World' })
    expect(store.customSystemPrompt).toBe('Hello')
  })

  it('selectPrompt returns null for empty id', () => {
    const store = usePromptStore()
    const result = store.selectPrompt('')

    expect(result).toBeNull()
    expect(store.customSystemPrompt).toBe('')
  })

  it('clearSelection resets selection state', () => {
    const store = usePromptStore()
    store.addPrompt({ id: 'p1', name: 'Test', systemPrompt: 'sys', userPrompt: 'usr' })
    store.selectPrompt('p1')
    store.clearSelection()

    expect(store.selectedPromptId).toBe('')
    expect(store.customSystemPrompt).toBe('')
  })
})
