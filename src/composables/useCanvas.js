import { reactive } from 'vue'
import { Canvas, Rect, FabricImage } from 'fabric'
import { CARD } from '../constants/card'

const state = reactive({
  ready: false,
  orientation: CARD.landscape.key,
  width: CARD.landscape.width,
  height: CARD.landscape.height,
  hasBackground: false,
  backgroundThumb: '',
  // 移除卡面背景後，圖層會被強制隱藏，直到加入新的卡面背景
  layersForceHidden: false,
})

const selectionListeners = []

let fc = null

// 記錄「被強制隱藏前」各圖層原本的顯示狀態，加入新背景時據此還原
let visibilityBeforeForceHide = new Map()

export function getCanvas() {
  return fc
}

export function getCanvasState() {
  return state
}

export function getCardSize() {
  return { width: state.width, height: state.height }
}

export function onSelectionChange(callback) {
  selectionListeners.push(callback)
}

function emitSelectionChange() {
  selectionListeners.forEach((callback) => callback())
}

export function createCanvas(el, { width, height } = {}) {
  fc = new Canvas(el, {
    width: width || state.width,
    height: height || state.height,
    preserveObjectStacking: true,
    selection: true,
    selectionColor: 'rgba(97, 179, 113, 0.12)',
    selectionBorderColor: '#61B371',
    selectionLineWidth: 1,
    enableRetinaScaling: true,
    backgroundColor: 'transparent',
  })
  fc.on('selection:created', emitSelectionChange)
  fc.on('selection:updated', emitSelectionChange)
  fc.on('selection:cleared', emitSelectionChange)
  applyClipPath()
  state.ready = true
  return fc
}

export function destroyCanvas() {
  if (!fc) return
  fc.dispose()
  fc = null
  state.ready = false
}

export function resizeViewport(width, height) {
  if (!fc) return
  fc.setDimensions({ width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) })
}

// 卡面圓角裁切：畫布外內容不顯示、也不匯出
export function applyClipPath() {
  if (!fc) return
  fc.clipPath = new Rect({
    width: state.width,
    height: state.height,
    rx: CARD.radius,
    ry: CARD.radius,
    left: 0,
    top: 0,
    originX: 'left',
    originY: 'top',
    selectable: false,
    evented: false,
  })
  fc.requestRenderAll()
}

export function getBackgroundObject() {
  if (!fc) return null
  return fc.getObjects().find((obj) => obj.isBackground) || null
}

export function getLayerObjects() {
  if (!fc) return []
  return fc.getObjects().filter((obj) => !obj.isBackground)
}

export function isLayersForceHidden() {
  return state.layersForceHidden
}

// 記錄某個圖層的預定顯示狀態（強制隱藏期間新增的圖層用）
export function rememberLayerVisibility(id, visible) {
  visibilityBeforeForceHide.set(id, visible !== false)
}

function hideAllLayersForNoBackground() {
  const layers = getLayerObjects()
  visibilityBeforeForceHide = new Map(layers.map((obj) => [obj.id, obj.visible !== false]))
  layers.forEach((obj) => obj.set('visible', false))
  state.layersForceHidden = true
  // 被隱藏的圖層不該留在選取狀態
  fc?.discardActiveObject()
}

// 加入（新的）卡面背景後，還原圖層先前的顯示狀態
export function restoreLayersAfterBackground() {
  if (!state.layersForceHidden) return
  getLayerObjects().forEach((obj) => {
    const intended = visibilityBeforeForceHide.get(obj.id)
    obj.set('visible', intended === undefined ? true : intended)
  })
  state.layersForceHidden = false
  visibilityBeforeForceHide = new Map()
}

// 強制隱藏期間的任何變動（還原歷史、匯入新圖層）都要重新套用
export function reapplyForcedHidden() {
  if (!state.layersForceHidden) return
  getLayerObjects().forEach((obj) => obj.set('visible', false))
}

export function resetLayersForceHidden() {
  state.layersForceHidden = false
  visibilityBeforeForceHide = new Map()
}

function fitObjectToCard(obj, mode = 'contain') {
  const pick = mode === 'cover' ? Math.max : Math.min
  const scale = pick(state.width / obj.width, state.height / obj.height)
  obj.set({
    originX: 'center',
    originY: 'center',
    left: state.width / 2,
    top: state.height / 2,
    scaleX: scale,
    scaleY: scale,
  })
  obj.setCoords()
}

export { fitObjectToCard }

export async function addBackgroundFromDataURL(dataURL) {
  if (!fc) return null
  const image = await FabricImage.fromURL(dataURL)
  const existing = getBackgroundObject()
  const index = existing ? fc.getObjects().indexOf(existing) : 0
  if (existing) fc.remove(existing)

  fitObjectToCard(image, 'cover')
  image.set({
    id: 'background',
    name: '卡面背景',
    cardlyType: 'background',
    isBackground: true,
    locked: true,
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false,
    hoverCursor: 'default',
  })
  fc.insertAt(Math.max(0, index), image)
  state.hasBackground = true
  restoreLayersAfterBackground()
  fc.requestRenderAll()
  return image
}

export async function replaceBackgroundSource(dataURL) {
  if (!fc) return null
  const background = getBackgroundObject()
  if (!background) return null
  const displayWidth = background.width * background.scaleX
  const displayHeight = background.height * background.scaleY
  const index = fc.getObjects().indexOf(background)
  const image = await FabricImage.fromURL(dataURL)
  image.set({
    id: 'background',
    name: '卡面背景',
    cardlyType: 'background',
    isBackground: true,
    locked: true,
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false,
    originX: 'center',
    originY: 'center',
    left: background.left,
    top: background.top,
    scaleX: displayWidth / image.width,
    scaleY: displayHeight / image.height,
  })
  fc.remove(background)
  fc.insertAt(Math.max(0, index), image)
  fc.requestRenderAll()
  return image
}

export function removeBackground({ forceHideLayers = true } = {}) {
  if (!fc) return
  const background = getBackgroundObject()
  if (background) fc.remove(background)
  state.hasBackground = false
  state.backgroundThumb = ''
  if (forceHideLayers) hideAllLayersForNoBackground()
  fc.requestRenderAll()
}

export function setBackgroundThumb(dataURL) {
  state.backgroundThumb = dataURL || ''
}

// 依畫布上的實際物件重新同步背景狀態（復原歷史後使用）
export function syncBackgroundState() {
  state.hasBackground = !!getBackgroundObject()
}

// 卡面樣式切換（僅在沒有背景時提供）
export function setOrientation(orientation) {
  const size = CARD[orientation] || CARD.landscape
  const layers = getLayerObjects()
  state.orientation = size.key
  state.width = size.width
  state.height = size.height
  if (!fc) return
  applyClipPath()
  layers.forEach((obj) => fitObjectToCard(obj, 'contain'))
  fc.requestRenderAll()
}
