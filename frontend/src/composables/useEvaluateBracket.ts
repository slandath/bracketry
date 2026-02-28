import type { Ref } from 'vue'
import type { Bracket, BracketInstance, Data, Match } from '../lib/data/types'
import { computed, ref, watch } from 'vue'
import { getTemplateResults } from '../api'
import { evaluateUserPicks } from '../lib/results_comparison'

export function useEvaluateBracket(
  bracketInstanceRef: Ref<BracketInstance | undefined>,
  currentBracketData: Ref<{ bracket: Bracket | null }>,
): void {
  const templateId = computed(() =>
    currentBracketData.value?.bracket?.template_id)
  const loading = ref(false)

  // Watch for bracket data and instance to be ready
  watch([currentBracketData, bracketInstanceRef], async ([bracketData, instance]) => {
    // Only evaluate if we have both bracket data and the bracket instance
    if (!bracketData?.bracket || !instance) {
      return
    }

    const id = templateId.value
    if (!id)
      return

    loading.value = true
    try {
      const resultsResponse = await getTemplateResults(id)
      const actualResults = resultsResponse.results as Match[]
      const userBracket = bracketData.bracket.data as Data
      if (!userBracket?.matches)
        return

      const mergedData = evaluateUserPicks(userBracket, actualResults)
      if (!mergedData?.matches)
        return

      const matchUpdates = mergedData.matches
      if (matchUpdates.length > 0) {
        instance.applyMatchesUpdates(matchUpdates as unknown as Record<string, unknown>)
      }
    }
    catch (error) {
      console.error('Failed to evaluate bracket:', error)
    }
    finally {
      loading.value = false
    }
  }, { immediate: true })
}
