import { AIMessage, HumanMessage, Message, SystemMessage } from '@langchain/core/messages'
import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { computed, ref, shallowRef, triggerRef } from 'vue'

import { type CheckpointTuple, IndexedDBSaver } from '@/api/checkpoints'

export const useSessionStore = defineStore('session', () => {
  const threadId = ref(localStorage.getItem('threadId') || uuidv4())
  const mode = ref<'ask' | 'agent'>((localStorage.getItem('chatMode') as 'ask' | 'agent') || 'ask')
  const history = shallowRef<Message[]>([])
  const loading = ref(false)
  const abortController = ref<AbortController | null>(null)
  const currentCheckpointId = ref('')
  const errorIssue = ref<boolean | string | null>(false)
  const initError = ref<Error | null>(null)

  const saver = new IndexedDBSaver()

  const displayHistory = computed(() => history.value.filter(msg => !(msg instanceof SystemMessage)))

  function persistThreadId() {
    localStorage.setItem('threadId', threadId.value)
  }

  function persistMode() {
    localStorage.setItem('chatMode', mode.value)
  }

  function setMode(newMode: 'ask' | 'agent') {
    mode.value = newMode
    persistMode()
  }

  function startNewChat() {
    if (loading.value) {
      stopGeneration()
    }
    history.value = []
    threadId.value = uuidv4()
    currentCheckpointId.value = ''
    persistThreadId()
  }

  function stopGeneration() {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
    loading.value = false
  }

  function createAbortController() {
    abortController.value = new AbortController()
    return abortController.value
  }

  function pushMessage(msg: Message) {
    history.value.push(msg)
    triggerRef(history)
  }

  function updateLastMessage(msg: Message) {
    const lastIndex = history.value.length - 1
    if (lastIndex >= 0) {
      history.value[lastIndex] = msg
      triggerRef(history)
    }
  }

  function popLastMessage() {
    history.value.pop()
    triggerRef(history)
  }

  function getLastMessageText(): string {
    const last = history.value[history.value.length - 1]
    if (!last) return ''
    const content = (last as unknown as { content: unknown }).content
    if (typeof content === 'string') return content
    if (Array.isArray(content)) {
      return content
        .map((part: unknown) => {
          if (typeof part === 'string') return part
          if (part && typeof part === 'object' && 'text' in part && typeof (part as { text: string }).text === 'string')
            return (part as { text: string }).text
          if (part && typeof part === 'object' && 'data' in part && typeof (part as { data: string }).data === 'string')
            return (part as { data: string }).data
          return ''
        })
        .join('')
    }
    return ''
  }

  async function handleRestore(checkpointId: string) {
    currentCheckpointId.value = checkpointId

    const checkpointTuple = await saver.getTuple({
      configurable: { thread_id: threadId.value, checkpoint_id: checkpointId },
    })

    if (checkpointTuple) {
      const messages = checkpointTuple.checkpoint.channel_values.messages
      if (messages && Array.isArray(messages)) {
        history.value = messages
          .filter((msg: { type: string }) => ['human', 'ai'].includes(msg.type))
          .map((msg: { type: string; content: string }) =>
            msg.type === 'human' ? new HumanMessage(msg.content) : new AIMessage(msg.content),
          )
      }
    }
  }

  async function loadThreadHistory(targetThreadId: string) {
    const checkpoints: CheckpointTuple[] = []
    const iterator = saver.list({
      configurable: { thread_id: targetThreadId },
    })

    for await (const checkpoint of iterator) {
      checkpoints.push(checkpoint)
    }

    if (checkpoints.length > 0) {
      checkpoints.sort((a, b) => (a.metadata?.step ?? 0) - (b.metadata?.step ?? 0))

      const latestCheckpoint = checkpoints[checkpoints.length - 1]
      const messages = latestCheckpoint.checkpoint.channel_values.messages
      if (messages && Array.isArray(messages)) {
        history.value = messages
          .filter((msg: { type: string }) => ['human', 'ai'].includes(msg.type))
          .map((msg: { type: string; content: string }) =>
            msg.type === 'human' ? new HumanMessage(msg.content) : new AIMessage(msg.content),
          )
        currentCheckpointId.value = latestCheckpoint.config.configurable?.checkpoint_id || ''
      } else {
        history.value = []
        currentCheckpointId.value = ''
      }
    } else {
      history.value = []
      currentCheckpointId.value = ''
    }
  }

  async function handleSelectThread(newThreadId: string) {
    threadId.value = newThreadId
    persistThreadId()
    await loadThreadHistory(newThreadId)
  }

  async function initFromStorage() {
    if (threadId.value) {
      try {
        await loadThreadHistory(threadId.value)
        initError.value = null
      } catch (e) {
        initError.value = e instanceof Error ? e : new Error(String(e))
        console.error('[sessionStore] Auto reload history failed:', e)
      }
    }
  }

  return {
    threadId,
    mode,
    history,
    loading,
    abortController,
    currentCheckpointId,
    errorIssue,
    initError,
    saver,
    displayHistory,
    setMode,
    startNewChat,
    stopGeneration,
    createAbortController,
    pushMessage,
    updateLastMessage,
    popLastMessage,
    getLastMessageText,
    handleRestore,
    loadThreadHistory,
    handleSelectThread,
    initFromStorage,
    persistThreadId,
  }
})
