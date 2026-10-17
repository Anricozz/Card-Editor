import { reactive } from 'vue'
import { FABRIC_CUSTOM_PROPS, MAX_HISTORY_STEPS } from '../constants/card'
import { applyObjectStyle } from '../services/objectStyle'
import { getCanvas, reapplyForcedHidden, syncBackgroundState } from './useCanvas'
import { getTool } from './useTools'

const state = reactive({
  canUndo: false,
  canRedo: false,
  used: 0,
  limit: MAX_HISTORY_STEPS,
})

const restoreListeners = []
let stack = []
let index = -1
let restoring = false

export function onHistoryRestore(callback) {
  restoreListeners.push(callback)
}

function capture() {
  const fc = getCanvas()
  if (!fc) return null
  const objects = fc.getObjects()
  return {
    json: fc.toObject(FABRIC_CUSTOM_PROPS),
    meta: objects.map((obj) => ({
      id: obj.id,
      name: obj.name,
      cardlyType: obj.cardlyType,
      isBackground: !!obj.isBackground,
      locked: !!obj.locked,
      visible: obj.visible !== false,
    })),
    selection: fc
      .getActiveObjects()
      .filter((obj) => !obj.isBackground)
      .map((obj) => obj.id),
  }
}

function syncFlags() {
  state.canUndo = index > 0
  state.canRedo = index >= 0 && index < stack.length - 1
  state.used = Math.max(0, index)
}

export function resetHistory() {
  const snapshot = capture()
  stack = snapshot ? [snapshot] : []
  index = stack.length - 1
  syncFlags()
}

// 只在「幾何操作」（新增／刪除／複製／移動／縮放）後呼叫
export function commit() {
  if (restoring) return
  const snapshot = capture()
  if (!snapshot) return
  stack = stack.slice(0, index + 1)
  stack.push(snapshot)
  if (stack.length > MAX_HISTORY_STEPS + 1) stack.shift()
  index = stack.length - 1
  syncFlags()
}

async function restore(snapshot) {
  const fc = getCanvas()
  if (!fc || !snapshot) return
  restoring = true
  try {
    await fc.loadFromJSON(snapshot.json)
    const objects = fc.getObjects()
    objects.forEach((obj, position) => {
      const meta = snapshot.meta[position]
      if (!meta) return
      obj.set({
        id: meta.id,
        name: meta.name,
        cardlyType: meta.cardlyType,
        isBackground: meta.isBackground,
        locked: meta.locked,
      })
      obj.visible = meta.visible
      applyObjectStyle(obj, getTool())
    })
    fc.discardActiveObject()
    if (snapshot.selection?.length === 1) {
      const target = objects.find((obj) => obj.id === snapshot.selection[0] && !obj.isBackground && !obj.locked)
      if (target) fc.setActiveObject(target)
    }
    syncBackgroundState()
    reapplyForcedHidden()
    fc.requestRenderAll()
  } finally {
    restoring = false
  }
  restoreListeners.forEach((callback) => callback())
}

export async function undo() {
  if (index <= 0) return
  index -= 1
  await restore(stack[index])
  syncFlags()
}

export async function redo() {
  if (index >= stack.length - 1) return
  index += 1
  await restore(stack[index])
  syncFlags()
}

export function useHistory() {
  return { state, commit, undo, redo, resetHistory }
}
