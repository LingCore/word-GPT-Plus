import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { createAgent } from 'langchain'

import { getCheckpointer } from './checkpointRuntime'
import { createModel } from './providerRegistry'
import type { AgentOptions } from './types'

interface AgentMessage {
  _getType?: () => string
  content?: string | unknown[]
  tool_calls?: Array<{ name: string; args: Record<string, unknown> }>
  name?: string
}

async function executeAgentFlow(model: BaseChatModel, options: AgentOptions): Promise<void> {
  try {
    if (!options.threadId) {
      options.threadId = crypto.randomUUID()
    }

    const agent = createAgent({
      model,
      tools: options.tools || [],
      checkpointer: getCheckpointer(),
    })

    const stream = await agent.stream(
      { messages: options.messages },
      {
        recursionLimit: Number(options.recursionLimit),
        signal: options.abortSignal,
        configurable: {
          thread_id: options.threadId,
          checkpoint_id: options.checkpointId,
        },
        streamMode: 'values',
      },
    )

    let fullContent = ''

    for await (const step of stream) {
      if (options.abortSignal?.aborted) break

      const messages: AgentMessage[] = step.messages || []
      const lastMessage = messages[messages.length - 1]
      if (!lastMessage) continue

      const msg = lastMessage

      if (msg._getType?.() === 'ai' && msg.tool_calls?.length) {
        for (const toolCall of msg.tool_calls) {
          options.onToolCall?.(toolCall.name, toolCall.args)
        }
      }

      if (msg._getType?.() === 'tool') {
        const toolName = msg.name || 'unknown'
        const toolContent = String(msg.content || '')
        options.onToolResult?.(toolName, toolContent)
      }

      if (msg._getType?.() === 'ai' && msg.content) {
        const content = typeof msg.content === 'string' ? msg.content : ''
        if (content && (!msg.tool_calls || msg.tool_calls.length === 0)) {
          fullContent = content
          options.onStream(fullContent)
        }
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === 'AbortError' || options.abortSignal?.aborted) {
        throw error
      }
      if (error.name === 'GraphRecursionError') {
        options.errorIssue.value = 'recursionLimitExceeded'
      }
    }
    console.error(error)
  } finally {
    options.loading.value = false
  }
}

export async function getAgentResponse(options: AgentOptions): Promise<void> {
  const model = createModel(options.provider, options as unknown as Record<string, unknown>)
  return executeAgentFlow(model, options)
}
