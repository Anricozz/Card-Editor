<script setup>
import { useModals } from '../../composables/useModals'
import PillButton from '../ui/PillButton.vue'
import PillModal from '../ui/PillModal.vue'

const { modals, confirmState, resolveConfirm } = useModals()
</script>

<template>
  <PillModal
    :open="modals.confirm"
    :title="confirmState.title"
    width="420px"
    @close="resolveConfirm(false)"
  >
    <p class="py-2 text-sm leading-relaxed font-bold text-pill-text">{{ confirmState.message }}</p>
    <template #footer>
      <PillButton variant="ghost" @click="resolveConfirm(false)">
        {{ confirmState.cancelText }}
      </PillButton>
      <PillButton variant="danger" @click="resolveConfirm(true)">
        {{ confirmState.confirmText }}
      </PillButton>
    </template>
  </PillModal>
</template>
