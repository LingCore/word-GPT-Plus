import type { Ref } from 'vue'

import type { SettingNames } from '@/utils/settingPreset'

type SettingForm = { [K in SettingNames]: unknown }

export function buildProviderConfig(settingForm: Ref<SettingForm>): Record<string, unknown> | undefined {
  const s = settingForm.value
  const configs: Record<string, Record<string, unknown>> = {
    official: {
      provider: 'official',
      config: {
        apiKey: s.officialAPIKey,
        baseURL: s.officialBasePath,
        dangerouslyAllowBrowser: true,
      },
      maxTokens: s.officialMaxTokens,
      temperature: s.officialTemperature,
      model: s.officialModelSelect,
    },
    groq: {
      provider: 'groq',
      groqAPIKey: s.groqAPIKey,
      groqModel: s.groqModelSelect,
      maxTokens: s.groqMaxTokens,
      temperature: s.groqTemperature,
    },
    azure: {
      provider: 'azure',
      azureAPIKey: s.azureAPIKey,
      azureAPIEndpoint: s.azureAPIEndpoint,
      azureDeploymentName: s.azureDeploymentName,
      azureAPIVersion: s.azureAPIVersion,
      maxTokens: s.azureMaxTokens,
      temperature: s.azureTemperature,
    },
    gemini: {
      provider: 'gemini',
      geminiAPIKey: s.geminiAPIKey,
      maxTokens: s.geminiMaxTokens,
      temperature: s.geminiTemperature,
      geminiModel: s.geminiModelSelect,
    },
    ollama: {
      provider: 'ollama',
      ollamaEndpoint: s.ollamaEndpoint,
      ollamaModel: s.ollamaModelSelect,
      temperature: s.ollamaTemperature,
    },
  }

  const provider = s.api as string
  return configs[provider]
}
