<script setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { TOOLS } from '../constants/card'
import { COPY } from '../constants/copy'
import { useTools } from '../composables/useTools'

const { state, setTool } = useTools()

const items = computed(() => [
  { value: TOOLS.MOVE, icon: 'mdi:cursor-move', label: COPY.tools.move },
  { value: TOOLS.SCALE, icon: 'mdi:arrow-expand-all', label: COPY.tools.scale },
  { value: TOOLS.TEXT, icon: 'mdi:format-text', label: COPY.tools.text },
])
</script>

<template>
  <aside class="flex w-[72px] shrink-0 flex-col items-center gap-2 bg-panel-tool py-4">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      class="flex w-14 flex-col items-center gap-1 rounded-2xl py-2 transition"
      :class="
        state.tool === item.value
          ? 'bg-brand-green text-white'
          : 'text-brand-ink hover:bg-[rgba(25,63,82,0.08)]'
      "
      :title="item.label"
      :aria-label="item.label"
      @click="setTool(item.value)"
    >
      <Icon :icon="item.icon" width="24" />
      <!-- 未選取的工具在圖示下方顯示名稱 -->
      <span v-if="state.tool !== item.value" class="text-[10px] leading-none font-bold">
        {{ item.label }}
      </span>
    </button>
  </aside>
</template>
