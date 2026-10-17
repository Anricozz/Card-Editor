<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { CARD, TOOLS } from '../constants/card'
import { COPY } from '../constants/copy'
import { isAcceptedFile, readFileAsDataURL } from '../services/importer'
import { applyObjectStyle } from '../services/objectStyle'
import {
  createCanvas,
  destroyCanvas,
  getCanvas,
  getCanvasState,
  resizeViewport,
  setOrientation,
} from '../composables/useCanvas'
import { useViewport } from '../composables/useViewport'
import { useTools } from '../composables/useTools'
import { useLayers } from '../composables/useLayers'
import { useHistory } from '../composables/useHistory'
import { useModals } from '../composables/useModals'
import PillButton from './ui/PillButton.vue'

const viewportEl = ref(null)
const canvasEl = ref(null)
const backgroundInput = ref(null)
const spaceDown = ref(false)

const { state: viewport, setViewportSize, resetView, zoomAt, panBy } = useViewport()
const { state: toolState } = useTools()
const layersApi = useLayers()
const { commit, undo, redo, resetHistory } = useHistory()
const { openModal, showToast } = useModals()
const canvasState = getCanvasState()

const orientations = [CARD.landscape, CARD.portrait]

let observer = null
let panState = null

const cardStyle = computed(() => ({
  left: `${viewport.cardLeft}px`,
  top: `${viewport.cardTop}px`,
  width: `${viewport.cardWidth}px`,
  height: `${viewport.cardHeight}px`,
  borderRadius: `${CARD.radius * viewport.zoom}px`,
}))

function measure() {
  const el = viewportEl.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  resizeViewport(rect.width, rect.height)
  setViewportSize(rect.width, rect.height)
}

function onObjectModified(event) {
  if (event.target) applyObjectStyle(event.target, toolState.tool)
  commit()
}

function onCanvasMouseDown(option) {
  if (toolState.tool !== TOOLS.TEXT || option.target) return
  const fc = getCanvas()
  if (!fc) return
  const point = fc.getScenePoint(option.e)
  layersApi.addTextLayer({ x: point.x, y: point.y })
}

function onWheel(event) {
  const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1
  zoomAt(event.clientX, event.clientY, factor)
}

function onPointerDown(event) {
  const wantsPan = event.button === 1 || (spaceDown.value && event.button === 0)
  if (!wantsPan) return
  event.preventDefault()
  event.stopPropagation()
  panState = { x: event.clientX, y: event.clientY }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(event) {
  if (!panState) return
  panBy(event.clientX - panState.x, event.clientY - panState.y)
  panState = { x: event.clientX, y: event.clientY }
}

function onPointerUp() {
  panState = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
}

function onKeyDown(event) {
  const typing = isTypingTarget(event.target)
  if (event.code === 'Space' && !typing) {
    spaceDown.value = true
    event.preventDefault()
    return
  }
  const fc = getCanvas()
  const editing = !!fc?.getActiveObject()?.isEditing
  if (typing || editing) return

  const meta = event.ctrlKey || event.metaKey
  const key = event.key.toLowerCase()

  if (meta && key === 'z' && !event.shiftKey) {
    event.preventDefault()
    undo()
    return
  }
  if (meta && (key === 'y' || (key === 'z' && event.shiftKey))) {
    event.preventDefault()
    redo()
    return
  }
  if (meta && key === 'a') {
    event.preventDefault()
    layersApi.selectAll()
    return
  }
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (layersApi.state.selectedIds.length) {
      event.preventDefault()
      layersApi.removeSelected()
    }
    return
  }
  if (event.key === 'Escape' && fc) {
    fc.discardActiveObject()
    fc.requestRenderAll()
  }
}

function onKeyUp(event) {
  if (event.code === 'Space') spaceDown.value = false
}

function triggerBackgroundUpload() {
  backgroundInput.value?.click()
}

async function onBackgroundFile(event) {
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

function onSelectOrientation(key) {
  setOrientation(key)
  resetView()
}

onMounted(() => {
  const fc = createCanvas(canvasEl.value)
  fc.on('object:modified', onObjectModified)
  fc.on('mouse:down', onCanvasMouseDown)
  resetHistory()
  measure()
  observer = new ResizeObserver(measure)
  observer.observe(viewportEl.value)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  onPointerUp()
  destroyCanvas()
})
</script>

<template>
  <div
    ref="viewportEl"
    class="relative min-h-0 flex-1 overflow-hidden bg-canvas-outside select-none"
    :class="toolState.tool === TOOLS.TEXT ? 'cursor-crosshair' : ''"
    @wheel.prevent="onWheel"
    @pointerdown.capture="onPointerDown"
  >
    <!-- 卡面底色（圓角與陰影），裁切後內容由 fabric 疊在上方 -->
    <div
      data-testid="card-paper"
      class="pointer-events-none absolute bg-white shadow-[0_18px_48px_rgba(25,63,82,0.18)]"
      :style="cardStyle"
    ></div>

    <canvas ref="canvasEl"></canvas>

    <!-- 尚無卡面背景時的空狀態 -->
    <div v-if="!canvasState.hasBackground" class="pointer-events-none absolute flex items-center justify-center" :style="cardStyle">
      <div class="pointer-events-auto w-[440px] max-w-[80%] rounded-[32px] bg-pill-bg px-8 py-7 text-center shadow-[0_16px_40px_rgba(25,63,82,0.16)]">
        <p class="text-base font-bold text-pill-text">{{ COPY.canvas.emptyTitle }}</p>
        <div class="mt-5 flex justify-center">
          <PillButton @click="triggerBackgroundUpload">{{ COPY.canvas.upload }}</PillButton>
        </div>
        <p class="mt-6 text-xs font-bold text-pill-text">{{ COPY.canvas.orientation }}</p>
        <div class="mt-2 flex justify-center gap-2">
          <button
            v-for="option in orientations"
            :key="option.key"
            type="button"
            class="rounded-full px-5 py-2 text-sm font-bold transition"
            :class="
              canvasState.orientation === option.key
                ? 'bg-brand-green text-white'
                : 'bg-[rgba(25,63,82,0.08)] text-pill-text hover:bg-[rgba(25,63,82,0.14)]'
            "
            @click="onSelectOrientation(option.key)"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="absolute right-6 bottom-6 flex size-10 items-center justify-center rounded-full bg-brand-green text-white shadow-[0_10px_24px_rgba(97,179,113,0.45)] transition hover:brightness-105"
      :title="COPY.canvas.recenter"
      :aria-label="COPY.canvas.recenter"
      @click="resetView"
    >
      <Icon icon="mdi:image-filter-center-focus" width="20" />
    </button>

    <input
      ref="backgroundInput"
      data-testid="background-input"
      type="file"
      accept="image/jpeg,image/png"
      class="hidden"
      @change="onBackgroundFile"
    />
  </div>
</template>
