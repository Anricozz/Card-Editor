<script setup>
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { COPY } from '../constants/copy'
import { getCanvasState } from '../composables/useCanvas'
import { useLayers } from '../composables/useLayers'
import { useModals } from '../composables/useModals'
import BackgroundInspector from './BackgroundInspector.vue'
import LayerRow from './LayerRow.vue'
import IconButton from './ui/IconButton.vue'

const canvasState = getCanvasState()
const layersApi = useLayers()
const { openModal, showToast } = useModals()

const fileInput = ref(null)

const selectedIds = computed(() => layersApi.state.selectedIds)
const canImport = computed(() => canvasState.hasBackground)
const canUpscale = computed(() => canvasState.hasBackground || selectedIds.value.length > 0)
const singleSelected = computed(() => selectedIds.value.length === 1)
const hasSelection = computed(() => selectedIds.value.length > 0)

function triggerImport() {
  if (!canImport.value) {
    showToast(COPY.toast.importNeedsBackground, { type: 'error' })
    return
  }
  fileInput.value?.click()
}

async function onFiles(event) {
  // 注意：FileList 是 live 的，必須先複製成陣列再清空 input
  const files = Array.from(event.target.files || [])
  event.target.value = ''
  if (!files.length) return
  const result = await layersApi.importFiles(files)
  if (result.blocked) return
  if (result.rejected) showToast(COPY.toast.onlyImages, { type: 'error' })
  if (result.added) showToast(COPY.toast.imported(result.added))
}

function openUpscale() {
  if (!canUpscale.value) {
    showToast(COPY.toast.noBackground, { type: 'error' })
    return
  }
  openModal('upscale')
}

function onSelect(layer, event) {
  const additive = event.shiftKey || event.ctrlKey || event.metaKey
  layersApi.selectLayer(layer.id, { additive })
}

function moveUp() {
  if (!singleSelected.value) return
  layersApi.moveLayer(selectedIds.value[0], 1)
}

function moveDown() {
  if (!singleSelected.value) return
  layersApi.moveLayer(selectedIds.value[0], -1)
}

function duplicate() {
  if (!singleSelected.value) return
  layersApi.duplicateLayer(selectedIds.value[0])
}

function remove() {
  if (!hasSelection.value) return
  layersApi.removeSelected()
}
</script>

<template>
  <aside class="flex w-80 shrink-0 flex-col bg-panel-layer">
    <!-- 動作列：匯入 / 魔法棒 -->
    <div class="flex items-center gap-2 border-b border-canvas-line px-4 py-3">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full bg-[#444444] px-4 py-2 text-xs font-bold text-[#FFFFFB] shadow-[0_4px_12px_rgba(25,63,82,0.16)] transition"
        :class="canImport ? 'hover:brightness-125' : 'cursor-not-allowed opacity-50'"
        :title="COPY.panel.import"
        @click="triggerImport"
      >
        <Icon icon="mdi:tray-arrow-down" width="18" />
        <span>{{ COPY.panel.importShort }}</span>
      </button>
      <button
        type="button"
        class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#444444] px-4 py-2 text-xs font-bold text-[#FFFFFB] shadow-[0_4px_12px_rgba(25,63,82,0.16)] transition"
        :class="canUpscale ? 'hover:brightness-125' : 'cursor-not-allowed opacity-50'"
        :title="COPY.panel.magic"
        @click="openUpscale"
      >
        <Icon icon="mdi:magic-staff" width="18" />
        <span>{{ COPY.panel.magicShort }}</span>
      </button>
      <input
        ref="fileInput"
        data-testid="import-input"
        type="file"
        accept="image/jpeg,image/png"
        multiple
        :disabled="!canImport"
        class="hidden"
        @change="onFiles"
      />
      <!-- 佔位膠囊：符號 +（功能後加） -->
      <span
        aria-hidden="true"
        class="flex h-8 flex-1 select-none items-center justify-center rounded-full bg-[#AFD5BF] text-[18px] leading-none font-bold text-[#226C46] shadow-[0_4px_12px_rgba(25,63,82,0.16)]"
      >
        +
      </span>
    </div>

    <BackgroundInspector />

    <!-- 圖層清單 -->
    <div class="flex min-h-0 flex-1 flex-col px-4 py-3">
      <div class="flex items-center gap-2 text-xs font-bold text-pill-text">
        <Icon icon="mdi:layers-outline" width="16" />
        <span>{{ COPY.panel.layers }}</span>
        <span class="ml-auto opacity-70">{{ layersApi.layers.length }}</span>
      </div>
      <div class="layer-scroll mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        <p
          v-if="canvasState.layersForceHidden"
          class="rounded-xl bg-[rgba(25,63,82,0.06)] px-3 py-2 text-[11px] leading-relaxed font-bold text-pill-text"
        >
          {{ COPY.panel.forceHiddenHint }}
        </p>
        <LayerRow
          v-for="layer in layersApi.layers"
          :key="layer.id"
          :layer="layer"
          :selected="selectedIds.includes(layer.id)"
          :visibility-locked="canvasState.layersForceHidden"
          @select="onSelect(layer, $event)"
          @rename="layersApi.renameLayer(layer.id, $event)"
          @toggle-visible="layersApi.toggleVisible(layer.id)"
          @toggle-lock="layersApi.toggleLock(layer.id)"
        />
        <p
          v-if="!layersApi.layers.length"
          class="rounded-xl bg-[rgba(255,255,255,0.7)] px-3 py-6 text-center text-xs font-bold text-pill-text/70"
        >
          {{ COPY.panel.emptyLayers }}
        </p>
      </div>
    </div>

    <!-- 底部圖層操作列 -->
    <div class="flex items-center gap-1 border-t border-canvas-line px-4 py-3">
      <IconButton
        icon="mdi:arrow-up"
        :label="COPY.layerActions.up"
        :disabled="!singleSelected"
        @click="moveUp"
      />
      <IconButton
        icon="mdi:arrow-down"
        :label="COPY.layerActions.down"
        :disabled="!singleSelected"
        @click="moveDown"
      />
      <IconButton
        icon="mdi:content-copy"
        :label="COPY.layerActions.duplicate"
        :disabled="!singleSelected"
        @click="duplicate"
      />
      <IconButton
        icon="mdi:delete-outline"
        :label="COPY.layerActions.remove"
        :disabled="!hasSelection"
        @click="remove"
      />
    </div>
  </aside>
</template>
