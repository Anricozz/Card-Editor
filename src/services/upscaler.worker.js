// 基礎放大（AI 模型不可用時的保底路徑）：在 Worker 內做多段式高品質重採樣
function resample(bitmap, scale) {
  let current = bitmap
  let currentWidth = bitmap.width
  let currentHeight = bitmap.height
  const targetWidth = Math.round(bitmap.width * scale)
  const targetHeight = Math.round(bitmap.height * scale)

  while (currentWidth < targetWidth) {
    const step = Math.min(2, targetWidth / currentWidth)
    const nextWidth = Math.min(targetWidth, Math.round(currentWidth * step))
    const nextHeight = Math.min(targetHeight, Math.round(currentHeight * step))
    const canvas = new OffscreenCanvas(nextWidth, nextHeight)
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(current, 0, 0, currentWidth, currentHeight, 0, 0, nextWidth, nextHeight)
    current = canvas.transferToImageBitmap ? canvas.transferToImageBitmap() : canvas
    currentWidth = nextWidth
    currentHeight = nextHeight
  }
  return { image: current, width: currentWidth, height: currentHeight }
}

self.onmessage = async (event) => {
  const { dataURL, scale } = event.data || {}
  try {
    const blob = await (await fetch(dataURL)).blob()
    const bitmap = await createImageBitmap(blob)
    const { image, width, height } = resample(bitmap, scale)
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)
    const outBlob = await canvas.convertToBlob({ type: 'image/png' })
    const reader = new FileReaderSync()
    const outputURL = reader.readAsDataURL(outBlob)
    self.postMessage({ ok: true, dataURL: outputURL })
  } catch (error) {
    self.postMessage({ ok: false, message: error?.message || '基礎放大失敗' })
  }
}
