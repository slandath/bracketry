import { ref } from 'vue'

const toast = ref<{ message: string, type: 'error' | 'success' | 'info' } | null>(null)

export function showToast(message: string, type: 'error' | 'success' | 'info' = 'info') {
  toast.value = { message, type }
  setTimeout(() => {
    toast.value = null
  }, 4000)
}

export function useToast() {
  return { toast, showToast }
}
