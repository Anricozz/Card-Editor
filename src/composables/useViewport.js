import { reactive } from 'vue'
import { VIEWPORT } from '../constants/card'
import { getCanvas, getCardSize } from './useCanvas'

const state = reactive({
  zoom: 1,
  auto: true,
  viewportWidth: 0,
  viewportHeight: 0,
  cardLeft: 0,
  cardTop: 0,
  cardWidth: 0,
  cardHeight: 0,
})

function syncCardRect() {
  const fc = getCanvas()
  if (!fc) return
  const vpt = fc.viewportTransform || [1, 0, 0, 1, 0, 0]
  const { width, height } = getCardSize()
  state.zoom = vpt[0]
  state.cardLeft = vpt[4]
  state.cardTop = vpt[5]
  state.cardWidth = width * vpt[0]
  state.cardHeight = height * vpt[0]
}

function apply(zoom, left, top) {
  const fc = getCanvas()
  if (!fc) return
  fc.setViewportTransform([zoom, 0, 0, zoom, left, top])
  syncCardRect()
  fc.requestRenderAll()
}

export function setViewportSize(width, height) {
  state.viewportWidth = Math.max(1, Math.round(width))
  state.viewportHeight = Math.max(1, Math.round(height))
  if (state.auto) fitView()
  else syncCardRect()
}

export function fitView() {
  const { width, height } = getCardSize()
  if (!state.viewportWidth || !state.viewportHeight) return
  const zoom = Math.max(
    VIEWPORT.minZoom,
    Math.min(
      VIEWPORT.maxZoom,
      Math.min(1, (state.viewportWidth - VIEWPORT.padding * 2) / width, (state.viewportHeight - VIEWPORT.padding * 2) / height),
    ),
  )
  apply(zoom, (state.viewportWidth - width * zoom) / 2, (state.viewportHeight - height * zoom) / 2)
  state.auto = true
}

export function resetView() {
  fitView()
}

export function zoomAt(clientX, clientY, factor) {
  const fc = getCanvas()
  if (!fc) return
  const rect = fc.upperCanvasEl.getBoundingClientRect()
  const pointerX = clientX - rect.left
  const pointerY = clientY - rect.top
  const vpt = fc.viewportTransform
  const nextZoom = Math.max(VIEWPORT.minZoom, Math.min(VIEWPORT.maxZoom, vpt[0] * factor))
  const ratio = nextZoom / vpt[0]
  apply(nextZoom, pointerX - ratio * (pointerX - vpt[4]), pointerY - ratio * (pointerY - vpt[5]))
  state.auto = false
}

export function panBy(dx, dy) {
  const fc = getCanvas()
  if (!fc) return
  const vpt = fc.viewportTransform
  apply(vpt[0], vpt[4] + dx, vpt[5] + dy)
  state.auto = false
}

export function useViewport() {
  return { state, setViewportSize, fitView, resetView, zoomAt, panBy }
}
