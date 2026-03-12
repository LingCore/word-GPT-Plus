import { describe, expect, it } from 'vitest'

import { checkAuth, forceNumber, getLabel, getOptionList, getPlaceholder } from '../common'

describe('forceNumber', () => {
  it('converts numeric string to number', () => {
    expect(forceNumber('42')).toBe(42)
  })

  it('returns 0 for non-numeric string', () => {
    expect(forceNumber('abc')).toBe(0)
  })

  it('returns 0 for null', () => {
    expect(forceNumber(null)).toBe(0)
  })

  it('returns 0 for undefined', () => {
    expect(forceNumber(undefined)).toBe(0)
  })

  it('returns 0 for empty string', () => {
    expect(forceNumber('')).toBe(0)
  })

  it('returns 0 for NaN', () => {
    expect(forceNumber(Number.NaN)).toBe(0)
  })

  it('passes through a valid number', () => {
    expect(forceNumber(3.14)).toBe(3.14)
  })

  it('handles negative numbers', () => {
    expect(forceNumber('-7')).toBe(-7)
  })
})

describe('checkAuth', () => {
  it('returns false for falsy input', () => {
    expect(checkAuth(null as never)).toBe(false)
  })

  it('returns true for official with apiKey', () => {
    expect(checkAuth({ type: 'official', apiKey: 'sk-xxx' })).toBe(true)
  })

  it('returns false for official without apiKey', () => {
    expect(checkAuth({ type: 'official' })).toBe(false)
  })

  it('returns true for azure with azureAPIKey', () => {
    expect(checkAuth({ type: 'azure', azureAPIKey: 'key-123' })).toBe(true)
  })

  it('returns false for azure without azureAPIKey', () => {
    expect(checkAuth({ type: 'azure' })).toBe(false)
  })

  it('returns true for gemini with geminiAPIKey', () => {
    expect(checkAuth({ type: 'gemini', geminiAPIKey: 'gk-xxx' })).toBe(true)
  })

  it('returns false for gemini without geminiAPIKey', () => {
    expect(checkAuth({ type: 'gemini' })).toBe(false)
  })

  it('returns true for groq with groqAPIKey', () => {
    expect(checkAuth({ type: 'groq', groqAPIKey: 'grq-xxx' })).toBe(true)
  })

  it('returns false for groq without groqAPIKey', () => {
    expect(checkAuth({ type: 'groq' })).toBe(false)
  })

  it('returns true for ollama without any key', () => {
    expect(checkAuth({ type: 'ollama' })).toBe(true)
  })

  it('returns false for unknown provider', () => {
    expect(checkAuth({ type: 'unknown' as never })).toBe(false)
  })
})

describe('getOptionList', () => {
  const testMap = { alpha: 'A', beta: 'B', gamma: 'C' }

  it('returns key-based options by default', () => {
    const result = getOptionList(testMap)
    expect(result).toEqual([
      { label: 'alpha', value: 'A' },
      { label: 'beta', value: 'B' },
      { label: 'gamma', value: 'C' },
    ])
  })

  it('returns value-based options when from is "value"', () => {
    const result = getOptionList(testMap, 'value')
    expect(result).toEqual([
      { label: 'A', value: 'A' },
      { label: 'B', value: 'B' },
      { label: 'C', value: 'C' },
    ])
  })

  it('handles empty map', () => {
    expect(getOptionList({})).toEqual([])
  })
})

describe('getLabel / getPlaceholder', () => {
  it('appends Label suffix', () => {
    expect(getLabel('apiKey')).toBe('apiKeyLabel')
  })

  it('appends Placeholder suffix', () => {
    expect(getPlaceholder('apiKey')).toBe('apiKeyPlaceholder')
  })
})
