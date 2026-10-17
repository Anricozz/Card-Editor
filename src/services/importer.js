import { ACCEPTED_MIME_TYPES } from '../constants/card'

export function isAcceptedFile(file) {
  if (!file) return false
  if (ACCEPTED_MIME_TYPES.includes(file.type)) return true
  return /\.(jpe?g|png)$/i.test(file.name || '')
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error || new Error('讀取檔案失敗'))
    reader.readAsDataURL(file)
  })
}

export function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('圖片載入失敗'))
    img.src = src
  })
}

export async function makeThumbnail(src, boxW = 160, boxH = 160) {
  try {
    const img = await loadImageElement(src)
    const scale = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight, 1)
    const width = Math.max(1, Math.round(img.naturalWidth * scale))
    const height = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', 0.7)
  } catch (err) {
    return ''
  }
}

export function fitScale(sourceW, sourceH, boxW, boxH, mode = 'contain') {
  const pick = mode === 'cover' ? Math.max : Math.min
  return pick(boxW / sourceW, boxH / sourceH)
}

export function dataURLToBlob(dataURL) {
  const [head, body] = String(dataURL).split(',')
  const mime = /:(.*?);/.exec(head)?.[1] || 'image/png'
  if (!head.includes('base64')) {
    return new Blob([decodeURIComponent(body)], { type: mime })
  }
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error || new Error('轉換失敗'))
    reader.readAsDataURL(blob)
  })
}
