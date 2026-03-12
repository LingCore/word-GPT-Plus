import type { StructuredToolInterface } from '@langchain/core/tools'
import type { Messages } from '@langchain/langgraph'
import type { Ref } from 'vue'

export interface BaseChatCompletionOptions {
  messages: Messages
  errorIssue: Ref<boolean | string | null>
  loading: Ref<boolean>
  maxTokens?: number
  temperature?: number
  abortSignal?: AbortSignal
  threadId: string
  onStream: (text: string) => void
}

export interface OpenAIOptions extends BaseChatCompletionOptions {
  provider: 'official'
  model?: string
  config: {
    apiKey: string
    baseURL?: string
    dangerouslyAllowBrowser?: boolean
  }
}

export interface OllamaOptions extends BaseChatCompletionOptions {
  provider: 'ollama'
  ollamaModel: string
  ollamaEndpoint?: string
}

export interface GroqOptions extends BaseChatCompletionOptions {
  provider: 'groq'
  groqModel: string
  groqAPIKey: string
}

export interface GeminiOptions extends BaseChatCompletionOptions {
  provider: 'gemini'
  geminiModel?: string
  geminiAPIKey: string
}

export interface AzureOptions extends BaseChatCompletionOptions {
  provider: 'azure'
  azureAPIKey: string
  azureAPIEndpoint: string
  azureDeploymentName: string
  azureAPIVersion?: string
}

export type ProviderOptions = OpenAIOptions | OllamaOptions | GroqOptions | GeminiOptions | AzureOptions

export type SupportedProvider = 'official' | 'ollama' | 'groq' | 'gemini' | 'azure'

export interface AgentOptions extends BaseChatCompletionOptions {
  provider: SupportedProvider
  tools?: StructuredToolInterface[]
  onToolCall?: (toolName: string, args: Record<string, unknown>) => void
  onToolResult?: (toolName: string, result: string) => void
  recursionLimit?: number
  checkpointId?: string
  model?: string
  config?: {
    apiKey: string
    baseURL?: string
    dangerouslyAllowBrowser?: boolean
  }
  ollamaModel?: string
  ollamaEndpoint?: string
  groqModel?: string
  groqAPIKey?: string
  geminiModel?: string
  geminiAPIKey?: string
  azureAPIKey?: string
  azureAPIEndpoint?: string
  azureDeploymentName?: string
  azureAPIVersion?: string
}
