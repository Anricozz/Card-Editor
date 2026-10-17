<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { UPSCALE_SCALES } from '../../constants/card'
import { COPY } from '../../constants/copy'
import { getCanvasState, replaceBackgroundSource } from '../../composables/useCanvas'
import { setBackgroundThumbnail } from '../../composables/useBackground'
import { replaceLayerSource, syncFromCanvas, useLayers } from '../../composables/useLayers'
import { useModals } from '../../composables/useModals'
import { UPSCALE_ENGINE_LABEL, listUpscaleTargets, upscaleImage } from '../../services/upscaler'
import PillButton from '../ui/PillButton.vue'
import PillModal from '../ui/PillModal.vue'

const canvasState = getCanvasState()
const layersApi = useLayers()
const { modals, closeModal, showToast } = useModals()

const targets = ref([])
const scale = ref(2)
const status = ref('idle')
const currentIndex = ref(0)
const currentProgress = ref(0)

let controller = null

const checkedCount = computed(() => targets.value.filter((item) => item.checked).length)
const running = computed(() => status.value === 'running')
const progressLabel = computed(
  () => `${currentIndex.value + 1} / ${targets.value.filter((item) => item.checked).length}`,
)

function buildTargets() {
  const list = listUpscaleTargets({
    includeBackground: canvasState.hasBackground,
    selectedIds: [...layersApi.state.selectedIds],
  })
  // 預設勾選：目前選取的圖層；若沒有選取任何圖層，則預設勾選卡面背景
  const hasSelectedLayer = list.some((item) => item.kind === 'layer' && item.selected)
  targets.value = list.map((item) =>
    reactive({
      ...item,
      checked: hasSelectedLayer ? item.kind === 'layer' && item.selected : item.kind === 'background',
    }),
  )
  scale.value = 2
  status.value = 'idle'
  currentIndex.value = 0
  currentProgress.value = 0
}

watch(
  () => modals.upscale,
  (isOpen) => {
    if (!isOpen) {
      controller?.abort()
      controller = null
      status.value = 'idle'
      return
    }
    if (status.value === 'running') return
    buildTargets()
  },
  { flush: 'post' },
)

function abort() {
  controller?.abort()
  controller = null
  status.value = 'idle'
  closeModal('upscale')
}

async function run() {
  const chosen = targets.value.filter((item) => item.checked)
  if (!chosen.length || running.value) return

  controller = new AbortController()
  const { signal } = controller
  status.value = 'running'
  currentIndex.value = 0
  currentProgress.value = 0

  let doneCount = 0
  let fallbackCount = 0
  let failedCount = 0

  for (let index = 0; index < chosen.length; index += 1) {
    const target = chosen[index]
    currentIndex.value = index
    currentProgress.value = 0
    try {
      const source = target.getSource()
      if (!source) throw new Error('找不到來源圖')
      const result = await upscaleImage(source, {
        scale: scale.value,
        signal,
        onProgress: (rate) => {
          currentProgress.value = rate
        },
      })
      if (result.engine === 'canvas') fallbackCount += 1
      if (target.kind === 'background') {
        await replaceBackgroundSource(result.dataURL)
        await setBackgroundThumbnail(result.dataURL)
      } else {
        await replaceLayerSource(target.object.id, result.dataURL)
      }
      doneCount += 1
    } catch (err) {
      if (signal.aborted) {
        status.value = 'idle'
        return
      }
      console.error(err)
      failedCount += 1
    }
  }

  controller = null
  status.value = 'idle'
  syncFromCanvas()
  if (doneCount) showToast(fallbackCount ? COPY.upscale.fallback(doneCount) : COPY.upscale.done(doneCount))
  if (failedCount) showToast(COPY.upscale.failed(failedCount), { type: 'error' })
  closeModal('upscale')
}
</script>

<template>
  <PillModal
    :open="modals.upscale"
    :title="COPY.upscale.title"
    width="480px"
    :closable="!running"
    @close="abort"
  >
    <div class="flex items-center justify-between text-xs font-bold text-pill-text opacity-70">
      <span>{{ COPY.upscale.targets }}</span>
      <span>AI 模型：{{ UPSCALE_ENGINE_LABEL }}</span>
    </div>

    <div class="mt-3 space-y-2">
      <label
        v-for="item in targets"
        :key="item.key"
        class="flex cursor-pointer items-center gap-3 rounded-2xl bg-white px-4 py-3 transition"
        :class="running ? 'cursor-not-allowed opacity-70' : 'hover:bg-[rgba(255,255,255,0.85)]'"
      >
        <input v-model="item.checked" type="checkbox" class="size-4 accent-[#61B371]" :disabled="running" />
        <Icon :icon="item.kind === 'background' ? 'mdi:image-outline' : 'mdi:image-multiple-outline'" width="18" />
        <span class="min-w-0 flex-1 truncate text-sm font-bold text-brand-ink">{{ item.label }}</span>
        <span class="text-xs font-bold text-pill-text opacity-60">
          {{ item.kind === 'background' ? COPY.upscale.background : item.selected ? COPY.upscale.selected : '' }}
        </span>
      </label>
      <p v-if="!targets.length" class="rounded-2xl bg-white px-4 py-6 text-center text-xs font-bold text-pill-text/70">
        {{ COPY.upscale.noTargets }}
      </p>
    </div>

    <div class="mt-5">
      <p class="text-xs font-bold text-pill-text opacity-70">{{ COPY.upscale.scaleLabel }}</p>
      <div class="mt-2 flex gap-2">
        <button
          v-for="value in UPSCALE_SCALES"
          :key="value"
          type="button"
          class="rounded-full px-5 py-2 text-sm font-bold transition disabled:cursor-not-allowed"
          :class="scale === value ? 'bg-brand-green text-white' : 'bg-[rgba(25,63,82,0.08)] text-pill-text hover:bg-[rgba(25,63,82,0.14)]'"
          :disabled="running"
          @click="scale = value"
        >
          {{ value }}×
        </button>
      </div>
    </div>

    <div v-if="running" class="mt-5 rounded-2xl bg-white px-4 py-3">
      <div class="flex items-center justify-between text-xs font-bold text-pill-text">
        <span>{{ COPY.upscale.running }} {{ progressLabel }}</span>
        <span>{{ Math.round(currentProgress * 100) }}%</span>
      </div>
      <div class="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(25,63,82,0.1)]">
        <div
          class="h-full rounded-full bg-brand-green transition-all"
          :style="{ width: `${Math.round(currentProgress * 100)}%` }"
        ></div>
      </div>
    </div>

    <template #footer>
      <PillButton v-if="running" variant="ghost" @click="abort">{{ COPY.upscale.cancelRun }}</PillButton>
      <template v-else>
        <PillButton variant="ghost" @click="closeModal('upscale')">{{ COPY.upscale.cancel }}</PillButton>
        <PillButton :disabled="checkedCount === 0" @click="run">{{ COPY.upscale.confirm }}</PillButton>
      </template>
    </template>
  </PillModal>
</template>
