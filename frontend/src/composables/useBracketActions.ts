import { ref } from 'vue'

const isSelectionOpen = ref<boolean>(false)
const shouldEvaluate = ref<boolean>(false)

/**
 * Provides global state for bracket selection actions.
 * Controls the visibility of the selection tool and triggers bracket evaluation.
 * These refs are shared across the application for coordinating selection UI state.
 */
export function useBracketActions() {
  function openSelectionTool() {
    isSelectionOpen.value = true
  }
  function closeSelectionTool() {
    isSelectionOpen.value = false
  }
  function triggerEvaluate() {
    shouldEvaluate.value = true
    setTimeout(() => shouldEvaluate.value = false, 100)
  }

  return {
    isSelectionOpen,
    shouldEvaluate,
    openSelectionTool,
    closeSelectionTool,
    triggerEvaluate,
  }
}
