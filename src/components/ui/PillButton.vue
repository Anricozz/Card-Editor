<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40"
    :class="{
      'bg-brand-green text-white hover:brightness-105': variant === 'primary',
      'bg-[rgba(25,63,82,0.08)] text-pill-text hover:bg-[rgba(25,63,82,0.14)]': variant === 'ghost',
      'bg-[#C0554A] text-white hover:brightness-105': variant === 'danger',
    }"
  >
    <slot />
  </button>
</template>
