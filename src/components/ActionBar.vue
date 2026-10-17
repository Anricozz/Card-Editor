<script setup>
import { computed } from 'vue'
import { COPY } from '../constants/copy'
import { useHistory } from '../composables/useHistory'
import { useViewport } from '../composables/useViewport'
import { useModals } from '../composables/useModals'
import { syncFromCanvas } from '../composables/useLayers'
import {
  getCanvas,
  getCanvasState,
  getLayerObjects,
  removeBackground,
  resetLayersForceHidden,
  syncBackgroundState,
} from '../composables/useCanvas'
import IconButton from './ui/IconButton.vue'

const { state: historyState, undo, redo, resetHistory } = useHistory()
const { state: viewportState } = useViewport()
const { askConfirm } = useModals()
const canvasState = getCanvasState()

const cardLabel = computed(() => `${canvasState.width} × ${canvasState.height} px`)

// 清空畫布：二次確認後清除所有圖層與背景，且不進入歷史
async function onClear() {
  const confirmed = await askConfirm({
    title: COPY.confirmClear.title,
    message: COPY.confirmClear.message,
    confirmText: COPY.confirmClear.confirm,
    cancelText: COPY.confirmClear.cancel,
  })
  if (!confirmed) return
  const fc = getCanvas()
  if (fc) {
    fc.discardActiveObject()
    getLayerObjects().forEach((object) => fc.remove(object))
    // 清空畫布等於整張重來，不保留強制隱藏狀態
    removeBackground({ forceHideLayers: false })
    resetLayersForceHidden()
    fc.requestRenderAll()
  }
  syncBackgroundState()
  syncFromCanvas()
  resetHistory()
}
</script>

<template>
  <div class="flex h-12 shrink-0 items-center gap-1 bg-panel-tool px-4">
    <IconButton
      icon="mdi:arrow-left"
      :label="COPY.actions.undo"
      :disabled="!historyState.canUndo"
      @click="undo"
    />
    <IconButton
      icon="mdi:arrow-right"
      :label="COPY.actions.redo"
      :disabled="!historyState.canRedo"
      @click="redo"
    />
    <div class="mx-2 h-6 w-px bg-[rgba(25,63,82,0.16)]"></div>
    <IconButton icon="mdi:reload" :label="COPY.actions.clear" @click="onClear" />

    <div class="ml-auto flex items-center gap-3 text-xs font-bold text-pill-text">
      <span>{{ cardLabel }}</span>
      <span class="rounded-full bg-[rgba(25,63,82,0.08)] px-3 py-1">
        {{ Math.round(viewportState.zoom * 100) }}%
      </span>
    </div>
  </div>
</template>
