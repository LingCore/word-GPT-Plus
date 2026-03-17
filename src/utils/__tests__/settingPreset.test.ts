import { beforeEach, describe, expect, it } from 'vitest'

import { getCustomModels, Setting_Names, settingPreset } from '../settingPreset'

describe('settingPreset', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defines presets for all setting names', () => {
    for (const key of Setting_Names) {
      expect(settingPreset[key]).toBeDefined()
      expect(settingPreset[key].defaultValue).toBeDefined()
    }
  })

  it('each preset has a valid type', () => {
    for (const key of Setting_Names) {
      const preset = settingPreset[key]
      if (preset.type) {
        expect(['input', 'select', 'inputNum']).toContain(preset.type)
      }
    }
  })

  it('select presets have optionObj or optionList', () => {
    for (const key of Setting_Names) {
      const preset = settingPreset[key]
      if (preset.type === 'select') {
        const hasOptions = preset.optionObj || preset.optionList
        expect(hasOptions).toBeTruthy()
      }
    }
  })

  it('inputNum presets have getFunc and saveFunc', () => {
    for (const key of Setting_Names) {
      const preset = settingPreset[key]
      if (preset.type === 'inputNum') {
        expect(preset.getFunc).toBeDefined()
        expect(preset.saveFunc).toBeDefined()
      }
    }
  })
})

describe('getCustomModels', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty array when no stored data', () => {
    expect(getCustomModels('customModels', 'customModel')).toEqual([])
  })

  it('returns parsed models from localStorage', () => {
    localStorage.setItem('customModels', JSON.stringify(['gpt-4', 'gpt-5']))
    expect(getCustomModels('customModels', 'customModel')).toEqual(['gpt-4', 'gpt-5'])
  })

  it('migrates from old key format', () => {
    localStorage.setItem('customModel', 'my-model')
    const result = getCustomModels('customModels', 'customModel')
    expect(result).toEqual(['my-model'])
    expect(JSON.parse(localStorage.getItem('customModels')!)).toEqual(['my-model'])
  })

  it('ignores old key when new key exists', () => {
    localStorage.setItem('customModels', JSON.stringify(['gpt-5']))
    localStorage.setItem('customModel', 'old-model')
    expect(getCustomModels('customModels', 'customModel')).toEqual(['gpt-5'])
  })

  it('returns empty array for invalid JSON', () => {
    localStorage.setItem('customModels', 'not-json')
    expect(getCustomModels('customModels', 'customModel')).toEqual([])
  })

  it('ignores empty old key', () => {
    localStorage.setItem('customModel', '   ')
    expect(getCustomModels('customModels', 'customModel')).toEqual([])
  })
})
