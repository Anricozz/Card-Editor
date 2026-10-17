const SOI = 0xffd8
const APP0 = 0xffe0
const SOS = 0xffda

function buildJfifApp0Segment(dpi) {
  const segment = new Uint8Array(18)
  segment[0] = 0xff
  segment[1] = 0xe0
  segment[2] = 0x00
  segment[3] = 0x10 // 區段長度 16（含長度位元組本身）
  segment[4] = 0x4a // J
  segment[5] = 0x46 // F
  segment[6] = 0x49 // I
  segment[7] = 0x46 // F
  segment[8] = 0x00
  segment[9] = 0x01 // 版本 1.1
  segment[10] = 0x01
  segment[11] = 0x01 // 單位：dots per inch
  segment[12] = (dpi >> 8) & 0xff
  segment[13] = dpi & 0xff
  segment[14] = (dpi >> 8) & 0xff
  segment[15] = dpi & 0xff
  segment[16] = 0x00 // 縮圖寬
  segment[17] = 0x00 // 縮圖高
  return segment
}

// 讀取 JPEG 的 JFIF 密度（測試與驗證用）
export function readJpegDpi(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer)
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  let offset = 2
  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xff) {
      offset += 1
      continue
    }
    const marker = bytes[offset + 1]
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2
      continue
    }
    if (marker === SOS) break
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
    const isJfif =
      marker === 0xe0 &&
      bytes[offset + 4] === 0x4a &&
      bytes[offset + 5] === 0x46 &&
      bytes[offset + 6] === 0x49 &&
      bytes[offset + 7] === 0x46 &&
      bytes[offset + 8] === 0x00
    if (isJfif) {
      const units = bytes[offset + 11]
      const xDensity = (bytes[offset + 12] << 8) | bytes[offset + 13]
      const yDensity = (bytes[offset + 14] << 8) | bytes[offset + 15]
      return { units, x: xDensity, y: yDensity }
    }
    offset += 2 + length
  }
  return null
}

// 把 JPEG 的 APP0/JFIF 密度改寫成指定 dpi；沒有 JFIF 段時直接插入一段
export function patchJpegDpi(arrayBuffer, dpi = 72) {
  const bytes = new Uint8Array(arrayBuffer)
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2
    while (offset < bytes.length - 1) {
      if (bytes[offset] !== 0xff) {
        offset += 1
        continue
      }
      const marker = bytes[offset + 1]
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2
        continue
      }
      if (marker === SOS) break
      const length = (bytes[offset + 2] << 8) | bytes[offset + 3]
      const isJfif =
        marker === 0xe0 &&
        length >= 16 &&
        bytes[offset + 4] === 0x4a &&
        bytes[offset + 5] === 0x46 &&
        bytes[offset + 6] === 0x49 &&
        bytes[offset + 7] === 0x46 &&
        bytes[offset + 8] === 0x00

      if (isJfif) {
        const patched = bytes.slice()
        patched[offset + 11] = 0x01
        patched[offset + 12] = (dpi >> 8) & 0xff
        patched[offset + 13] = dpi & 0xff
        patched[offset + 14] = (dpi >> 8) & 0xff
        patched[offset + 15] = dpi & 0xff
        return new Blob([patched], { type: 'image/jpeg' })
      }
      offset += 2 + length
    }

    // 找不到 JFIF 段：緊接在 SOI 之後插入
    const app0 = buildJfifApp0Segment(dpi)
    const output = new Uint8Array(bytes.length + app0.length)
    output.set(bytes.subarray(0, 2), 0)
    output.set(app0, 2)
    output.set(bytes.subarray(2), 2 + app0.length)
    return new Blob([output], { type: 'image/jpeg' })
  }

  return new Blob([bytes], { type: 'image/jpeg' })
}
