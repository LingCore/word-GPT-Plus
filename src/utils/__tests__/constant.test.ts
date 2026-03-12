import { describe, expect, it } from 'vitest'

import {
  availableAPIs,
  availableModels,
  availableModelsForGemini,
  availableModelsForGroq,
  availableModelsForOllama,
  buildInPrompt,
  languageMap,
} from '../constant'

describe('languageMap', () => {
  it('contains English', () => {
    expect(languageMap.en).toBe('English')
  })

  it('contains Simplified Chinese', () => {
    expect(languageMap['zh-cn']).toBe('简体中文')
  })

  it('has at least 30 languages', () => {
    expect(Object.keys(languageMap).length).toBeGreaterThanOrEqual(30)
  })
})

describe('availableAPIs', () => {
  it('includes all 5 supported providers', () => {
    expect(Object.keys(availableAPIs)).toEqual(
      expect.arrayContaining(['official', 'azure', 'gemini', 'ollama', 'groq']),
    )
  })
})

describe('model lists', () => {
  it('availableModels is a non-empty array of strings', () => {
    expect(availableModels.length).toBeGreaterThan(0)
    for (const m of availableModels) {
      expect(typeof m).toBe('string')
    }
  })

  it('availableModelsForGemini is a non-empty array', () => {
    expect(availableModelsForGemini.length).toBeGreaterThan(0)
  })

  it('availableModelsForOllama is a non-empty array', () => {
    expect(availableModelsForOllama.length).toBeGreaterThan(0)
  })

  it('availableModelsForGroq is a non-empty array', () => {
    expect(availableModelsForGroq.length).toBeGreaterThan(0)
  })
})

describe('buildInPrompt', () => {
  const promptKeys = ['translate', 'polish', 'academic', 'summary', 'grammar'] as const

  for (const key of promptKeys) {
    describe(key, () => {
      it('has system function that accepts language', () => {
        const result = buildInPrompt[key].system('English')
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      })

      it('has user function that accepts text and language', () => {
        const result = buildInPrompt[key].user('Hello world', 'English')
        expect(typeof result).toBe('string')
        expect(result).toContain('Hello world')
      })
    })
  }
})
