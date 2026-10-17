import { reactive } from 'vue'
import { TOOLS } from '../constants/card'
import { applyObjectStyle } from '../services/objectStyle'
import { getCanvas } from './useCanvas'

const state = reactive({ tool: TOOLS.MOVE })

export function getTool() {
  return state.tool
}

export function refreshObjectStyles() {
  const fc = getCanvas()
  if (!fc) return
  fc.getObjects().forEach((obj) => applyObjectStyle(obj, state.tool))
  fc.requestRenderAll()
}

export function setTool(tool) {
  if (!Object.values(TOOLS).includes(tool)) return
  state.tool = tool
  refreshObjectStyles()
}

export function useTools() {
  return { state, setTool, refreshObjectStyles, getTool }
}
