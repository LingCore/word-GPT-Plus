# Word GPT Plus Reference

> [!IMPORTANT]
> **Dual-IDE Sync**: This reference file is maintained in both `.cursor/skills/` (for Cursor) and `.agent/skills/` (for Antigravity). When updating one copy, always sync the other to keep them identical.

## Repository Identity

This repository is a Microsoft Word Office add-in. It runs as a task pane web app inside Word, not as a normal standalone web product. That means changes must respect both the Vue frontend architecture and Word add-in constraints such as manifests, `Office.onReady`, WebView2, and sideload workflows.

## Current Architecture

### 1. App bootstrap

- `src/main.ts` mounts Vue only after `window.Office.onReady()`.
- Pinia, router, i18n, and global error tracking are registered here.
- If startup fails in Word, inspect bootstrap and Word host readiness first.

### 2. Page layer

- `src/pages/HomePage.vue` is the main task pane workflow.
- `src/pages/SettingsPage.vue` manages provider settings, prompts, and tool toggles.
- Pages should compose stores/composables/services rather than become a dumping ground for logic.

### 3. Shared state

- `src/stores/sessionStore.ts`
  - owns `threadId`, `mode`, `history`, loading state, abort control, checkpoint selection
  - handles restoring and switching thread history
- `src/stores/toolPrefsStore.ts`
  - owns enabled Word tools and general tools
- `src/stores/promptStore.ts`
  - owns saved prompts, prompt selection, and custom system prompt

If a feature needs persistence across route changes or task pane reloads, the store layer is the first place to look.

### 4. Settings abstraction

- `src/utils/settingPreset.ts` declares setting definitions, defaults, storage keys, custom getters, and custom save handlers.
- `src/utils/settingForm.ts` creates a settings ref from those presets.
- Settings still use a local-storage-backed abstraction. Do not create unrelated new storage patterns unless the refactor explicitly targets this layer.

### 5. AI runtime

- `src/api/providerRegistry.ts`
  - central provider factory registry for OpenAI, Azure, Gemini, Groq, and Ollama
- `src/api/chatService.ts`
  - chat flow execution
- `src/api/agentService.ts`
  - agent flow execution and tool callbacks
- `src/api/types.ts`
  - provider and agent option types
- `src/api/union.ts`
  - compatibility re-export layer; keep working unless intentionally removing legacy imports

When adding a provider or changing provider configuration, update the runtime factory, types, and UI config mapping together.

### 6. Checkpoint persistence

- `src/api/checkpoints.ts` implements the IndexedDB-backed LangGraph saver
- `src/api/checkpointRuntime.ts` exposes the shared singleton checkpointer

Do not paper over checkpoint bugs with page-local hacks. Session and checkpoint issues belong here or in `sessionStore`.

### 7. Word tool system

Word tools are split by capability:

- `src/utils/wordTools/readTools.ts`
- `src/utils/wordTools/writeTools.ts`
- `src/utils/wordTools/formatTools.ts`
- `src/utils/wordTools/navigationTools.ts`
- `src/utils/wordTools/index.ts`
- `src/utils/wordTools.ts` is a compatibility re-export only

Use the narrowest file that matches the capability. If a new tool both reads and mutates, categorize it by primary purpose and document the choice in code if unclear.

### 8. Reusable UI logic

- `src/composables/useMessageRenderer.ts`
  - extracts plain text from LangChain messages and handles `<think>` block rendering
- `src/composables/useProviderConfig.ts`
  - builds provider config from settings

If a page gains reusable parsing, configuration, or orchestration logic, extract a composable instead of growing the page.

### 9. Styling (Tailwind CSS v4)

- `src/index.css` imports Tailwind via `@import 'tailwindcss'` and defines the full design system
- Uses `@tailwindcss/vite` plugin (v4.1.18) — no `tailwind.config.js` needed
- Custom theme tokens defined in `@theme {}` block: colors, shadows, radius, transitions, breakpoints
- Light/dark theme via CSS custom properties on `:root` / `.dark` / `[data-theme='dark']`
- Custom utility `no-scrollbar` defined via `@utility`

When adding styles, use the existing theme tokens (e.g., `bg-surface`, `text-main`, `border-border`) rather than hardcoded values.

### 10. Install and deployment docs

- `docs/安装指南.md` is the teammate-facing install guide
- `release/instant-use/manifest.xml` targets the hosted/public flow
- `release/self-hosted/manifest.xml` targets local or internal server hosting

For self-hosted support, the manifest URL values must match the actual served app URL.

## Preferred Modification Patterns

### Add a new Word tool

1. Choose the correct file under `src/utils/wordTools/`
2. Define the tool schema and executor
3. Export via `src/utils/wordTools/index.ts`
4. If the tool should be user-toggleable, ensure the name is included in `src/stores/toolPrefsStore.ts`
5. Verify agent mode still streams correctly

### Add a new provider or model family

1. Extend `src/api/types.ts`
2. Register model creation in `src/api/providerRegistry.ts`
3. Add UI config mapping in `src/composables/useProviderConfig.ts`
4. Add settings in `src/utils/settingPreset.ts`
5. Surface the settings in `src/pages/SettingsPage.vue`
6. Validate in both chat and agent modes

### Change chat or agent behavior

1. Check whether the behavior belongs in page orchestration, store state, or runtime service
2. Keep transport/runtime logic in `src/api/`
3. Keep persisted session state in `src/stores/sessionStore.ts`
4. Avoid duplicating stream assembly or message mutation logic across pages

### Change install or deployment behavior

1. Update `docs/安装指南.md` if the teammate workflow changed
2. Update the relevant manifest file if URLs or metadata changed
3. If the runtime URL changed, verify Word add-in loading manually
4. If the change only affects the frontend bundle, prefer telling users to rebuild and reload the add-in rather than reinstalling it

## Build, Test, and Debug Workflow

Default commands (use `npx` — `yarn` is not installed globally):

- install: `npm install`
- dev server: `npx vite --port 3000`
- build: `npx vite build`
- tests: `npx vitest run`
- typecheck: `npx tsc --noEmit`
- lint: `npx eslint .`

Suggested validation depth:

- utility/composable change: tests + build
- store/api change: tests + typecheck + build
- broad refactor: tests + typecheck + lint + build
- Word manifest/install change: build + manual Word verification

## Word Update Workflow

When the plugin is already installed in Word:

1. rebuild the frontend (or ensure dev server is running)
2. ensure the app is still being served at the manifest URL (`http://localhost:3000`)
3. reload the task pane in Word (右键加载项 → 重新加载)
4. only reinstall from shared folder if the manifest/catalog setup changed
5. if Vite HMR stops working, kill the dev server process and restart with `npx vite --port 3000`

This matters because reinstalling is slower and usually unnecessary for normal frontend updates.

## Common Pitfalls

- Adding direct `localStorage` writes for shared state instead of using stores
- Putting provider logic back into pages instead of `src/api/` plus composables
- Editing `src/api/union.ts` as if it were the primary implementation layer
- Adding a new Word tool but forgetting to include it in the toggleable tool list
- Changing manifest URLs without updating teammate documentation
- Fixing Word runtime issues without considering Word host startup via `Office.onReady`
- Using `overflow-hidden` on containers with hover effects that use `translate` — this clips the animated elements
- Styling `::-webkit-scrollbar` pseudo-elements in Vue `<style scoped>` or even component-level `<style>` blocks — these are Shadow DOM pseudo-elements and will not match Vue's scoped data attributes. Scrollbar overrides **must** go in `src/index.css` alongside the global scrollbar rules

---

## Modern Code Quality Guide

This section provides concrete patterns and anti-patterns for writing high-quality, maintainable code in this repository. It complements the quick-reference rules in SKILL.md with deeper rationale and examples.

### TypeScript Advanced Patterns

#### Discriminated Unions for Result Types

Use discriminated unions to model operations that can succeed or fail, replacing `any`/`unknown` return + thrown exceptions:

```typescript
// Preferred: discriminated union result type
interface SuccessResult<T> { status: 'success'; data: T }
interface ErrorResult { status: 'error'; error: Error; code?: string }
type Result<T> = SuccessResult<T> | ErrorResult

// Usage — TypeScript narrows automatically
function handleResult(r: Result<string>) {
  if (r.status === 'success') {
    console.log(r.data) // TypeScript knows `data` exists
  } else {
    console.error(r.error) // TypeScript knows `error` exists
  }
}
```

Apply this pattern to:
- AI streaming results in `chatService.ts` / `agentService.ts`
- Word API operation outcomes in `wordTools/`
- Settings load/save operations

#### `satisfies` Over `as`

```typescript
// Bad: loses type safety, allows wrong keys
const presets = { foo: 'bar' } as Record<string, string>

// Good: validates structure without widening
const presets = {
  apiKey: { key: 'apiKey', default: '' },
} satisfies Record<string, SettingPreset>
```

Use `satisfies` in `settingPreset.ts`, provider registry entries, and any config/constant object that should match a known shape.

#### Utility Type Composition

Derive sub-types from base interfaces rather than duplicating fields:

```typescript
interface ProviderConfig {
  name: string
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
}

// Derive a creation payload that omits computed fields
type CreateProviderPayload = Omit<ProviderConfig, 'name'>

// Derive a partial update type
type UpdateProviderPayload = Partial<Pick<ProviderConfig, 'apiKey' | 'baseUrl' | 'model'>>
```

#### Zod for Runtime Validation

The project already uses Zod. Prefer Zod schemas as the single source of truth for runtime shapes, then infer TypeScript types from them:

```typescript
import { z } from 'zod'

const ProviderSettingsSchema = z.object({
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional(),
  model: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
})

type ProviderSettings = z.infer<typeof ProviderSettingsSchema>
```

For discriminated data, use `z.discriminatedUnion()` for performance:

```typescript
const MessageSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal('user'), content: z.string() }),
  z.object({ role: z.literal('assistant'), content: z.string(), toolCalls: z.array(ToolCallSchema).optional() }),
  z.object({ role: z.literal('tool'), content: z.string(), toolCallId: z.string() }),
])
```

### Vue 3 Component Patterns

#### Props & Emits Typing

```vue
<script setup lang="ts">
// Type-based props — full IDE support, no runtime overhead
interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false,
})

// Type-based emits
interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'submit'): void
}
const emit = defineEmits<Emits>()
</script>
```

#### Provide/Inject with InjectionKey

```typescript
// keys.ts
import type { InjectionKey, Ref } from 'vue'

export const ThemeKey: InjectionKey<Ref<'light' | 'dark'>> = Symbol('theme')

// Parent component
provide(ThemeKey, theme)

// Child component — fully typed, no `as` cast needed
const theme = inject(ThemeKey)!
```

#### Template Complexity Threshold

If a `v-if` / `v-for` / ternary combination exceeds ~3 lines in the template, extract it:

```vue
<!-- Bad: hard to read -->
<div :class="mode === 'agent' ? (isLoading ? 'opacity-50' : 'opacity-100') : 'hidden'">

<!-- Good: computed property -->
<div :class="agentVisibilityClass">
```

### Composable Design Patterns

#### Async Composable Template

```typescript
import { type MaybeRefOrGetter, ref, shallowRef, toValue } from 'vue'

export function useFetchData<T>(url: MaybeRefOrGetter<string>) {
  const data = shallowRef<T | null>(null)
  const error = ref<Error | null>(null)
  const isLoading = ref(false)

  async function execute() {
    isLoading.value = true
    error.value = null
    try {
      const res = await fetch(toValue(url))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      data.value = await res.json()
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      isLoading.value = false
    }
  }

  return { data, error, isLoading, execute }
}
```

Key traits:
- Uses `shallowRef` for complex objects (avoids deep reactive overhead)
- Exposes `error` as a ref (consumers decide how to display)
- Accepts `MaybeRefOrGetter` for flexible input
- Named return object (not positional array)

#### Composable Cleanup

```typescript
export function usePolling(callback: () => void, intervalMs: number) {
  let timer: ReturnType<typeof setInterval> | null = null

  function start() {
    stop()
    timer = setInterval(callback, intervalMs)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  onUnmounted(stop)

  return { start, stop }
}
```

### Pinia Store Patterns

#### Setup Store with Explicit Typing

```typescript
export const useSessionStore = defineStore('session', () => {
  const threadId = ref<string | null>(null)
  const history = ref<ChatMessage[]>([])
  const isLoading = ref(false)

  const hasHistory = computed(() => history.value.length > 0)

  async function loadThread(id: string) {
    // Call service layer, not raw fetch
    const result = await sessionService.loadThread(id)
    if (result.status === 'success') {
      threadId.value = id
      history.value = result.data
    }
  }

  function $reset() {
    threadId.value = null
    history.value = []
    isLoading.value = false
  }

  return { threadId, history, isLoading, hasHistory, loadThread, $reset }
})
```

#### Store Composition Safety

```typescript
// In one store, read another store INSIDE actions, not at setup scope
export const useToolPrefsStore = defineStore('toolPrefs', () => {
  function getEnabledTools() {
    const session = useSessionStore() // OK: called inside function body
    if (session.mode === 'agent') {
      return agentTools.value.filter(t => t.enabled)
    }
    return []
  }

  return { getEnabledTools }
})
```

### Word API Patterns

#### Safe Word.run with Typed Errors

```typescript
import type { Result } from '@/api/types'

async function readDocumentText(): Promise<Result<string>> {
  try {
    return await Word.run(async (context) => {
      const body = context.document.body
      body.load('text')
      await context.sync()
      return { status: 'success' as const, data: body.text }
    })
  } catch (error) {
    const officeError = error as OfficeExtension.Error
    return {
      status: 'error' as const,
      error: new Error(officeError.message),
      code: officeError.code,
    }
  }
}
```

#### Batch Proxy Operations

```typescript
// Bad: multiple sync calls
await Word.run(async (context) => {
  const para1 = context.document.body.paragraphs.getFirst()
  para1.load('text')
  await context.sync()
  const para2 = context.document.body.paragraphs.getLast()
  para2.load('text')
  await context.sync()
})

// Good: single sync call
await Word.run(async (context) => {
  const paras = context.document.body.paragraphs
  paras.load('text')
  await context.sync()
  // All paragraphs are now loaded
})
```

### LangChain / AI Runtime Patterns

#### Streaming with Error Recovery

When streaming AI responses, wrap the stream consumer—not the entire flow—so partial results are preserved:

```typescript
async function* streamWithRecovery(stream: AsyncIterable<StreamChunk>) {
  try {
    for await (const chunk of stream) {
      yield chunk
    }
  } catch (error) {
    yield { type: 'error' as const, error: error instanceof Error ? error : new Error(String(error)) }
  }
}
```

#### Tool Definition with Zod

```typescript
import { tool } from '@langchain/core/tools'
import { z } from 'zod'

const readParagraphTool = tool(
  async ({ index }, runManager) => {
    const result = await readParagraph(index)
    if (result.status === 'error') {
      return `Error: ${result.error.message}`
    }
    return result.data
  },
  {
    name: 'read_paragraph',
    description: 'Read a specific paragraph from the Word document by index',
    schema: z.object({
      index: z.number().int().nonneg().describe('Zero-based paragraph index'),
    }),
  },
)
```

### Tailwind CSS v4 Token Design

#### Three-Layer Token Architecture

```css
/* Layer 1: Primitives — raw values, no semantic meaning */
@theme {
  --color-blue-500: oklch(59.59% 0.24 255);
  --color-gray-100: oklch(96.7% 0.003 264);
}

/* Layer 2: Semantic tokens — purpose-driven, theme-switchable */
:root {
  --color-accent: var(--color-blue-500);
  --color-surface: #ffffff;
  --color-text-main: #1a1a1a;
}
.dark {
  --color-accent: var(--color-blue-400);
  --color-surface: #1e1e1e;
  --color-text-main: #e5e5e5;
}

/* Layer 3: Component tokens (when needed) */
:root {
  --btn-primary-bg: var(--color-accent);
  --btn-primary-text: #ffffff;
}
```

#### Adding New Tokens Checklist

1. Add the CSS custom property to both `:root` and `.dark` blocks in `src/index.css`
2. Register in the `@theme {}` block so Tailwind generates utility classes
3. Use the semantic token name in templates (`bg-surface`, not `bg-[#ffffff]`)
4. Verify both light and dark themes render correctly

### Testing Patterns

#### Composable Unit Test

```typescript
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('useProviderConfig', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('builds config from stored settings', () => {
    // Arrange
    localStorage.setItem('provider', 'openai')
    localStorage.setItem('apiKey', 'test-key')

    // Act
    const { config } = useProviderConfig()

    // Assert
    expect(config.value.provider).toBe('openai')
    expect(config.value.apiKey).toBe('test-key')
  })
})
```

#### Component Test with Testing Pinia

```typescript
import { createTestingPinia } from '@pinia/testing'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

describe('HomePage', () => {
  it('shows loading spinner when session is loading', () => {
    const wrapper = mount(HomePage, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              session: { isLoading: true, history: [] },
            },
            createSpy: vi.fn,
          }),
        ],
      },
    })

    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
  })
})
```

#### Mock Boundaries, Not Internals

```typescript
// Bad: mocking internal composable
vi.mock('@/composables/useProviderConfig', () => ({ ... }))

// Good: mock the external boundary (API/IO)
vi.mock('@/api/chatService', () => ({
  sendMessage: vi.fn().mockResolvedValue({ status: 'success', data: 'response' }),
}))
```

### Performance Considerations

#### Vite Build Optimization

- The project already uses manual chunk splitting for `langchain` and `vendor` bundles—maintain this split when adding dependencies.
- Use dynamic `import()` for heavy modules that aren't needed on initial load (e.g., checkpoint management UI).
- Run `npx vite build` and check chunk sizes after adding new dependencies. Keep individual chunks under the 600KB warning limit.

#### Vue Reactivity Performance

- Use `shallowRef` for large arrays/objects that are replaced wholesale (like chat history).
- Avoid `reactive()` for objects with many nested levels—prefer `ref()` with explicit replacement.
- Use `markRaw()` for non-reactive objects stored in reactive state (e.g., AbortController instances).

## Review Checklist

When asked to review code in this repository, check for:

- broken session persistence or lost `threadId`
- provider settings that do not match runtime wiring
- Word API mutations that can damage document content unexpectedly
- page files regaining too much business logic
- missing build/test verification after architecture-touching changes
- add-in installation docs drifting from the actual manifest or runtime flow
- `any` usage where `unknown`, generics, or utility types would suffice
- composables that don't expose error state or don't clean up listeners
- stores that perform IO directly instead of delegating to service layer
- hard-coded colors or spacing values bypassing the design token system
- missing `context.sync()` batching in Word API calls
- empty `catch {}` blocks or errors logged without tracking
- test files that mock internal modules instead of external boundaries
