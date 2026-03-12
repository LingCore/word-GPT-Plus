import { defineStore } from 'pinia'
import { ref } from 'vue'

import { createGeneralTools, type GeneralToolName } from '@/utils/generalTools'
import { createWordTools, type WordToolName } from '@/utils/wordTools'

const ALL_WORD_TOOLS: WordToolName[] = [
  'getSelectedText',
  'getDocumentContent',
  'insertText',
  'replaceSelectedText',
  'appendText',
  'insertParagraph',
  'formatText',
  'searchAndReplace',
  'getDocumentProperties',
  'insertTable',
  'insertList',
  'deleteText',
  'clearFormatting',
  'setFontName',
  'insertPageBreak',
  'getRangeInfo',
  'selectText',
  'insertImage',
  'getTableInfo',
  'insertBookmark',
  'goToBookmark',
  'insertContentControl',
  'findText',
]

const ALL_GENERAL_TOOLS: GeneralToolName[] = ['fetchWebContent', 'searchWeb', 'getCurrentDate', 'calculateMath']

const STORAGE_KEY_WORD = 'enabledWordTools'
const STORAGE_KEY_GENERAL = 'enabledGeneralTools'

function loadFromStorage<T extends string>(key: string, allValues: T[]): T[] {
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      return parsed.filter((name: string) => allValues.includes(name as T))
    } catch {
      return [...allValues]
    }
  }
  return [...allValues]
}

export const useToolPrefsStore = defineStore('toolPrefs', () => {
  const enabledWordTools = ref<WordToolName[]>(loadFromStorage(STORAGE_KEY_WORD, ALL_WORD_TOOLS))
  const enabledGeneralTools = ref<GeneralToolName[]>(loadFromStorage(STORAGE_KEY_GENERAL, ALL_GENERAL_TOOLS))

  function saveWordTools() {
    localStorage.setItem(STORAGE_KEY_WORD, JSON.stringify(enabledWordTools.value))
  }

  function saveGeneralTools() {
    localStorage.setItem(STORAGE_KEY_GENERAL, JSON.stringify(enabledGeneralTools.value))
  }

  function toggleWordTool(name: WordToolName) {
    const idx = enabledWordTools.value.indexOf(name)
    if (idx >= 0) {
      enabledWordTools.value.splice(idx, 1)
    } else {
      enabledWordTools.value.push(name)
    }
    saveWordTools()
  }

  function toggleGeneralTool(name: GeneralToolName) {
    const idx = enabledGeneralTools.value.indexOf(name)
    if (idx >= 0) {
      enabledGeneralTools.value.splice(idx, 1)
    } else {
      enabledGeneralTools.value.push(name)
    }
    saveGeneralTools()
  }

  function setWordTools(tools: WordToolName[]) {
    enabledWordTools.value = tools
    saveWordTools()
  }

  function setGeneralTools(tools: GeneralToolName[]) {
    enabledGeneralTools.value = tools
    saveGeneralTools()
  }

  function getActiveTools() {
    const wordTools = createWordTools(enabledWordTools.value)
    const generalTools = createGeneralTools(enabledGeneralTools.value)
    return [...generalTools, ...wordTools]
  }

  function isWordToolEnabled(name: WordToolName): boolean {
    return enabledWordTools.value.includes(name)
  }

  function isGeneralToolEnabled(name: GeneralToolName): boolean {
    return enabledGeneralTools.value.includes(name)
  }

  return {
    enabledWordTools,
    enabledGeneralTools,
    allWordTools: ALL_WORD_TOOLS,
    allGeneralTools: ALL_GENERAL_TOOLS,
    toggleWordTool,
    toggleGeneralTool,
    setWordTools,
    setGeneralTools,
    getActiveTools,
    isWordToolEnabled,
    isGeneralToolEnabled,
    saveWordTools,
    saveGeneralTools,
  }
})
