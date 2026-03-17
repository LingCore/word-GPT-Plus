---
name: word-gpt-plus-maintainer
description: Maintains the Word GPT Plus repository, a Microsoft Word Office add-in built with Vue 3, Vite, TypeScript, Pinia, LangChain, and the Word JavaScript API. Use when modifying features, refactoring pages, adding AI providers or Word tools, fixing Word add-in build/runtime issues, writing teammate-facing install docs, or reviewing changes in this repo.
---
# Word GPT Plus Maintainer

> [!IMPORTANT]
> **Dual-IDE Sync**: This skill file is maintained in both `.cursor/skills/` (for Cursor) and `.agent/skills/` (for Antigravity). When updating one copy, always sync the other to keep them identical.

## Use This Skill When

Use this skill for work inside this repository when the task involves any of the following:

- changing chat, agent, provider, or session behavior
- adding or editing Word document tools
- modifying Word add-in install or sideload instructions
- debugging build, preview, or Word runtime issues
- reviewing maintainability or architectural fit of a change

## Project Defaults

- Treat this as a Word task pane add-in first, then as a Vue app.
- Keep page files focused on view orchestration. Prefer moving logic into `src/stores/`, `src/composables/`, `src/api/`, or `src/utils/`.
- Do not re-introduce large, page-local business logic into `src/pages/HomePage.vue` or `src/pages/SettingsPage.vue`.
- Prefer existing stores over new direct `localStorage` calls. If state is shared or persistent, put it in a Pinia store or the existing settings abstraction.
- Keep backward-compatibility re-export files working unless the task explicitly includes cleanup.

## Fast File Map

- Bootstrap: `src/main.ts`
- Main UI orchestration: `src/pages/HomePage.vue`, `src/pages/SettingsPage.vue`
- Shared state: `src/stores/sessionStore.ts`, `src/stores/toolPrefsStore.ts`, `src/stores/promptStore.ts`
- AI runtime: `src/api/providerRegistry.ts`, `src/api/chatService.ts`, `src/api/agentService.ts`, `src/api/types.ts`
- Checkpoint/session persistence: `src/api/checkpointRuntime.ts`, `src/api/checkpoints.ts`
- Reusable page logic: `src/composables/useMessageRenderer.ts`, `src/composables/useProviderConfig.ts`
- Word tools: `src/utils/wordTools/`
- Settings abstraction: `src/utils/settingForm.ts`, `src/utils/settingPreset.ts`
- User install guide: `docs/安装指南.md`
- Add-in manifests: `release/instant-use/manifest.xml`, `release/self-hosted/manifest.xml`
- Styling: `src/index.css` (Tailwind CSS v4 with `@tailwindcss/vite` plugin, custom theme tokens)

## Change Routing

### If the task is about session/thread behavior

Work in:
- `src/stores/sessionStore.ts`
- `src/api/checkpointRuntime.ts`
- `src/api/checkpoints.ts`

Do not solve thread persistence by page-local refs if the behavior should survive route changes.

### If the task is about provider/model behavior

Work in:
- `src/api/providerRegistry.ts`
- `src/api/types.ts`
- `src/composables/useProviderConfig.ts`
- `src/utils/settingPreset.ts`

If a new provider is added, update all four layers: settings, config building, runtime typing, and model creation.

### If the task is about Word document capabilities

Work in:
- `src/utils/wordTools/readTools.ts`
- `src/utils/wordTools/writeTools.ts`
- `src/utils/wordTools/formatTools.ts`
- `src/utils/wordTools/navigationTools.ts`
- `src/utils/wordTools/index.ts`

Add the tool to the right category file, then export it through `index.ts`. Keep the compatibility re-export in `src/utils/wordTools.ts` working.

### If the task is about prompts or tool preferences

Prefer:
- `src/stores/promptStore.ts`
- `src/stores/toolPrefsStore.ts`

### If the task is about teammate installation or Word sideloading

Start from:
- `docs/安装指南.md`
- `release/self-hosted/manifest.xml`
- `release/instant-use/manifest.xml`

## Validation Checklist

After substantive changes, run the smallest reasonable set below, and expand if the change touches broader behavior:

- `npx vitest run`
- `npx tsc --noEmit`
- `npx eslint .`
- `npx vite build`

For Word add-in runtime or install changes, also verify:

- the app loads at the manifest URL
- Word can still open the task pane
- if only frontend code changed, Word usually needs a panel reload, not full reinstallation

## Dev Server Notes

- Start the dev server: `npx vite --port 3000`
- The self-hosted manifest points to `http://localhost:3000`
- Vite HMR should auto-update on save; if it does not, **kill the dev server and restart it**
- After restarting the dev server, click "重新加载" (Reload) in the Word add-in panel to pick up the changes
- `yarn` is not installed globally; use `npx` commands instead

## UI / Style Conventions

- **No shadows on interactive controls.** Buttons, dropdown triggers, and menu panels rely on `border` for visual separation — do not add `shadow-*` utilities.
- **Unified control height `h-8` (32px).** All primary form controls — `CustomButton`, `CustomInput`, `SingleSelect` trigger — use `h-8`. Square icon-only buttons (e.g. Send, Stop, mode toggles) keep `h-7 w-7`.
- **Dropdown triggers** use the semantic tokens `bg-dropdown-trigger-bg` and `text-dropdown-trigger-text` (defined in `src/index.css`) so they adapt to both light and dark themes automatically.
- **Dropdown panels** use `bg-bg-tertiary` with `border-border-secondary`.
- **Avoid `!important` overrides on component call sites.** Using `bg-surface!` or similar at the call site breaks the component's own hover/focus/active states. If a component needs a visual variant, add it as a prop or `type` inside the component instead. If an `!important` override is truly necessary, ensure the component's interactive states also use `!important`.
- **Secondary button hover = accent (blue).** `CustomButton` type `secondary` hovers to `bg-accent/10!` background + `text-accent!` text/icon. Do not change hover to white.
- When introducing new theme-aware colors, add CSS custom properties to both the light (`:root`) and dark (`.dark`) blocks in `src/index.css`, then register them in the `@theme` block.

## Code Quality Standards

Follow these standards when writing or reviewing code in this repository. They reflect 2025-2026 industry best practices, tailored to this project's Vue 3 + TypeScript + Office Add-in stack.

### TypeScript Discipline

- **Strict mode is mandatory.** The project uses `"strict": true`; never weaken it.
- **Eliminate `any`.** Use `unknown` + type narrowing, utility types (`Partial`, `Omit`, `Pick`, `Record`, `ReturnType`, `Awaited`), or Zod schemas instead. The ESLint rule `@typescript-eslint/no-explicit-any` is already set to `warn`—treat warnings as errors in new code.
- **Prefer discriminated unions** for state that has multiple shapes (e.g., loading/success/error results). Use a literal `status` or `kind` field as the discriminator.
- **Use `satisfies`** to validate object literals against types without widening. Prefer `satisfies T` over `as T` for config objects and presets.
- **Type composable return values explicitly.** Even though TypeScript can infer them, explicit return types serve as documentation and catch accidental API changes.
- **Prefer `interface` for public contracts, `type` for unions/intersections/utilities.** This aligns with TypeScript team recommendations and produces clearer error messages.

### Vue Component Patterns

- **Always use `<script setup lang="ts">`** with type-based `defineProps<T>()` and `defineEmits<T>()`. Never use runtime-only prop declarations.
- **One concern per component.** If a component handles both data-fetching and rendering, extract the data logic into a composable.
- **Template refs must be typed**: `const el = ref<HTMLDivElement | null>(null)`.
- **Avoid deep prop drilling.** For state shared by 3+ levels, use Pinia stores or `provide`/`inject` with `InjectionKey<T>` for type safety.
- **Keep `<template>` readable.** Extract complex expressions into `computed` properties or methods rather than embedding multi-line ternaries in templates.

### Composable Quality

- **Single responsibility.** Each composable owns one concern (e.g., `useProviderConfig` builds config, `useMessageRenderer` renders messages).
- **Return shape convention.** Return an object with named properties (not positional arrays). Include `error` and `isLoading` refs for async composables.
- **Accept flexible inputs.** Use `MaybeRefOrGetter<T>` (from `@vueuse/core`) for parameters that callers might pass as refs, getters, or plain values.
- **Lifecycle cleanup.** If a composable sets up listeners, timers, or subscriptions, clean them up in `onUnmounted` or via `watchEffect`'s cleanup callback.
- **No side effects at import time.** All side effects should happen inside the composable function body, not at the module top level.

### Pinia Store Quality

- **Use Setup Store syntax** (`defineStore('name', () => { ... })`) for maximum type inference and composability.
- **Feature-scoped stores.** One store per domain (sessions, prompts, tool prefs)—never a monolithic global store.
- **Destructure with `storeToRefs()`.** Destructuring without it loses reactivity.
- **Keep API/IO calls out of stores.** Stores call service functions from `src/api/`; they don't import `fetch` or `Word.run` directly.
- **Avoid cross-store reads in setup scope.** Read other stores inside actions/getters to prevent initialization-order bugs.

### Error Handling

- **Word API**: Always wrap `Word.run` calls in try-catch. Inspect `error.code` (from `OfficeExtension.ErrorCodes`) rather than parsing `error.message`. Batch proxy operations with minimal `context.sync()` calls.
- **LangChain/AI runtime**: Surface streaming and tool errors through structured result objects (`{ status, data?, error? }`), not thrown exceptions that break the stream.
- **Composables**: Expose error state via a `Ref<Error | null>` rather than logging internally. Let consuming components decide how to display errors.
- **Never swallow errors silently.** Empty `catch {}` blocks are prohibited. At minimum, track errors via `errorTracker`.

### Styling (Tailwind CSS v4)

- **Use the three-layer token hierarchy**: primitives → semantic → component tokens, all defined in `src/index.css` via `@theme` and CSS custom properties.
- **Never hard-code color values** in templates or `<style>` blocks. Use existing semantic tokens (`bg-surface`, `text-main`, `border-border`) or define new ones in both `:root` and `.dark` blocks.
- **Scrollbar and pseudo-element styles** go in `src/index.css` only—they don't work under Vue's `scoped` attribute.

### Testing

- **Test composables and utils in isolation.** Use `setActivePinia(createPinia())` for store-dependent tests. Use `@pinia/testing`'s `createTestingPinia()` for component tests.
- **Name test files with `.test.ts` suffix**, co-located under `__tests__/` next to the module they test.
- **Follow Arrange-Act-Assert.** Each test should clearly set up state, perform one action, and assert the outcome.
- **Mock external boundaries** (Office API, network, IndexedDB) but avoid mocking internal modules—test through their public API instead.

### Import & Module Organization

- **Imports are auto-sorted by `simple-import-sort`.** Don't fight the sort order; let the ESLint auto-fix handle it.
- **Use `@/` path alias** for all cross-directory imports within `src/`.
- **Barrel exports** (`index.ts`) are fine for stores and composables. Avoid barrel exports for large utility collections where tree-shaking matters.
- **Circular dependency detection** is enforced via `dpdm`. Run `npm run lint:dpdm` when restructuring modules.

## Review Standard

When reviewing changes in this repo, prioritize:

1. session persistence regressions
2. provider/config mismatches across settings and runtime
3. Word tool safety and document mutation risks
4. reintroduction of `any`, page bloat, or scattered storage logic
5. missing validation for build/test/install flows
6. composable/store violations (side effects at import time, missing cleanup, lost reactivity)
7. error handling gaps (swallowed errors, untyped catch blocks, missing error state exposure)
8. hard-coded style values bypassing the design token system

## Additional Reference

For deeper architecture and task-by-task guidance, read [reference.md](reference.md).
