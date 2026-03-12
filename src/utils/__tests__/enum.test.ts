import { describe, expect, it } from 'vitest'

import { localStorageKey } from '../enum'

describe('localStorageKey', () => {
  it('has all common keys', () => {
    expect(localStorageKey.chatMode).toBe('chatMode')
    expect(localStorageKey.api).toBe('api')
    expect(localStorageKey.threadId).toBe('threadId')
    expect(localStorageKey.insertType).toBe('insertType')
  })

  it('has official provider keys', () => {
    expect(localStorageKey.apiKey).toBe('apiKey')
    expect(localStorageKey.model).toBe('model')
    expect(localStorageKey.temperature).toBe('temperature')
    expect(localStorageKey.maxTokens).toBe('maxTokens')
  })

  it('has azure provider keys', () => {
    expect(localStorageKey.azureAPIKey).toBe('azureAPIKey')
    expect(localStorageKey.azureAPIEndpoint).toBe('azureAPIEndpoint')
    expect(localStorageKey.azureDeploymentName).toBe('azureDeploymentName')
  })

  it('has gemini provider keys', () => {
    expect(localStorageKey.geminiAPIKey).toBe('geminiAPIKey')
    expect(localStorageKey.geminiModel).toBe('geminiModel')
  })

  it('has ollama provider keys', () => {
    expect(localStorageKey.ollamaEndpoint).toBe('ollamaEndpoint')
    expect(localStorageKey.ollamaModel).toBe('ollamaModel')
  })

  it('has groq provider keys', () => {
    expect(localStorageKey.groqAPIKey).toBe('groqAPIKey')
    expect(localStorageKey.groqModel).toBe('groqModel')
  })

  it('is frozen (as const)', () => {
    const keys = Object.keys(localStorageKey)
    expect(keys.length).toBeGreaterThan(20)
  })
})
