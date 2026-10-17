import { saveAs } from 'file-saver'
import { CARD, EXPORT_OPTIONS } from '../constants/card'
import { getCanvas, getCardSize } from '../composables/useCanvas'
import { patchJpegDpi } from './jpegDpi'

export function buildExportFilename(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join('')
  return `cardly-${stamp}`
}

// 匯出用畫布：白底 + 圓角裁切（JPG 不支援透明，圓角外補白）
export function renderCardCanvas() {
  const fc = getCanvas()
  const { width, height } = getCardSize()
  const savedVpt = (fc.viewportTransform || [1, 0, 0, 1, 0, 0]).slice()
  let source
  try {
    // 匯出不受目前縮放／平移影響
    fc.setViewportTransform([1, 0, 0, 1, 0, 0])
    source = fc.toCanvasElement(1, { width, height })
  } finally {
    fc.setViewportTransform(savedVpt)
    fc.requestRenderAll()
  }

  const output = document.createElement('canvas')
  output.width = width
  output.height = height
  const ctx = output.getContext('2d')
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)
  ctx.save()
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(0, 0, width, height, CARD.radius)
    ctx.clip()
  }
  ctx.drawImage(source, 0, 0, width, height)
  ctx.restore()
  return output
}

export async function exportCard({ filename } = {}) {
  const name = (filename || '').trim() || buildExportFilename()
  const canvas = renderCardCanvas()
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, EXPORT_OPTIONS.mime, EXPORT_OPTIONS.quality),
  )
  if (!blob) throw new Error('無法產生 JPG')

  const buffer = await blob.arrayBuffer()
  const patched = patchJpegDpi(buffer, EXPORT_OPTIONS.dpi)
  saveAs(patched, `${name}.${EXPORT_OPTIONS.extension}`)
  return { filename: `${name}.${EXPORT_OPTIONS.extension}`, width: canvas.width, height: canvas.height }
}
