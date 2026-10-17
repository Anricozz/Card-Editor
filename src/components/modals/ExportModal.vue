<script setup>
import { computed, ref, watch } from 'vue'
import { EXPORT_OPTIONS } from '../../constants/card'
import { COPY } from '../../constants/copy'
import { getCanvasState } from '../../composables/useCanvas'
import { useModals } from '../../composables/useModals'
import { buildExportFilename, exportCard } from '../../services/exporter'
import PillButton from '../ui/PillButton.vue'
import PillModal from '../ui/PillModal.vue'

const canvasState = getCanvasState()
const { modals, closeModal, showToast } = useModals()

const filename = ref(buildExportFilename())
const busy = ref(false)

watch(
  () => modals.export,
  (isOpen) => {
    if (!isOpen) return
    filename.value = buildExportFilename()
    busy.value = false
  },
  { flush: 'post' },
)

const sizeLabel = computed(() => `${canvasState.width} × ${canvasState.height} px`)
const formatLabel = computed(() => `JPG（${EXPORT_OPTIONS.extension.toUpperCase()}）`)

async function onDownload() {
  if (busy.value) return
  busy.value = true
  try {
    const result = await exportCard({ filename: filename.value })
    showToast(`已匯出 ${result.filename}`)
    closeModal('export')
  } catch (err) {
    console.error(err)
    showToast(COPY.toast.exportFailed, { type: 'error' })
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <PillModal :open="modals.export" :title="COPY.exportModal.title" width="440px" @close="closeModal('export')">
    <dl class="space-y-3">
      <div class="flex items-center justify-between">
        <dt class="opacity-70">{{ COPY.exportModal.sizeLabel }}</dt>
        <dd>{{ sizeLabel }}</dd>
      </div>
      <div class="flex items-center justify-between">
        <dt class="opacity-70">{{ COPY.exportModal.formatLabel }}</dt>
        <dd>{{ formatLabel }}</dd>
      </div>
      <div class="flex items-center justify-between">
        <dt class="opacity-70">{{ COPY.exportModal.dpiLabel }}</dt>
        <dd>{{ EXPORT_OPTIONS.dpi }} dpi</dd>
      </div>
    </dl>

    <label class="mt-5 block text-xs font-bold text-pill-text opacity-70">
      {{ COPY.exportModal.filenameLabel }}
    </label>
    <div class="mt-2 flex items-center gap-2 rounded-full bg-white px-4 py-2.5">
      <input
        v-model="filename"
        type="text"
        class="min-w-0 flex-1 bg-transparent text-sm font-bold text-brand-ink outline-none"
        :disabled="busy"
      />
      <span class="text-xs font-bold text-pill-text opacity-60">.{{ EXPORT_OPTIONS.extension }}</span>
    </div>

    <template #footer>
      <PillButton variant="ghost" :disabled="busy" @click="closeModal('export')">
        {{ COPY.exportModal.cancel }}
      </PillButton>
      <PillButton :disabled="busy" @click="onDownload">
        {{ busy ? COPY.exportModal.exporting : COPY.exportModal.download }}
      </PillButton>
    </template>
  </PillModal>
</template>
