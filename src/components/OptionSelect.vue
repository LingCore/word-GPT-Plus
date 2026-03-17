<template>
  <SingleSelect
    v-model="modelValue"
    :tight="tight"
    :key-list="keyList"
    :title="title"
    :fronticon="false"
    :placeholder="displayLabel(String(modelValue ?? ''))"
  >
    <template #item="{ item }">
      {{ displayLabel(item) }}
    </template>
  </SingleSelect>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import SingleSelect from '@/components/SingleSelect.vue'

const modelValue = defineModel<string | number>()

const props = defineProps<{
  options: { label: string; value: string }[]
  title: string
  tight?: boolean
  labelTransform?: (label: string) => string
}>()

const keyList = computed(() => props.options.map(item => item.value))

function displayLabel(value: string): string {
  if (!value) return ''
  const found = props.options.find(option => option.value === value)?.label || value
  return props.labelTransform ? props.labelTransform(found) : found
}
</script>
