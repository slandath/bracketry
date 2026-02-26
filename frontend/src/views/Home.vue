<script setup lang="ts">
import type { BracketInstance, Data, Match } from '../lib/data/types'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CloseIcon } from '../assets'
import { authClient } from '../auth-client'
import SelectionTool from '../components/SelectionTool.vue'
import { useActiveTemplateOnLogin, useCurrentBracketOnLogin } from '../composables'
import { createBracket } from '../lib/lib'

const tournamentData = ref<Data | null>(null)
const bracketContainerRef = ref<HTMLElement | null>(null)
const bracketInstanceRef = ref<BracketInstance>()
const router = useRouter()
const session = authClient.useSession()
const isLoggedIn = computed(() => !!session.value.data)
const isSelectionOpen = ref<boolean>(false)
const dialogRef = ref<HTMLDialogElement | null>(null)
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

watch([isLoggedIn, () => session.value.isPending], ([loggedIn, isPending]) => {
  // Guard route access: redirect only after auth session initialization
  // finishes, then clear any in-memory bracket for logged-out users.
  if (!loggedIn && !isPending) {
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

function openDialog() {
  if (!isLoggedIn.value)
    return
  isSelectionOpen.value = true
  nextTick(() => {
    dialogRef.value?.showModal()
  })
}

function closeDialog() {
  isSelectionOpen.value = false
}

function handlePick(match: Match, teamId: string) {
  const key = `${match.roundIndex}:${match.order}`
  pendingPicks.value[key] = teamId
}

function handleRefresh() {
  pendingPicks.value = {}
}

function handleSave() {
  if (!tournamentData.value)
    return
  const updatedData = { ...tournamentData.value }
  Object.entries(pendingPicks.value).forEach(([keycloak, teamId]) => {
    const [roundIndex, order] = keycloak.split(':').map(Number)
    const match = updatedData.matches?.find(
      m => m.roundIndex === roundIndex && m.order === order,
    )
    if (match) {
      match.prediction = teamId
    }
  })
  tournamentData.value = updatedData
  pendingPicks.value = {}
  closeDialog()
}
</script>

<template>
  <main class="app-container">
    <div v-if="isLoading">
      Loading...
    </div>
    <template v-else>
      <div ref="bracketContainerRef" class="bracketry-wrapper" />
      <div class="button-container">
        <button v-if="isLoggedIn" class="open-selection-btn" @click="openDialog">
          Make Picks
        </button>
        <button class="open-selection-btn">
          Evaluate Bracket
        </button>
      </div>
    </template>
    <Transition name="modal" @after-leave="dialogRef?.close()">
      <dialog v-if="isSelectionOpen" ref="dialogRef" class="selection-modal">
        <div class="selection-modal__content">
          <button
            class="selection-modal__close"
            aria-label="Close"
            @click="closeDialog"
          >
            <CloseIcon />
          </button>
          <SelectionTool
            v-if="isSelectionOpen && tournamentData"
            :data="tournamentData"
            @pick="handlePick"
            @refresh="handleRefresh"
            @save="handleSave"
          />
        </div>
      </dialog>
    </Transition>
  </main>
</template>
