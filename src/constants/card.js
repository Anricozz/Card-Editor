// 卡面規格：85.6 × 54 mm @ 300dpi = 1011 × 638 px（橫面）
export const CARD = {
  landscape: { key: 'landscape', width: 1011, height: 638, label: '橫面' },
  portrait: { key: 'portrait', width: 638, height: 1011, label: '豎面' },
  radius: 38,
}

export const CARD_PHYSICAL = { widthMm: 85.6, heightMm: 54, dpi: 300 }

export const TEXT_DEFAULTS = {
  size: 48,
  color: '#193F52',
  placeholder: '雙擊編輯文字',
}

export const TOOLS = {
  MOVE: 'move',
  SCALE: 'scale',
  TEXT: 'text',
}

// 裁切後的卡面背景以 2 倍解析度存放，保留後續放大畫質
export const BACKGROUND_RESOLUTION_SCALE = 2

// 可連續撤銷的步數上限
export const MAX_HISTORY_STEPS = 6

export const EXPORT_OPTIONS = {
  dpi: 72,
  quality: 0.92,
  mime: 'image/jpeg',
  extension: 'jpg',
}

export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png']

export const VIEWPORT = {
  minZoom: 0.1,
  maxZoom: 4,
  padding: 48,
}

export const UPSCALE_SCALES = [2, 4]

export const FABRIC_CUSTOM_PROPS = ['id', 'name', 'cardlyType', 'isBackground', 'locked']
