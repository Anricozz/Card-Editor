<script setup>
import { Icon } from '@iconify/vue'
import { COPY } from '../constants/copy'
import { useModals } from '../composables/useModals'

const { openModal } = useModals()
</script>

<template>
  <header class="flex h-16 shrink-0 items-center justify-between bg-brand-header px-6">
    <div class="flex items-center gap-3">
      <!-- 主選單：佔位圖示，詳細功能後加 -->
      <button
        type="button"
        class="flex size-10 items-center justify-center rounded-full text-[#FFFFFB] transition hover:bg-[rgba(255,255,255,0.12)]"
        :title="COPY.app.menu"
        :aria-label="COPY.app.menu"
      >
        <Icon icon="mdi:menu" width="26" />
      </button>
      <span class="text-lg font-bold tracking-wide text-[#FFFFFB]">Card Editor</span>
    </div>

    <div class="flex items-center gap-6">
      <button
        type="button"
        class="text-sm font-bold tracking-wide text-brand-statement transition hover:text-white"
        @click="openModal('statement')"
      >
        {{ COPY.app.statement }}
      </button>
      <button
        type="button"
        class="rounded-full bg-brand-green px-7 py-2.5 text-sm font-bold text-white transition hover:brightness-105"
        @click="openModal('export')"
      >
        {{ COPY.app.export }}
      </button>
    </div>
  </header>
</template>
