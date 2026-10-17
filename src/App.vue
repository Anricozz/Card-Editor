<script setup>
import AppHeader from './components/AppHeader.vue'
import ToolRail from './components/ToolRail.vue'
import ActionBar from './components/ActionBar.vue'
import CanvasStage from './components/CanvasStage.vue'
import LayerPanel from './components/LayerPanel.vue'
import StatementModal from './components/modals/StatementModal.vue'
import ExportModal from './components/modals/ExportModal.vue'
import CropModal from './components/modals/CropModal.vue'
import UpscaleModal from './components/modals/UpscaleModal.vue'
import ConfirmModal from './components/modals/ConfirmModal.vue'
import ToastStack from './components/ui/ToastStack.vue'
</script>

<template>
  <div class="flex h-screen w-full min-w-[1280px] flex-col overflow-hidden bg-canvas-outside">
    <AppHeader />
    <div class="flex min-h-0 flex-1">
      <ToolRail />
      <div class="flex min-w-0 flex-1 flex-col">
        <ActionBar />
        <CanvasStage />
      </div>
      <LayerPanel />
    </div>

    <StatementModal />
    <ExportModal />
    <CropModal />
    <UpscaleModal />
    <ConfirmModal />
    <ToastStack />
  </div>
</template>
