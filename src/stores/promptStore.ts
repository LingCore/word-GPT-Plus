import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface SavedPrompt {
  id: string
  name: string
  systemPrompt: string
  userPrompt: string
}

const STORAGE_KEY = 'savedPrompts'

export const usePromptStore = defineStore('prompts', () => {
  const savedPrompts = ref<SavedPrompt[]>([])
  const selectedPromptId = ref('')
  const customSystemPrompt = ref('')

  function load() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        savedPrompts.value = JSON.parse(stored)
      } catch {
        savedPrompts.value = []
      }
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPrompts.value))
  }

  function addPrompt(prompt: SavedPrompt) {
    savedPrompts.value.push(prompt)
    save()
  }

  function removePrompt(id: string) {
    savedPrompts.value = savedPrompts.value.filter(p => p.id !== id)
    if (selectedPromptId.value === id) {
      selectedPromptId.value = ''
      customSystemPrompt.value = ''
    }
    save()
  }

  function updatePrompt(id: string, update: Partial<SavedPrompt>) {
    const idx = savedPrompts.value.findIndex(p => p.id === id)
    if (idx >= 0) {
      savedPrompts.value[idx] = { ...savedPrompts.value[idx], ...update }
      save()
    }
  }

  function selectPrompt(id: string): { systemPrompt: string; userPrompt: string } | null {
    selectedPromptId.value = id
    if (!id) {
      customSystemPrompt.value = ''
      return null
    }
    const prompt = savedPrompts.value.find(p => p.id === id)
    if (prompt) {
      customSystemPrompt.value = prompt.systemPrompt
      return { systemPrompt: prompt.systemPrompt, userPrompt: prompt.userPrompt }
    }
    return null
  }

  function clearSelection() {
    selectedPromptId.value = ''
    customSystemPrompt.value = ''
  }

  return {
    savedPrompts,
    selectedPromptId,
    customSystemPrompt,
    load,
    save,
    addPrompt,
    removePrompt,
    updatePrompt,
    selectPrompt,
    clearSelection,
  }
})
