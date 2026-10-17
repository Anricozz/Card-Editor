<script setup>
import { COPY } from '../../constants/copy'
import { useModals } from '../../composables/useModals'
import PillButton from '../ui/PillButton.vue'
import PillModal from '../ui/PillModal.vue'

const { modals, closeModal } = useModals()
</script>

<template>
  <PillModal
    :open="modals.statement"
    :title="COPY.statement.title"
    width="360px"
    @close="closeModal('statement')"
  >
    <div class="py-6 text-center text-3xl font-bold tracking-[0.3em] text-pill-text">
      {{ COPY.statement.body }}
    </div>
    <template #footer>
      <PillButton @click="closeModal('statement')">{{ COPY.statement.close }}</PillButton>
    </template>
  </PillModal>
</template>
