import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { createAgent } from 'langchain'

import { getCheckpointer } from './checkpointRuntime'
import { createModel } from './providerRegistry'
import type { ProviderOptions } from './types'

async function executeChatFlow(model: BaseChatModel, options: ProviderOptions): Promise<void> {
  try {
    if (!options.threadId) {
      options.threadId = crypto.randomUUID()
    }

    const agent = createAgent({
      model,
      tools: [],
      checkpointer: getCheckpointer(),
    })

    const stream = await agent.stream(
      { messages: options.messages },
      {
        signal: options.abortSignal,
        configurable: { thread_id: options.threadId },
        streamMode: 'messages',
      },
    )

    let fullContent = ''
    for await (const chunk of stream) {
      if (options.abortSignal?.aborted) break

      const content = typeof chunk[0].content === 'string' ? chunk[0].content : ''
      fullContent += content
      options.onStream(fullContent)
    }
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AbortError' || options.abortSignal?.aborted)) {
      throw error
    }
    const message = error instanceof Error ? error.message : String(error)
    options.errorIssue.value = message || true
    console.error('[chatService]', error)
  } finally {
    options.loading.value = false
  }
}

export async function getChatResponse(options: ProviderOptions): Promise<void> {
  const model = createModel(options.provider, options as unknown as Record<string, unknown>)
  return executeChatFlow(model, options)
}
