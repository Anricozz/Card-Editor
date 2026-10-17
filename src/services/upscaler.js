import { getCanvas } from '../composables/useCanvas'

// 模型與 WASM 一律本地打包，不使用 CDN
const MODEL_BASE = `${import.meta.env.BASE_URL}models/esrgan-slim`
const engineCache = new Map()

export const UPSCALE_ENGINE_LABEL = 'ESRGAN Slim（UpscalerJS）'

function modelKey(scale) {
  return scale >= 4 ? 4 : 2
}

async function loadEngine(scale) {
  const key = modelKey(scale)
  if (!engineCache.has(key)) {
    engineCache.set(
      key,
      (async () => {
        const [{ default: Upscaler }, models] = await Promise.all([
          import('upscaler'),
          import('@upscalerjs/esrgan-slim'),
        ])
        const definition = key === 4 ? models.x4 : models.x2
        const upscaler = new Upscaler({
          model: { ...definition, path: `${MODEL_BASE}/x${key}/model.json` },
        })
        await upscaler.ready
        return upscaler
      })(),
    )
  }
  return engineCache.get(key)
}

export async function warmupUpscaler(scale = 2) {
  try {
    await loadEngine(scale)
    return true
  } catch (err) {
    console.warn('[upscaler] AI 模型載入失敗，將使用基礎放大', err)
    return false
  }
}

function resampleOnMainThread(dataURL, scale, onProgress, signal) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const targetWidth = Math.round(img.naturalWidth * scale)
      const targetHeight = Math.round(img.naturalHeight * scale)
      let current = img
      let width = img.naturalWidth
      let height = img.naturalHeight
      while (width < targetWidth) {
        if (signal?.aborted) {
          reject(new DOMException('aborted', 'AbortError'))
          return
        }
        const step = Math.min(2, targetWidth / width)
        const nextWidth = Math.min(targetWidth, Math.round(width * step))
        const nextHeight = Math.min(targetHeight, Math.round(height * step))
        const canvas = document.createElement('canvas')
        canvas.width = nextWidth
        canvas.height = nextHeight
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(current, 0, 0, width, height, 0, 0, nextWidth, nextHeight)
        current = canvas
        width = nextWidth
        height = nextHeight
        onProgress?.(Math.min(0.99, width / targetWidth))
      }
      resolve(current.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('圖片載入失敗'))
    img.src = dataURL
  })
}

function resampleInWorker(dataURL, scale, onProgress, signal) {
  return new Promise((resolve, reject) => {
    let worker
    try {
      worker = new Worker(new URL('./upscaler.worker.js', import.meta.url), { type: 'module' })
    } catch (err) {
      reject(err)
      return
    }
    const abort = () => {
      worker.terminate()
      reject(new DOMException('aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', abort, { once: true })
    worker.onmessage = (event) => {
      signal?.removeEventListener('abort', abort)
      worker.terminate()
      const data = event.data || {}
      if (data.ok) {
        onProgress?.(1)
        resolve(data.dataURL)
      } else {
        reject(new Error(data.message || '基礎放大失敗'))
      }
    }
    worker.onerror = (err) => {
      signal?.removeEventListener('abort', abort)
      worker.terminate()
      reject(new Error(err?.message || '基礎放大失敗'))
    }
    worker.postMessage({ dataURL, scale })
  })
}

async function resample(dataURL, scale, onProgress, signal) {
  try {
    return await resampleInWorker(dataURL, scale, onProgress, signal)
  } catch (err) {
    if (signal?.aborted) throw err
    return await resampleOnMainThread(dataURL, scale, onProgress, signal)
  }
}

// 對外單一介面：優先 AI 放大，失敗則退回基礎放大
export async function upscaleImage(dataURL, { scale = 2, onProgress, signal } = {}) {
  try {
    const upscaler = await loadEngine(scale)
    if (signal?.aborted) throw new DOMException('aborted', 'AbortError')
    const result = await upscaler.upscale(dataURL, {
      output: 'base64',
      patchSize: 128,
      padding: 4,
      progress: (rate) => onProgress?.(rate),
    })
    return { dataURL: result, engine: 'ai' }
  } catch (err) {
    if (err?.name === 'AbortError' || signal?.aborted) throw err
    console.warn('[upscaler] AI 放大失敗，改用基礎放大', err)
    const outputURL = await resample(dataURL, scale, onProgress, signal)
    return { dataURL: outputURL, engine: 'canvas' }
  }
}

// 魔法棒彈窗的「套用對象」清單：卡面背景 + 畫布上所有點陣圖層
// 圖層一律列出（避免「選不到圖層」），已選取的圖層會標記 selected 供預設勾選使用
export function listUpscaleTargets({ includeBackground = true, selectedIds = [] } = {}) {
  const fc = getCanvas()
  if (!fc) return []
  const targets = []
  if (includeBackground) {
    const background = fc.getObjects().find((obj) => obj.isBackground)
    if (background) {
      targets.push({
        key: 'background',
        label: '卡面背景',
        kind: 'background',
        selected: false,
        object: background,
        getSource: () => background.getSrc(),
      })
    }
  }

  // 用「是否為點陣圖」判斷，而不是依賴自訂屬性，複製／還原後的圖層也不會漏掉
  const rasterLayers = fc
    .getObjects()
    .filter((obj) => !obj.isBackground && (obj.cardlyType === 'image' || typeof obj.getSrc === 'function'))

  rasterLayers
    .slice()
    .sort((a, b) => Number(selectedIds.includes(b.id)) - Number(selectedIds.includes(a.id)))
    .forEach((obj) => {
      targets.push({
        key: obj.id,
        label: obj.name,
        kind: 'layer',
        selected: selectedIds.includes(obj.id),
        object: obj,
        getSource: () => obj.getSrc(),
      })
    })
  return targets
}
