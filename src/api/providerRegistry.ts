import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { ChatGroq } from '@langchain/groq'
import { ChatOllama } from '@langchain/ollama'
import { AzureChatOpenAI, ChatOpenAI } from '@langchain/openai'

import type { AzureOptions, GeminiOptions, GroqOptions, OllamaOptions, OpenAIOptions } from './types'

type ModelFactory = (opts: Record<string, unknown>) => BaseChatModel

const registry = new Map<string, ModelFactory>()

function registerProvider(name: string, factory: ModelFactory) {
  registry.set(name, factory)
}

export function createModel(provider: string, opts: Record<string, unknown>): BaseChatModel {
  const factory = registry.get(provider)
  if (!factory) {
    throw new Error(`Unsupported provider: ${provider}`)
  }
  return factory(opts)
}

export function getRegisteredProviders(): string[] {
  return [...registry.keys()]
}

registerProvider('official', (opts: Record<string, unknown>) => {
  const o = opts as unknown as OpenAIOptions
  return new ChatOpenAI({
    modelName: o.model || 'gpt-5',
    configuration: {
      apiKey: o.config.apiKey,
      baseURL: o.config.baseURL || 'https://api.openai.com/v1',
    },
    temperature: o.temperature ?? 0.7,
    maxTokens: o.maxTokens ?? 800,
  })
})

registerProvider('ollama', (opts: Record<string, unknown>) => {
  const o = opts as unknown as OllamaOptions
  return new ChatOllama({
    model: o.ollamaModel,
    baseUrl: o.ollamaEndpoint?.replace(/\/$/, '') || 'http://localhost:11434',
    temperature: o.temperature,
  })
})

registerProvider('groq', (opts: Record<string, unknown>) => {
  const o = opts as unknown as GroqOptions
  return new ChatGroq({
    model: o.groqModel,
    apiKey: o.groqAPIKey,
    temperature: o.temperature ?? 0.5,
    maxTokens: o.maxTokens ?? 1024,
  })
})

registerProvider('gemini', (opts: Record<string, unknown>) => {
  const o = opts as unknown as GeminiOptions
  return new ChatGoogleGenerativeAI({
    model: o.geminiModel ?? 'gemini-3-pro-preview',
    apiKey: o.geminiAPIKey,
    temperature: o.temperature ?? 0.7,
    maxOutputTokens: o.maxTokens ?? 800,
  })
})

registerProvider('azure', (opts: Record<string, unknown>) => {
  const o = opts as unknown as AzureOptions
  return new AzureChatOpenAI({
    model: o.azureDeploymentName,
    temperature: o.temperature ?? 0.7,
    maxTokens: o.maxTokens ?? 800,
    azureOpenAIApiKey: o.azureAPIKey,
    azureOpenAIEndpoint: o.azureAPIEndpoint,
    azureOpenAIApiDeploymentName: o.azureDeploymentName,
    azureOpenAIApiVersion: o.azureAPIVersion ?? '2024-10-01',
  })
})
