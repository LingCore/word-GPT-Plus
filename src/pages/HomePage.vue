<template>
  <CheckPointsPage
    v-if="showCheckpoints"
    :thread-id="session.threadId"
    :saver="session.saver"
    :current-checkpoint-id="session.currentCheckpointId"
    @close="showCheckpoints = false"
    @restore="onRestore"
    @select-thread="onSelectThread"
  />
  <div
    v-show="!showCheckpoints"
    class="itemse-center relative flex h-full w-full flex-col justify-center bg-bg-secondary p-1"
  >
    <div class="relative flex h-full w-full flex-col gap-1 rounded-md">
      <!-- Header -->
      <div class="flex justify-between rounded-sm p-1">
        <div class="flex flex-1 items-center gap-2 text-accent">
          <Sparkles :size="18" />
          <span class="text-sm font-semibold text-main">Word GPT+</span>
        </div>
        <div class="flex items-center gap-1 rounded-md border border-accent/10">
          <CustomButton
            :title="t('newChat')"
            :icon="Plus"
            text=""
            type="secondary"
            class="border-none p-1!"
            :icon-size="18"
            @click="onNewChat"
          />
          <CustomButton
            :title="t('settings')"
            :icon="Settings"
            text=""
            type="secondary"
            class="border-none p-1!"
            :icon-size="18"
            @click="goToSettings"
          />
          <CustomButton
            :title="t('checkPoints')"
            :icon="History"
            text=""
            type="secondary"
            class="border-none p-1!"
            :icon-size="18"
            @click="showCheckpoints = true"
          />
        </div>
      </div>

      <!-- Quick Actions Bar -->
      <div class="flex w-full items-center justify-center gap-2 overflow-hidden rounded-md">
        <CustomButton
          v-for="action in quickActions"
          :key="action.key"
          :title="action.label"
          text=""
          :icon="action.icon"
          type="secondary"
          :icon-size="16"
          class="shrink-0! bg-surface! p-1.5!"
          :disabled="session.loading"
          @click="applyQuickAction(action.key)"
        />
        <SingleSelect
          v-model="prompts.selectedPromptId"
          :key-list="prompts.savedPrompts.map(prompt => prompt.id)"
          :placeholder="t('selectPrompt')"
          title=""
          :fronticon="false"
          class="max-w-xs! flex-1! bg-surface! text-xs!"
          @change="onPromptChange"
        >
          <template #item="{ item }">
            {{ prompts.savedPrompts.find(prompt => prompt.id === item)?.name || item }}
          </template>
        </SingleSelect>
      </div>

      <!-- Chat Messages Container -->
      <div
        ref="messagesContainer"
        class="flex flex-1 flex-col gap-4 overflow-y-auto rounded-md border border-border-secondary bg-surface p-2 shadow-sm"
      >
        <div
          v-if="session.history.length === 0"
          class="flex h-full flex-col items-center justify-center gap-4 p-8 text-center text-accent"
        >
          <Sparkles :size="32" />
          <p class="font-semibold text-main">
            {{ $t('emptyTitle') }}
          </p>
          <p class="text-xs font-semibold text-secondary">
            {{ $t('emptySubtitle') }}
          </p>
        </div>

        <div
          v-for="(msg, index) in session.displayHistory"
          :key="(msg as MessageWithId).id || index"
          class="group flex items-end gap-4 [.user]:flex-row-reverse"
          :class="msg instanceof AIMessage ? 'assistant' : 'user'"
        >
          <div
            class="flex min-w-0 flex-1 flex-col gap-1 group-[.assistant]:items-start group-[.assistant]:text-left group-[.user]:items-end group-[.user]:text-left"
          >
            <div
              class="group max-w-[95%] rounded-md border border-border-secondary p-1 text-sm leading-[1.4] wrap-break-word whitespace-pre-wrap text-main/90 shadow-sm group-[.assistant]:bg-bg-tertiary group-[.assistant]:text-left group-[.user]:bg-accent/10"
            >
              <template v-for="(segment, idx) in renderSegments(msg)" :key="idx">
                <span v-if="segment.type === 'text'">{{ segment.text.trim() }}</span>
                <details v-else class="mb-1 rounded-sm border border-border-secondary bg-bg-secondary">
                  <summary class="cursor-pointer list-none p-1 text-sm font-semibold text-secondary">
                    Thought process
                  </summary>
                  <pre class="m-0 p-1 text-xs wrap-break-word whitespace-pre-wrap text-secondary">{{
                    segment.text.trim()
                  }}</pre>
                </details>
              </template>
            </div>
            <div v-if="msg instanceof AIMessage" class="flex gap-1">
              <CustomButton
                :title="t('replaceSelectedText')"
                text=""
                :icon="FileText"
                type="secondary"
                class="bg-surface! p-1.5! text-secondary!"
                :icon-size="12"
                @click="insertToDocument(cleanMessageText(msg), 'replace')"
              />
              <CustomButton
                :title="t('appendToSelection')"
                text=""
                :icon="Plus"
                type="secondary"
                class="bg-surface! p-1.5! text-secondary!"
                :icon-size="12"
                @click="insertToDocument(cleanMessageText(msg), 'append')"
              />
              <CustomButton
                :title="t('copyToClipboard')"
                text=""
                :icon="Copy"
                type="secondary"
                class="bg-surface! p-1.5! text-secondary!"
                :icon-size="12"
                @click="copyToClipboard(cleanMessageText(msg))"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="flex flex-col gap-1 rounded-md">
        <div class="flex items-center justify-between gap-2 overflow-hidden">
          <div class="flex shrink-0 gap-1 rounded-sm border border-border bg-surface p-0.5">
            <button
              class="cursor-po flex h-7 w-7 items-center justify-center rounded-md border-none text-secondary hover:bg-accent/30 hover:text-white! [.active]:text-accent"
              :class="{ active: session.mode === 'ask' }"
              title="Ask Mode"
              @click="session.setMode('ask')"
            >
              <MessageSquare :size="14" />
            </button>
            <button
              class="cursor-po flex h-7 w-7 items-center justify-center rounded-md border-none text-secondary hover:bg-accent/30 hover:text-white! [.active]:text-accent"
              :class="{ active: session.mode === 'agent' }"
              title="Agent Mode"
              @click="session.setMode('agent')"
            >
              <BotMessageSquare :size="17" />
            </button>
          </div>
          <div class="flex min-w-0 flex-1 gap-1 overflow-hidden">
            <select
              v-model="settingForm.api"
              class="h-7 max-w-full min-w-0 cursor-pointer rounded-md border border-border bg-surface p-1 text-xs text-secondary hover:border-accent focus:outline-none disabled:cursor-not-allowed disabled:bg-secondary"
            >
              <option v-for="item in settingPreset.api.optionObj" :key="item.value" :value="item.value">
                {{ item.label.replace('official', 'OpenAI') }}
              </option>
            </select>
            <select
              v-if="currentModelOptions && currentModelOptions.length > 0"
              v-model="currentModelSelect"
              class="h-7 max-w-full min-w-0 cursor-pointer rounded-md border border-border bg-surface p-1 text-xs text-secondary hover:border-accent focus:outline-none"
            >
              <option v-for="item in currentModelOptions" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </div>
        </div>
        <div
          class="flex min-w-12 items-center gap-2 rounded-md border border-border bg-surface p-2 focus-within:border-accent"
        >
          <textarea
            ref="inputTextarea"
            v-model="userInput"
            class="placeholder::text-secondary block max-h-30 flex-1 resize-none overflow-y-auto border-none bg-transparent py-2 text-xs leading-normal text-main outline-none placeholder:text-xs"
            :placeholder="session.mode === 'ask' ? $t('askAnything') : $t('directTheAgent')"
            rows="1"
            @keydown.enter.exact.prevent="sendMessage"
            @input="adjustTextareaHeight"
          />
          <button
            v-if="session.loading"
            class="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-sm border-none bg-danger text-white"
            title="Stop"
            @click="session.stopGeneration()"
          >
            <Square :size="18" />
          </button>
          <button
            v-else
            class="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-sm border-none bg-accent text-white disabled:cursor-not-allowed disabled:bg-accent/50"
            title="Send"
            :disabled="!userInput.trim()"
            @click="sendMessage"
          >
            <Send :size="18" />
          </button>
        </div>
        <div class="flex justify-center gap-3 px-1">
          <label class="flex h-3.5 w-3.5 flex-1 cursor-pointer items-center gap-1 text-xs text-secondary">
            <input v-model="useWordFormatting" type="checkbox" />
            <span>{{ $t('useWordFormattingLabel') }}</span>
          </label>
          <label class="flex h-3.5 w-3.5 flex-1 cursor-pointer items-center gap-1 text-xs text-secondary">
            <input v-model="useSelectedText" type="checkbox" />
            <span>{{ $t('includeSelectionLabel') }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { AIMessage, HumanMessage, type Message, SystemMessage } from '@langchain/core/messages'
import {
  BookOpen,
  BotMessageSquare,
  CheckCircle,
  Copy,
  FileCheck,
  FileText,
  Globe,
  History,
  MessageSquare,
  Plus,
  Send,
  Settings,
  Sparkle,
  Sparkles,
  Square,
} from 'lucide-vue-next'
import { computed, nextTick, onBeforeMount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { insertFormattedResult, insertResult } from '@/api/common'
import { getAgentResponse, getChatResponse } from '@/api/union'
import CustomButton from '@/components/CustomButton.vue'
import SingleSelect from '@/components/SingleSelect.vue'
import { cleanMessageText, renderSegments } from '@/composables'
import { buildProviderConfig } from '@/composables/useProviderConfig'
import CheckPointsPage from '@/pages/checkPointsPage.vue'
import { usePromptStore, useSessionStore, useToolPrefsStore } from '@/stores'
import { checkAuth } from '@/utils/common'
import { buildInPrompt, getBuiltInPrompt } from '@/utils/constant'
import { localStorageKey } from '@/utils/enum'
import { message as messageUtil } from '@/utils/message'
import useSettingForm from '@/utils/settingForm'
import { settingPreset } from '@/utils/settingPreset'

interface MessageWithId extends Message {
  id?: string
}

const router = useRouter()
const { t } = useI18n()

const session = useSessionStore()
const toolPrefs = useToolPrefsStore()
const prompts = usePromptStore()
const settingForm = useSettingForm()

const showCheckpoints = ref(false)
const userInput = ref('')
const messagesContainer = ref<HTMLElement>()
const inputTextarea = ref<HTMLTextAreaElement>()

const useWordFormatting = ref(localStorage.getItem(localStorageKey.useWordFormatting) !== 'false')
const useSelectedText = ref(localStorage.getItem(localStorageKey.useSelectedText) !== 'false')
const insertType = ref<insertTypes>('replace')

watch(useWordFormatting, v => localStorage.setItem(localStorageKey.useWordFormatting, String(v)))
watch(useSelectedText, v => localStorage.setItem(localStorageKey.useSelectedText, String(v)))

const quickActions: {
  key: keyof typeof buildInPrompt
  label: string
  icon: typeof Globe
}[] = [
  { key: 'translate', label: t('translate'), icon: Globe },
  { key: 'polish', label: t('polish'), icon: Sparkle },
  { key: 'academic', label: t('academic'), icon: BookOpen },
  { key: 'summary', label: t('summary'), icon: FileCheck },
  { key: 'grammar', label: t('grammar'), icon: CheckCircle },
]

// --- Model selection (kept local as it's tightly coupled to UI) ---

const getCustomModels = (key: string, oldKey: string): string[] => {
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  const oldModel = localStorage.getItem(oldKey)
  if (oldModel && oldModel.trim()) {
    return [oldModel]
  }
  return []
}

const currentModelOptions = computed(() => {
  let presetOptions: string[] = []
  let customModels: string[] = []

  switch (settingForm.value.api) {
    case 'official':
      presetOptions = settingPreset.officialModelSelect.optionList || []
      customModels = getCustomModels('customModels', 'customModel')
      break
    case 'gemini':
      presetOptions = settingPreset.geminiModelSelect.optionList || []
      customModels = getCustomModels('geminiCustomModels', 'geminiCustomModel')
      break
    case 'ollama':
      presetOptions = settingPreset.ollamaModelSelect.optionList || []
      customModels = getCustomModels('ollamaCustomModels', 'ollamaCustomModel')
      break
    case 'groq':
      presetOptions = settingPreset.groqModelSelect.optionList || []
      customModels = getCustomModels('groqCustomModels', 'groqCustomModel')
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
  set(value) {
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

// --- Navigation ---

function goToSettings() {
  router.push('/settings')
}

function onNewChat() {
  session.startNewChat()
  userInput.value = ''
  prompts.clearSelection()
  adjustTextareaHeight()
}

// --- Prompt handling ---

function onPromptChange() {
  const result = prompts.selectPrompt(prompts.selectedPromptId)
  if (result) {
    userInput.value = result.userPrompt
    adjustTextareaHeight()
    inputTextarea.value?.focus()
  }
}

// --- UI helpers ---

function adjustTextareaHeight() {
  if (inputTextarea.value) {
    inputTextarea.value.style.height = 'auto'
    inputTextarea.value.style.height = Math.min(inputTextarea.value.scrollHeight, 120) + 'px'
  }
}

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// --- Core chat logic ---

function checkApiKey(): boolean {
  const auth = {
    type: settingForm.value.api as supportedPlatforms,
    apiKey: settingForm.value.officialAPIKey,
    azureAPIKey: settingForm.value.azureAPIKey,
    geminiAPIKey: settingForm.value.geminiAPIKey,
    groqAPIKey: settingForm.value.groqAPIKey,
  }
  if (!checkAuth(auth)) {
    messageUtil.error(t('noAPIKey'))
    return false
  }
  return true
}

const agentPrompt = (lang: string) =>
  `
# Role
You are a highly skilled Microsoft Word Expert Agent. Your goal is to assist users in creating, editing, and formatting documents with professional precision.

# Capabilities
- You can interact with the document directly using provided tools (reading text, applying styles, inserting content, etc.).
- You understand document structure, typography, and professional writing standards.

# Guidelines
1. **Tool First**: If a request requires document modification or inspection or web search and fetch, prioritize using the available tools.
2. **Accuracy**: Ensure formatting and content changes are precise and follow the user's intent.
3. **Conciseness**: Provide brief, helpful explanations of your actions.
4. **Language**: You must communicate entirely in ${lang}.

# Safety
Do not perform destructive actions (like clearing the whole document) unless explicitly instructed.
`.trim()

const standardPrompt = (lang: string) =>
  `You are a helpful Microsoft Word specialist. Help users with drafting, brainstorming, and Word-related questions. Reply in ${lang}.`

async function processChat(userMessage: HumanMessage, systemMessage?: string) {
  const { replyLanguage: lang, api: provider } = settingForm.value
  const isAgentMode = session.mode === 'agent'

  const finalSystemMessage =
    prompts.customSystemPrompt || systemMessage || (isAgentMode ? agentPrompt(lang) : standardPrompt(lang))

  const defaultSystemMessage = new SystemMessage(finalSystemMessage)

  session.pushMessage(userMessage)
  const finalMessages = [defaultSystemMessage, ...session.history]

  const currentConfig = buildProviderConfig(settingForm)
  if (!currentConfig) {
    messageUtil.error(t('notSupportedProvider'))
    return
  }

  session.pushMessage(new AIMessage(''))

  if (isAgentMode) {
    const tools = toolPrefs.getActiveTools()

    await getAgentResponse({
      ...(currentConfig as Record<string, unknown>),
      recursionLimit: settingForm.value.agentMaxIterations,
      messages: finalMessages,
      tools,
      errorIssue: session.errorIssue,
      loading: session.loading,
      abortSignal: session.abortController?.signal,
      threadId: session.threadId,
      checkpointId: session.currentCheckpointId,
      onStream: (text: string) => {
        session.updateLastMessage(new AIMessage(text))
        scrollToBottom()
      },
      onToolCall: (toolName: string) => {
        const currentContent = session.getLastMessageText()
        session.updateLastMessage(new AIMessage(currentContent + `\n\n🔧 Calling tool: ${toolName}...`))
        scrollToBottom()
      },
      onToolResult: (toolName: string) => {
        const currentContent = session.getLastMessageText()
        const updatedContent = currentContent.replace(
          `🔧 Calling tool: ${toolName}...`,
          `✅ Tool ${toolName} completed`,
        )
        session.updateLastMessage(new AIMessage(updatedContent))
        scrollToBottom()
      },
    } as Parameters<typeof getAgentResponse>[0])
  } else {
    await getChatResponse({
      ...(currentConfig as Record<string, unknown>),
      messages: finalMessages,
      errorIssue: session.errorIssue,
      loading: session.loading,
      abortSignal: session.abortController?.signal,
      threadId: session.threadId,
      onStream: (text: string) => {
        session.updateLastMessage(new AIMessage(text))
        scrollToBottom()
      },
    } as Parameters<typeof getChatResponse>[0])
  }

  if (session.errorIssue) {
    if (typeof session.errorIssue === 'string') {
      messageUtil.error(t(session.errorIssue))
    } else {
      messageUtil.error(t('somethingWentWrong'))
    }
    session.errorIssue = null
    return
  }

  scrollToBottom()
}

async function sendMessage() {
  if (!userInput.value.trim() || session.loading) return
  if (!checkApiKey()) return

  const userMessage = userInput.value.trim()
  userInput.value = ''
  adjustTextareaHeight()

  let selectedText = ''
  if (useSelectedText.value) {
    selectedText = await Word.run(async ctx => {
      const range = ctx.document.getSelection()
      range.load('text')
      await ctx.sync()
      return range.text
    })
  }

  const fullMessage = new HumanMessage(
    selectedText ? `${userMessage}\n\n[Selected text: "${selectedText}"]` : userMessage,
  )

  scrollToBottom()

  session.loading = true
  session.createAbortController()

  try {
    await processChat(fullMessage, undefined)
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      messageUtil.info(t('generationStop'))
    } else {
      console.error(error)
      messageUtil.error(t('failedToResponse'))
      session.popLastMessage()
    }
  } finally {
    session.loading = false
    session.abortController = null
  }
}

async function applyQuickAction(actionKey: keyof typeof buildInPrompt) {
  if (!checkApiKey()) return

  const selectedText = await Word.run(async ctx => {
    const range = ctx.document.getSelection()
    range.load('text')
    await ctx.sync()
    return range.text
  })

  if (!selectedText) {
    messageUtil.error(t('selectTextPrompt'))
    return
  }

  const builtInPrompts = getBuiltInPrompt()
  const action = builtInPrompts[actionKey]
  const { replyLanguage: lang } = settingForm.value

  const systemMessage = action.system(lang)
  const userMessage = new HumanMessage(action.user(selectedText, lang))

  scrollToBottom()

  session.loading = true
  session.createAbortController()

  try {
    await processChat(userMessage, systemMessage)
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      messageUtil.info(t('generationStop'))
    } else {
      console.error(error)
      messageUtil.error(t('failedToProcessAction'))
      session.popLastMessage()
    }
  } finally {
    session.loading = false
    session.abortController = null
  }
}

// --- Document insertion ---

async function insertToDocument(content: string, type: insertTypes) {
  insertType.value = type
  if (useWordFormatting.value) {
    await insertFormattedResult(content, insertType)
  } else {
    insertResult(content, insertType)
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  messageUtil.success(t('copied'))
}

// --- Checkpoint / thread selection ---

async function onRestore(checkpointId: string) {
  await session.handleRestore(checkpointId)
  showCheckpoints.value = false
  scrollToBottom()
}

async function onSelectThread(newThreadId: string) {
  await session.handleSelectThread(newThreadId)
  showCheckpoints.value = false
  scrollToBottom()
}

// --- Settings watch ---

const addWatch = () => {
  watch(
    () => settingForm.value.replyLanguage,
    () => localStorage.setItem(localStorageKey.replyLanguage, settingForm.value.replyLanguage),
  )
  watch(
    () => settingForm.value.api,
    () => localStorage.setItem(localStorageKey.api, settingForm.value.api),
  )
}

// --- Init ---

onBeforeMount(async () => {
  addWatch()
  insertType.value = (localStorage.getItem(localStorageKey.insertType) as insertTypes) || 'replace'
  prompts.load()
  await session.initFromStorage()
})
</script>
