import { reactive } from 'vue'
import { ActiveSelection, FabricImage, IText } from 'fabric'
import { TEXT_DEFAULTS, TOOLS } from '../constants/card'
import { COPY } from '../constants/copy'
import { applyObjectStyle } from '../services/objectStyle'
import { fitScale, isAcceptedFile, readFileAsDataURL } from '../services/importer'
import {
  getCanvas,
  getCanvasState,
  getCardSize,
  isLayersForceHidden,
  onSelectionChange,
  reapplyForcedHidden,
  rememberLayerVisibility,
  syncBackgroundState,
} from './useCanvas'
import { commit, onHistoryRestore } from './useHistory'
import { showToast } from './useModals'
import { getTool } from './useTools'

const layers = reactive([])
const state = reactive({ selectedIds: [] })

let sequence = 0

function nextId(prefix) {
  sequence += 1
  return `${prefix}-${Date.now().toString(36)}-${sequence}`
}

function stripExtension(name) {
  return String(name || '圖層').replace(/\.[^.]+$/, '').slice(0, 24) || '圖層'
}

function findObject(id) {
  const fc = getCanvas()
  if (!fc) return null
  return fc.getObjects().find((obj) => obj.id === id) || null
}

// 沒有卡面背景前，不允許匯入素材或新增文字
function requireBackground(message) {
  if (getCanvasState().hasBackground) return true
  showToast(message, { type: 'error' })
  return false
}

export function syncFromCanvas() {
  const fc = getCanvas()
  if (!fc) return
  // 沒有卡面背景時圖層一律保持隱藏（含還原歷史之後）
  reapplyForcedHidden()
  const items = fc
    .getObjects()
    .filter((obj) => !obj.isBackground)
    .slice()
    .reverse()
    .map((obj) => ({
      id: obj.id,
      name: obj.name,
      type: obj.cardlyType,
      visible: obj.visible !== false,
      locked: !!obj.locked,
      thumb: obj.cardlyType === 'image' ? obj.getSrc() : '',
    }))
  layers.splice(0, layers.length, ...items)
  syncSelection()
}

export function syncSelection() {
  const fc = getCanvas()
  if (!fc) return
  state.selectedIds = fc
    .getActiveObjects()
    .filter((obj) => !obj.isBackground)
    .map((obj) => obj.id)
}

onSelectionChange(syncSelection)
onHistoryRestore(() => {
  syncBackgroundState()
  syncFromCanvas()
})

export function selectLayer(id, { additive = false } = {}) {
  const fc = getCanvas()
  const object = findObject(id)
  if (!fc || !object || object.locked) return

  if (!additive) {
    fc.discardActiveObject()
    fc.setActiveObject(object)
    fc.requestRenderAll()
    syncSelection()
    return
  }

  const current = fc.getActiveObjects()
  const next = current.includes(object)
    ? current.filter((item) => item !== object)
    : [...current, object]
  fc.discardActiveObject()
  if (next.length === 1) fc.setActiveObject(next[0])
  else if (next.length > 1) fc.setActiveObject(new ActiveSelection(next, { canvas: fc }))
  fc.requestRenderAll()
  syncSelection()
}

export function selectAll() {
  const fc = getCanvas()
  if (!fc) return
  const targets = fc.getObjects().filter((obj) => !obj.isBackground && !obj.locked)
  fc.discardActiveObject()
  if (targets.length === 1) fc.setActiveObject(targets[0])
  else if (targets.length > 1) fc.setActiveObject(new ActiveSelection(targets, { canvas: fc }))
  fc.requestRenderAll()
  syncSelection()
}

export async function importFiles(fileList) {
  const files = Array.from(fileList || [])
  const accepted = files.filter(isAcceptedFile)
  if (!requireBackground(COPY.toast.importNeedsBackground)) {
    return { added: 0, rejected: 0, blocked: true }
  }
  if (!accepted.length) return { added: 0, rejected: files.length }

  const fc = getCanvas()
  if (!fc) return { added: 0, rejected: files.length }
  const { width, height } = getCardSize()

  for (const file of accepted) {
    const dataURL = await readFileAsDataURL(file)
    const image = await FabricImage.fromURL(dataURL)
    const scale = fitScale(image.width, image.height, width, height, 'contain')
    image.set({
      id: nextId('layer'),
      name: stripExtension(file.name),
      cardlyType: 'image',
      originX: 'center',
      originY: 'center',
      left: width / 2,
      top: height / 2,
      scaleX: scale,
      scaleY: scale,
    })
    applyObjectStyle(image, getTool())
    if (isLayersForceHidden()) {
      // 沒有卡面背景期間新增的圖層，加入新背景時應該要顯示
      rememberLayerVisibility(image.id, true)
      image.set('visible', false)
    }
    fc.add(image)
  }

  fc.requestRenderAll()
  syncFromCanvas()
  commit()
  return { added: accepted.length, rejected: files.length - accepted.length }
}

export function addTextLayer({ x, y, text = TEXT_DEFAULTS.placeholder } = {}) {
  const fc = getCanvas()
  if (!fc) return null
  if (!requireBackground(COPY.toast.textNeedsBackground)) return null
  const { width, height } = getCardSize()
  const node = new IText(text, {
    id: nextId('text'),
    name: text.slice(0, 12) || '文字',
    cardlyType: 'text',
    fontSize: TEXT_DEFAULTS.size,
    fill: TEXT_DEFAULTS.color,
    fontFamily: '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif',
    originX: 'center',
    originY: 'center',
    left: typeof x === 'number' ? x : width / 2,
    top: typeof y === 'number' ? y : height / 2,
  })
  applyObjectStyle(node, getTool())
  fc.add(node)
  fc.setActiveObject(node)
  fc.requestRenderAll()
  syncFromCanvas()
  commit()
  return node
}

export function renameLayer(id, name) {
  const object = findObject(id)
  if (!object) return
  const next = String(name || '').trim()
  if (!next) return
  object.set('name', next.slice(0, 24))
  syncFromCanvas()
}

export function toggleVisible(id) {
  const fc = getCanvas()
  const object = findObject(id)
  if (!fc || !object) return
  if (isLayersForceHidden()) {
    showToast(COPY.toast.visibilityLocked, { type: 'error' })
    return
  }
  object.visible = object.visible === false
  fc.requestRenderAll()
  syncFromCanvas()
}

export function toggleLock(id) {
  const fc = getCanvas()
  const object = findObject(id)
  if (!fc || !object) return
  object.locked = !object.locked
  if (object.locked && fc.getActiveObjects().includes(object)) fc.discardActiveObject()
  applyObjectStyle(object, getTool())
  fc.requestRenderAll()
  syncFromCanvas()
}

export function moveLayer(id, direction) {
  const fc = getCanvas()
  const object = findObject(id)
  if (!fc || !object) return
  const objects = fc.getObjects()
  const position = objects.indexOf(object)
  // index 0 保留給卡面背景
  const target = Math.max(1, Math.min(objects.length - 1, position + direction))
  if (target === position) return
  fc.moveObjectTo(object, target)
  fc.requestRenderAll()
  syncFromCanvas()
  commit()
}

export async function duplicateLayer(id) {
  const fc = getCanvas()
  const object = findObject(id)
  if (!fc || !object) return null
  const clone = await object.clone()
  clone.set({
    id: nextId('layer'),
    name: `${object.name} 複製`,
    // clone() 只會複製標準屬性，自訂屬性要自己補回來
    cardlyType: object.cardlyType || 'image',
    left: object.left + 24,
    top: object.top + 24,
  })
  clone.isBackground = false
  clone.locked = false
  applyObjectStyle(clone, getTool())
  fc.add(clone)
  fc.setActiveObject(clone)
  fc.requestRenderAll()
  syncFromCanvas()
  commit()
  return clone
}

export function removeLayers(ids) {
  const fc = getCanvas()
  if (!fc) return
  const targets = ids.map(findObject).filter(Boolean)
  if (!targets.length) return
  fc.discardActiveObject()
  targets.forEach((object) => fc.remove(object))
  fc.requestRenderAll()
  syncFromCanvas()
  commit()
}

export function removeSelected() {
  removeLayers([...state.selectedIds])
}

// 用新的點陣圖取代圖層來源，維持原本的位置與顯示尺寸
export async function replaceLayerSource(id, dataURL) {
  const fc = getCanvas()
  const object = findObject(id)
  if (!fc || !object) return false
  const displayWidth = object.width * object.scaleX
  const displayHeight = object.height * object.scaleY
  const position = fc.getObjects().indexOf(object)
  const image = await FabricImage.fromURL(dataURL)
  image.set({
    id: object.id,
    name: object.name,
    cardlyType: 'image',
    originX: 'center',
    originY: 'center',
    left: object.left,
    top: object.top,
    scaleX: displayWidth / image.width,
    scaleY: displayHeight / image.height,
  })
  fc.remove(object)
  fc.insertAt(Math.max(1, position), image)
  applyObjectStyle(image, getTool())
  fc.requestRenderAll()
  syncFromCanvas()
  return true
}

export function useLayers() {
  return {
    layers,
    state,
    syncFromCanvas,
    syncSelection,
    selectLayer,
    selectAll,
    importFiles,
    addTextLayer,
    renameLayer,
    toggleVisible,
    toggleLock,
    moveLayer,
    duplicateLayer,
    removeLayers,
    removeSelected,
    replaceLayerSource,
    getLayerType: (id) => findObject(id)?.cardlyType,
    isTextLayer: (id) => findObject(id)?.cardlyType === TOOLS.TEXT,
  }
}
