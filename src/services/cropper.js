import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

export function createCropper(imageEl, { aspectRatio, onReady } = {}) {
  return new Cropper(imageEl, {
    aspectRatio,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 1,
    background: false,
    modal: false,
    guides: false,
    highlight: false,
    responsive: true,
    rotatable: false,
    scalable: false,
    cropBoxMovable: false,
    cropBoxResizable: false,
    toggleDragModeOnDblclick: false,
    ready() {
      if (typeof onReady === 'function') onReady(this)
    },
  })
}

export function getCroppedCanvas(cropper, width, height) {
  return cropper.getCroppedCanvas({
    width,
    height,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    fillColor: '#FFFFFF',
  })
}
