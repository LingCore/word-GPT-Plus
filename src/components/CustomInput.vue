<template>
  <div class="flex flex-col">
    <div class="mb-1 flex items-center gap-2">
      <label class="text-sm font-semibold text-secondary"
        >{{ props.title }}
        <span v-if="props.required" class="ml-1 text-danger">*</span>
      </label>
      <slot name="title-extra"></slot>
    </div>
    <div class="relative flex w-full gap-2">
      <input
        v-model="modelValue"
        :type="type"
        v-bind="$attrs"
        class="box-border h-8 min-w-0 flex-1 rounded-md border border-border bg-bg-tertiary px-2 py-1.5 pr-10 text-sm text-main transition-all duration-200 ease-apple focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        :placeholder="props.placeholder"
      />
      <button
        v-if="props.isPassword"
        type="button"
        class="absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center text-main"
        @click="type = type === 'password' ? 'text' : 'password'"
      >
        <EyeIcon v-if="type === 'password'" class="text-accent" :size="16" />
        <EyeClosedIcon v-else class="text-accent" :size="16" />
      </button>
      <slot name="input-extra"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EyeClosedIcon, EyeIcon } from 'lucide-vue-next'
import { ref, watchEffect } from 'vue'

const [modelValue, modifiers] = defineModel<string | number>({
  set(value) {
    let result = value
    if (modifiers.trim && typeof result === 'string') {
      result = result.trim()
    }
    if (modifiers.number) {
      const n = parseFloat(String(result))
      result = isNaN(n) ? result : n
    }
    return result
  },
})

const type = ref('text')

const props = defineProps<{
  isPassword?: boolean
  title: string
  inputType?: string
  placeholder: string
  required?: boolean
}>()

defineOptions({
  inheritAttrs: false,
})

watchEffect(() => {
  type.value = props.isPassword ? 'password' : (props.inputType ?? 'text')
})
</script>
