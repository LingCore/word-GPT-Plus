import { computed, type Ref } from 'vue'

import { localStorageKey } from '@/utils/enum'
import { getCustomModels, settingPreset } from '@/utils/settingPreset'

type SettingForm = {
  api: string
  officialModelSelect: string
  geminiModelSelect: string
  ollamaModelSelect: string
  groqModelSelect: string
  azureDeploymentName: string
  [key: string]: string | number | string[]
}

export function useModelSelection(settingForm: Ref<SettingForm>) {
  const currentModelOptions = computed(() => {
    let presetOptions: string[] = []
    let customModels: string[] = []

    switch (settingForm.value.api) {
      case 'official':
        presetOptions = settingPreset.officialModelSelect.optionList || []
        customModels = getCustomModels(localStorageKey.customModels, localStorageKey.customModel)
        break
      case 'gemini':
        presetOptions = settingPreset.geminiModelSelect.optionList || []
        customModels = getCustomModels(localStorageKey.geminiCustomModels, localStorageKey.geminiCustomModel)
        break
      case 'ollama':
        presetOptions = settingPreset.ollamaModelSelect.optionList || []
        customModels = getCustomModels(localStorageKey.ollamaCustomModels, localStorageKey.ollamaCustomModel)
        break
      case 'groq':
        presetOptions = settingPreset.groqModelSelect.optionList || []
        customModels = getCustomModels(localStorageKey.groqCustomModels, localStorageKey.groqCustomModel)
        break
      case 'azure':
        return []
      default:
        return []
    }

    return [...presetOptions, ...customModels]
  })

  const currentModelSelect = computed({
    get() {
      switch (settingForm.value.api) {
        case 'official':
          return settingForm.value.officialModelSelect
        case 'gemini':
          return settingForm.value.geminiModelSelect
        case 'ollama':
          return settingForm.value.ollamaModelSelect
        case 'groq':
          return settingForm.value.groqModelSelect
        case 'azure':
          return settingForm.value.azureDeploymentName
        default:
          return ''
      }
    },
    set(value: string) {
      switch (settingForm.value.api) {
        case 'official':
          settingForm.value.officialModelSelect = value
          localStorage.setItem(localStorageKey.model, value)
          break
        case 'gemini':
          settingForm.value.geminiModelSelect = value
          localStorage.setItem(localStorageKey.geminiModel, value)
          break
        case 'ollama':
          settingForm.value.ollamaModelSelect = value
          localStorage.setItem(localStorageKey.ollamaModel, value)
          break
        case 'groq':
          settingForm.value.groqModelSelect = value
          localStorage.setItem(localStorageKey.groqModel, value)
          break
        case 'azure':
          settingForm.value.azureDeploymentName = value
          localStorage.setItem(localStorageKey.azureDeploymentName, value)
          break
      }
    },
  })

  return { currentModelOptions, currentModelSelect }
}
