<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: String, default: '460px' },
  closable: { type: Boolean, default: true },
})

const emit = defineEmits(['close'])

function onKeydown(event) {
  if (event.key === 'Escape' && props.open && props.closable) emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(25,63,82,0.35)] px-6"
      @click.self="closable && emit('close')"
    >
      <div
        class="flex max-h-[86vh] flex-col overflow-hidden rounded-[32px] bg-pill-bg shadow-[0_24px_64px_rgba(25,63,82,0.28)]"
        :style="{ width }"
      >
        <header v-if="title" class="flex items-center justify-between gap-4 px-7 pt-6 pb-2">
          <h2 class="text-lg font-bold text-pill-text">{{ title }}</h2>
          <button
            type="button"
            class="flex size-8 items-center justify-center rounded-full text-pill-text transition hover:bg-[rgba(25,63,82,0.08)] disabled:opacity-30"
            :disabled="!closable"
            @click="emit('close')"
          >
            <Icon icon="mdi:close" width="20" />
          </button>
        </header>
        <div class="layer-scroll min-h-0 flex-1 overflow-auto px-7 pt-2 pb-6 text-sm font-bold text-pill-text">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="flex items-center justify-end gap-3 px-7 pb-6">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>
