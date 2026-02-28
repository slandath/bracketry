import type { Ref } from 'vue'
import type { Bracket, BracketInstance, Data, Match } from '../lib/data/types'
import { computed, ref, watch } from 'vue'
import { getTemplateResults } from '../api'
import { evaluateUserPicks } from '../lib/results_comparison'
import { useBracketActions } from './useBracketActions'
import { showToast } from './useToast'

export function useEvaluateBracket(
  bracketInstanceRef: Ref<BracketInstance | undefined>,
  currentBracketData: Ref<{ bracket: Bracket | null }>,
): void {
  const { shouldEvaluate } = useBracketActions()
  const templateId = computed(() =>
    currentBracketData.value?.bracket?.template_id)
  const loading = ref(false)
  const enabled = computed(() => {
    if (shouldEvaluate.value && currentBracketData.value?.bracket) {
      return !!currentBracketData.value.bracket.template_id
    }
  })

  watch(shouldEvaluate, async (triggered) => {
    if (!triggered || !enabled.value)
      return
    loading.value = true
    try {
      const id = templateId.value
      if (!id)
        return
      const resultsResponse = await getTemplateResults(id)
      const actualResults = resultsResponse.results as Match[]
      const userBracket = currentBracketData.value?.bracket?.data as Data
      if (!userBracket?.matches)
        return
      const mergedData = evaluateUserPicks(userBracket, actualResults)
      if (!mergedData?.matches)
        return

      const matchUpdates = mergedData.matches
      if (bracketInstanceRef.value && matchUpdates.length > 0) {
        bracketInstanceRef.value.applyMatchesUpdates(matchUpdates as unknown as Record<string, unknown>)
        showToast('Evaluation complete!', 'success')
      }
      else {
        showToast('No results available yet', 'info')
      }
    }
    catch (error) {
      console.error('Failed to evaluate bracket:', error)
      showToast('Failed to evaluate bracket', 'error')
    }
    finally {
      loading.value = false
    }
  }, { immediate: false })
}
