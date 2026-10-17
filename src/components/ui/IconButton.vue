<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  icon: { type: String, required: true },
  label: { type: String, default: '' },
  tone: { type: String, default: 'ink' },
  size: { type: String, default: 'md' },
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  iconSize: { type: [String, Number], default: 22 },
})

const classes = computed(() => [
  'flex items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-30',
  props.size === 'lg' ? 'size-11' : 'size-9',
  props.active
    ? 'bg-brand-green text-white'
    : props.tone === 'light'
      ? 'text-white hover:bg-[rgba(255,255,255,0.16)]'
      : props.tone === 'green'
        ? 'bg-brand-green text-white hover:brightness-105'
        : 'text-brand-ink hover:bg-[rgba(25,63,82,0.08)]',
])
</script>

<template>
  <button type="button" :class="classes" :disabled="disabled" :title="label" :aria-label="label">
    <Icon :icon="icon" :width="iconSize" />
  </button>
</template>
