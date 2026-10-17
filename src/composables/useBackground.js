import { computed } from 'vue'
import { makeThumbnail } from '../services/importer'
import {
  addBackgroundFromDataURL,
  getCanvasState,
  removeBackground,
  replaceBackgroundSource,
  setBackgroundThumb,
} from './useCanvas'

export function setBackgroundFromDataURL(dataURL) {
  return addBackgroundFromDataURL(dataURL)
}

export function setBackgroundThumbnail(source) {
  return makeThumbnail(source, 320, 320).then((thumb) => {
    setBackgroundThumb(thumb)
    return thumb
  })
}

export function useBackground() {
  const canvasState = getCanvasState()
  return {
    hasBackground: computed(() => canvasState.hasBackground),
    thumb: computed(() => canvasState.backgroundThumb),
    setFromDataURL: setBackgroundFromDataURL,
    setThumbnail: setBackgroundThumbnail,
    replace: setBackgroundFromDataURL,
    remove: removeBackground,
    replaceSource: replaceBackgroundSource,
  }
}
