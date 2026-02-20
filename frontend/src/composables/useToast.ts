import { ref } from 'vue'

const toast = ref<{ message: string, type: 'error' | 'success' | 'info' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

export function showToast(message: string, type: 'error' | 'success' | 'info' = 'info') {
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
  toast.value = { message, type }
  toastTimer = setTimeout(() => {
    toast.value = null
    toastTimer = null
  }, 4000)
}

export function useToast() {
  return { toast, showToast }
}
