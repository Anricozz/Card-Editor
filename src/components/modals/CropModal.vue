<script setup>
import { nextTick, ref, watch } from 'vue'
import { BACKGROUND_RESOLUTION_SCALE } from '../../constants/card'
import { COPY } from '../../constants/copy'
import { getCardSize } from '../../composables/useCanvas'
import { setBackgroundFromDataURL, setBackgroundThumbnail } from '../../composables/useBackground'
import { useModals } from '../../composables/useModals'
import { createCropper, getCroppedCanvas } from '../../services/cropper'
import PillButton from '../ui/PillButton.vue'
import PillModal from '../ui/PillModal.vue'

const { modals, payloads, closeModal, showToast } = useModals()

const imageEl = ref(null)
const ready = ref(false)

let cropper = null

function destroyCropper() {
  if (cropper) {
    cropper.destroy()
    cropper = null
  }
  ready.value = false
}

watch(
  () => modals.crop,
  async (isOpen) => {
    if (!isOpen) {
      destroyCropper()
      if (imageEl.value) imageEl.value.removeAttribute('src')
      return
    }
    ready.value = false
    await nextTick()
    const el = imageEl.value
    if (!el) return
    el.onload = () => {
      destroyCropper()
      const { width, height } = getCardSize()
      cropper = createCropper(el, {
        aspectRatio: width / height,
        onReady: () => {
          ready.value = true
        },
      })
    }
    el.src = payloads.crop.dataURL
  },
  { flush: 'post' },
)

async function onConfirm() {
  if (!cropper || !ready.value) return
  const { width, height } = getCardSize()
  const canvas = getCroppedCanvas(
    cropper,
    Math.round(width * BACKGROUND_RESOLUTION_SCALE),
    Math.round(height * BACKGROUND_RESOLUTION_SCALE),
  )
  if (!canvas) {
    showToast(COPY.toast.exportFailed, { type: 'error' })
    return
  }
  const dataURL = canvas.toDataURL('image/jpeg', 0.95)
  await setBackgroundFromDataURL(dataURL)
  await setBackgroundThumbnail(dataURL)
  closeModal('crop')
}
</script>

<template>
  <PillModal :open="modals.crop" :title="COPY.crop.title" width="640px" @close="closeModal('crop')">
    <p class="text-xs font-bold text-pill-text opacity-70">{{ COPY.crop.hint }}</p>
    <div class="mt-3 h-[420px] overflow-hidden rounded-3xl bg-white">
      <img ref="imageEl" alt="卡面背景裁剪" class="block max-w-full" />
    </div>
    <template #footer>
      <PillButton variant="ghost" @click="closeModal('crop')">{{ COPY.crop.cancel }}</PillButton>
      <PillButton :disabled="!ready" @click="onConfirm">{{ COPY.crop.confirm }}</PillButton>
    </template>
  </PillModal>
</template>
