import { ref } from 'vue'

const isSelectionOpen = ref<boolean>(false)
const shouldEvaluate = ref<boolean>(false)

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
