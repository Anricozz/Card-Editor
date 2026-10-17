<script setup>
import { nextTick, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { COPY } from '../constants/copy'

const props = defineProps({
  layer: { type: Object, required: true },
  selected: { type: Boolean, default: false },
  // 沒有卡面背景時，顯示／隱藏不給切換
  visibilityLocked: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'rename', 'toggle-visible', 'toggle-lock'])

const editing = ref(false)
const draft = ref('')
const inputEl = ref(null)

async function startRename() {
  editing.value = true
  draft.value = props.layer.name
  await nextTick()
  inputEl.value?.focus()
  inputEl.value?.select()
}

function commitRename() {
  if (!editing.value) return
  editing.value = false
  const value = draft.value.trim()
  if (value && value !== props.layer.name) emit('rename', value)
}

function cancelRename() {
  editing.value = false
}
</script>

<template>
  <div
    class="group relative flex cursor-pointer items-center gap-2 rounded-xl py-2 pr-2 pl-3 transition"
    :class="[
      selected ? 'bg-white shadow-[0_4px_14px_rgba(25,63,82,0.08)]' : 'hover:bg-[rgba(25,63,82,0.05)]',
      layer.visible ? '' : 'opacity-50',
    ]"
    @click="emit('select', $event)"
  >
    <span
      v-if="selected"
      class="absolute top-1/2 left-0 h-6 w-[3px] -translate-y-1/2 rounded-full bg-brand-green"
    ></span>

    <div class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-canvas-line bg-white">
      <img v-if="layer.thumb" :src="layer.thumb" alt="" class="size-full object-cover" />
      <Icon v-else icon="mdi:format-text" width="18" class="text-brand-ink/70" />
    </div>

    <input
      v-if="editing"
      ref="inputEl"
      v-model="draft"
      type="text"
      class="min-w-0 flex-1 rounded-lg border border-brand-green bg-white px-2 py-1 text-xs font-bold text-brand-ink outline-none"
      @click.stop
      @keydown.enter.prevent="commitRename"
      @keydown.esc.prevent="cancelRename"
      @blur="commitRename"
    />
    <span
      v-else
      class="min-w-0 flex-1 truncate text-xs font-bold text-brand-ink"
      :title="COPY.layerActions.rename"
      @dblclick.stop="startRename"
    >
      {{ layer.name }}
    </span>

    <div class="flex items-center gap-0.5">
      <button
        type="button"
        class="flex size-7 items-center justify-center rounded-full transition"
        :class="
          visibilityLocked
            ? 'cursor-not-allowed text-brand-ink/35'
            : [
                'text-brand-ink hover:bg-[rgba(25,63,82,0.08)]',
                layer.visible ? 'opacity-0 group-hover:opacity-100' : 'opacity-100',
              ]
        "
        :disabled="visibilityLocked"
        :title="visibilityLocked ? COPY.panel.visibilityLocked : layer.visible ? '隱藏圖層' : '顯示圖層'"
        @click.stop="emit('toggle-visible')"
      >
        <Icon :icon="layer.visible ? 'mdi:eye' : 'mdi:eye-off'" width="16" />
      </button>
      <button
        type="button"
        class="flex size-7 items-center justify-center rounded-full text-brand-ink transition hover:bg-[rgba(25,63,82,0.08)]"
        :class="layer.locked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
        :title="layer.locked ? '解除鎖定' : '鎖定圖層'"
        @click.stop="emit('toggle-lock')"
      >
        <Icon :icon="layer.locked ? 'mdi:lock' : 'mdi:lock-open-variant'" width="16" />
      </button>
    </div>
  </div>
</template>
