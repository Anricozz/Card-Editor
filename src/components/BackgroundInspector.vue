<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { COPY } from '../constants/copy'
import { isAcceptedFile, readFileAsDataURL } from '../services/importer'
import { getCanvasState } from '../composables/useCanvas'
import { useBackground } from '../composables/useBackground'
import { useModals } from '../composables/useModals'

const canvasState = getCanvasState()
const background = useBackground()
const { openModal, showToast } = useModals()
const fileInput = ref(null)

function triggerReplace() {
  fileInput.value?.click()
}

async function onFile(event) {
  const [file] = Array.from(event.target.files || [])
  event.target.value = ''
  if (!file) return
  if (!isAcceptedFile(file)) {
    showToast(COPY.toast.onlyImages, { type: 'error' })
    return
  }
  const dataURL = await readFileAsDataURL(file)
  openModal('crop', { dataURL, mode: 'background', layerId: null })
}
</script>

<template>
  <section class="border-b border-canvas-line px-4 py-3">
    <div class="flex items-center gap-2 text-xs font-bold text-pill-text">
      <Icon icon="mdi:image-outline" width="16" />
      <span>{{ COPY.canvas.background }}</span>
    </div>

    <div v-if="canvasState.hasBackground" class="mt-3 flex items-center gap-3">
      <img
        v-if="background.thumb.value"
        :src="background.thumb.value"
        alt="卡面背景"
        class="size-14 rounded-xl border border-canvas-line bg-white object-cover"
      />
      <div v-else class="flex size-14 items-center justify-center rounded-xl border border-canvas-line bg-white">
        <Icon icon="mdi:image-outline" width="20" class="text-brand-ink/60" />
      </div>
      <div class="flex flex-1 flex-wrap gap-2">
        <button
          type="button"
          class="rounded-full bg-[rgba(25,63,82,0.08)] px-4 py-1.5 text-xs font-bold text-pill-text transition hover:bg-[rgba(25,63,82,0.14)]"
          @click="triggerReplace"
        >
          {{ COPY.panel.replace }}
        </button>
        <button
          type="button"
          class="rounded-full bg-[rgba(192,85,74,0.12)] px-4 py-1.5 text-xs font-bold text-[#C0554A] transition hover:bg-[rgba(192,85,74,0.2)]"
          @click="background.remove"
        >
          {{ COPY.panel.remove }}
        </button>
      </div>
    </div>

    <p v-else class="mt-3 text-xs font-bold text-pill-text/70">{{ COPY.panel.noBackground }}</p>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png" class="hidden" @change="onFile" />
  </section>
</template>
