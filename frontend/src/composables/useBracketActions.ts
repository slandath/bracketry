import { ref } from 'vue'

const isSelectionOpen = ref<boolean>(false)

/**
 * Provides global state for bracket selection actions.
 * Controls the visibility of the selection tool.
 * These refs are shared across the application for coordinating selection UI state.
 */
export function useBracketActions() {
  function openSelectionTool() {
    isSelectionOpen.value = true
  }
  function closeSelectionTool() {
    isSelectionOpen.value = false
  }

  return {
    isSelectionOpen,
    openSelectionTool,
    closeSelectionTool,
  }
}
