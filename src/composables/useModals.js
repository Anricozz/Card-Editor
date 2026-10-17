import { reactive } from 'vue'

const modals = reactive({
  statement: false,
  export: false,
  crop: false,
  upscale: false,
  confirm: false,
})

const confirmState = reactive({
  title: '',
  message: '',
  confirmText: '確定',
  cancelText: '取消',
  resolver: null,
})

const toasts = reactive([])
const payloads = reactive({
  crop: { dataURL: '', mode: 'background', layerId: null },
})
let toastSeq = 0

export function showToast(message, { type = 'info', duration = 2600 } = {}) {
  const id = ++toastSeq
  toasts.push({ id, message, type })
  if (duration > 0) setTimeout(() => removeToast(id), duration)
  return id
}

export function removeToast(id) {
  const index = toasts.findIndex((item) => item.id === id)
  if (index >= 0) toasts.splice(index, 1)
}

export function openModal(name, payload) {
  if (!(name in modals)) return
  if (payload && payloads[name]) Object.assign(payloads[name], payload)
  modals[name] = true
}

export function closeModal(name) {
  if (name in modals) modals[name] = false
}

export function askConfirm({ title, message, confirmText = '確定', cancelText = '取消' }) {
  confirmState.title = title
  confirmState.message = message
  confirmState.confirmText = confirmText
  confirmState.cancelText = cancelText
  modals.confirm = true
  return new Promise((resolve) => {
    confirmState.resolver = resolve
  })
}

export function resolveConfirm(value) {
  modals.confirm = false
  const resolver = confirmState.resolver
  confirmState.resolver = null
  if (resolver) resolver(value)
}

export function useModals() {
  return {
    modals,
    payloads,
    toasts,
    confirmState,
    openModal,
    closeModal,
    showToast,
    removeToast,
    askConfirm,
    resolveConfirm,
  }
}
