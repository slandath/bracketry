<script setup lang="ts">
import type { BracketInstance, Data, Match } from '../lib/data/types'
import Dialog from 'primevue/dialog'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import SelectionTool from '../components/SelectionTool.vue'
import { loadFromStorage, SELECTION_STATE_KEY, useActiveTemplateOnLogin, useBracketActions, useCreateBracket, useCurrentBracketOnLogin, useEvaluateBracket, useTypedSession } from '../composables'
import { showToast } from '../composables/useToast'
import { createBracket } from '../lib/lib'

const tournamentData = ref<Data | null>(null)
const bracketContainerRef = ref<HTMLElement | null>(null)
const bracketInstanceRef = ref<BracketInstance>()
const saveLoading = ref(false)
const router = useRouter()
const { isLoggedIn, isPending } = useTypedSession()
const { isSelectionOpen, closeSelectionTool } = useBracketActions()
const createBracketMutation = useCreateBracket()
const pendingPicks = ref<Record<string, string>>({})

const {
  data: templateData,
  isLoading: templateLoading,
  isError: templateError,
} = useActiveTemplateOnLogin()
const {
  data: currentBracketData,
  isLoading: bracketLoading,
} = useCurrentBracketOnLogin()

const isLoading = computed(() =>
  isLoggedIn.value && (templateLoading.value || bracketLoading.value),
)

// Accepts either a direct Data object or a wrapped payload (e.g. { data: Data })
// so Home can consume both template API shapes safely.
function normalizeTemplateData(value: unknown): Data | null {
  if (!value || typeof value !== 'object')
    return null

  const candidate = value as Record<string, unknown>
  if ('matches' in candidate || 'rounds' in candidate)
    return candidate as Data

  if ('data' in candidate && candidate.data && typeof candidate.data === 'object') {
    return candidate.data as Data
  }

  return null
}

const resolvedTournamentData = computed<Data | null>(() => {
  // Logged-out users should never have bracket data in memory on this page.
  if (!isLoggedIn.value)
    return null

  // Priority 1: if the user has a saved bracket, render that.
  if (currentBracketData.value?.bracket?.data) {
    return currentBracketData.value.bracket.data as Data
  }

  // Priority 2: if there is no saved bracket (404 -> null), use active template.
  return normalizeTemplateData(templateData.value?.template?.data)
})

watch([isLoggedIn, isPending], ([loggedIn, pending]) => {
  // Guard route access: redirect only after auth session initialization
  // finishes, then clear any in-memory bracket for logged-out users.
  if (!loggedIn && !pending) {
    tournamentData.value = null
    router.push('/login')
  }
}, { immediate: true })

watch(resolvedTournamentData, (data) => {
  // Keep the render source in one place by mirroring the resolved data
  // into local reactive state used by the bracket renderer.
  tournamentData.value = data
}, { immediate: true })

watch([tournamentData, bracketContainerRef], ([data, container]) => {
  // Render only when both data and container exist.
  // Watching both values avoids race conditions when data loads before DOM mount.
  if (!data || !container)
    return

  // Recreate the bracket instance when source data changes to keep UI in sync.
  bracketInstanceRef.value?.uninstall?.()
  bracketInstanceRef.value = createBracket(data, container, {})
}, { flush: 'post', immediate: true })

watch(templateError, (hasError) => {
  // If template loading fails and no current bracket exists, clear stale UI data.
  const hasValidCurrentBracket = !!currentBracketData.value?.bracket?.data
  if (hasError && !hasValidCurrentBracket && !resolvedTournamentData.value) {
    tournamentData.value = null
  }
})

onBeforeUnmount(() => {
  // Prevent event listener/memory leaks from the bracket library instance.
  bracketInstanceRef.value?.uninstall?.()
})

function handlePick(match: Match, teamId: string) {
  const key = `${match.roundIndex}:${match.order}`
  pendingPicks.value[key] = teamId
}

function handleRefresh() {
  pendingPicks.value = {}
}

async function handleSave(roundIndex: number) {
  // Check if bracket already exists - if so, block
  if (currentBracketData.value?.bracket) {
    showToast('Picks already made!  Delete your bracket to start over.', 'error')
    return
  }
  // Check for active template
  const templateId = templateData.value?.template?.id
  if (!templateId) {
    showToast('No active tournament template found.', 'error')
    return
  }
  // Get matches from tournamentData to calculate maxRound
  const matches = tournamentData.value?.matches ?? []
  const maxRound = matches.length > 0 ? Math.max(...matches.map(m => m.roundIndex)) : -1

  // Non-final round: do nothing in Home.vue (SelectionTool handles local storage)
  if (roundIndex !== maxRound) {
    pendingPicks.value = {}
    return
  }

  // Final round: load complete bracket from localStorage and submit to DB
  const savedBracket = loadFromStorage()
  if (!savedBracket || !Array.isArray(savedBracket.matches) || savedBracket.matches.length === 0) {
    showToast('No saved picks found.  Please confirm your picks again.', 'error')
    return
  }
  saveLoading.value = true
  try {
    await createBracketMutation.mutateAsync({
      template_id: templateId,
      data: savedBracket,
    })
    // Clear local selection state
    localStorage.removeItem(SELECTION_STATE_KEY)
    showToast('Bracket saved!', 'success')
    pendingPicks.value = {}
    closeSelectionTool()
  }
  catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save bracket'
    showToast(message, 'error')
  }
  finally {
    saveLoading.value = false
  }
}

useEvaluateBracket(bracketInstanceRef, currentBracketData)
</script>

<template>
  <main class="app-container">
    <div v-if="isLoading">
      Loading...
    </div>
    <template v-else>
      <div ref="bracketContainerRef" class="bracketry-wrapper" />
    </template>

    <Dialog
      v-model:visible="isSelectionOpen"
      modal
      header="Make Your Picks"
      :breakpoints="{ '960px': '90vw', '640px': '96vw' }"
      :closable="true"
      :dismissable-mask="true"
      class="dialog-container"
      @hide="closeSelectionTool"
    >
      <SelectionTool
        v-if="isSelectionOpen && tournamentData"
        :data="tournamentData"
        :save-loading="saveLoading"
        @pick="handlePick"
        @refresh="handleRefresh"
        @save="handleSave"
      />
    </Dialog>
  </main>
</template>
