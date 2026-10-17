import { TOOLS } from '../constants/card'
import { TOKENS } from '../constants/tokens'

// 只保留四角等比縮放控制點，關閉旋轉與邊控制點
export const CORNER_STYLE = {
  cornerColor: TOKENS.exportPill,
  cornerStrokeColor: TOKENS.white,
  cornerStyle: 'circle',
  cornerSize: 14,
  transparentCorners: false,
  borderColor: TOKENS.exportPill,
  borderScaleFactor: 2,
  padding: 2,
  lockRotation: true,
}

export function applyCommonObjectStyle(obj) {
  obj.set(CORNER_STYLE)
  obj.setControlsVisibility({
    mt: false,
    mb: false,
    ml: false,
    mr: false,
    mtr: false,
    tl: true,
    tr: true,
    bl: true,
    br: true,
  })
}

// 依「鎖定狀態 + 目前工具」決定物件是否可被選取／拖曳／縮放
export function applyInteractivity(obj, tool) {
  const isBackground = !!obj.isBackground
  const locked = !!obj.locked
  const interactive = !locked && !isBackground

  obj.set({
    selectable: interactive,
    evented: interactive,
    hasControls: interactive && tool === TOOLS.SCALE,
    hasBorders: interactive,
    hoverCursor: interactive ? 'move' : 'default',
  })
}

export function applyObjectStyle(obj, tool) {
  applyCommonObjectStyle(obj)
  applyInteractivity(obj, tool)
}
