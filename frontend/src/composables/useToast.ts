import { ref } from 'vue'

const toast = ref<{ message: string, type: 'error' | 'success' | 'info' } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Displays a toast notification message.
 * Automatically clears any existing toast and dismisses after 4 seconds.
 *
 * @param message - The message to display
 * @param type - The type of toast: 'error', 'success', or 'info'
 */
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

/**
 * Provides access to the global toast state and showToast function.
 * Use this in components to display notifications.
 * @returns Object containing the reactive toast state and showToast function
 */
export function useToast() {
  return { toast, showToast }
}
