<script setup>
import { Icon } from '@iconify/vue'
import { useModals } from '../../composables/useModals'

const { toasts } = useModals()

const ICONS = {
  info: 'mdi:check-circle-outline',
  error: 'mdi:alert-circle-outline',
}
</script>

<template>
  <Teleport to="body">
    <div class="pointer-events-none fixed inset-x-0 bottom-8 z-[60] flex flex-col items-center gap-2">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-center gap-2 rounded-full bg-pill-bg px-5 py-2.5 text-sm font-bold text-pill-text shadow-[0_12px_32px_rgba(25,63,82,0.22)]"
      >
        <Icon :icon="ICONS[toast.type] || ICONS.info" width="18" />
        <span>{{ toast.message }}</span>
      </div>
    </div>
  </Teleport>
</template>
