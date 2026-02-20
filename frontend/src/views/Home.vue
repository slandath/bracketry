<script setup lang="ts">
import type { BracketInstance, Data, Match } from '../lib/data/types'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import defaultTemplateData from '../2025-tournament-blank.json'
import { CloseIcon } from '../assets'
import SelectionTool from '../components/SelectionTool.vue'
import { useActiveTemplate, useCreateBracket, useCurrentBracket, useUpdateBracket } from '../composables'
import { createBracket } from '../lib/lib'
import { evaluateUserPicks } from '../lib/results_comparison'

const STORAGE_KEY = 'bballBracket:tournament:v1'

const { data: templateData, isLoading: templateLoading } = useActiveTemplate()
const { data: currentBracketData, isLoading: bracketLoading } = useCurrentBracket()
const createBracketMutation = useCreateBracket()
const updateBracketMutation = useUpdateBracket()

// State
const tournamentData = ref<Data>(defaultTemplateData as Data)
const bracketContainerRef = ref<HTMLDivElement>()
const bracketInstanceRef = ref<BracketInstance>()
const isSelectionOpen = ref(false)
const dialogRef = ref<HTMLDialogElement>()

// Initialize tournament data from API when available
watch([templateData, currentBracketData], () => {
  if (currentBracketData.value?.bracket) {
    tournamentData.value = currentBracketData.value.bracket.data as Data
  }
  else if (templateData.value?.template) {
    tournamentData.value = templateData.value.template.data as Data
  }
}, { immediate: true })

// Computed
const allPicked = computed(() => {
  const matches = tournamentData.value.matches ?? []
  return matches.length > 0 && matches.every(m => m.prediction)
})

function handleSave() {
  if (currentBracketData.value?.bracket) {
    updateBracketMutation.mutate({
      id: currentBracketData.value.bracket.id,
      data: { data: tournamentData.value },
    })
  }
  else if (templateData.value?.template) {
    createBracketMutation.mutate({
      template_id: templateData.value.template.id,
      data: tournamentData.value,
    })
  }
}

// Storage
function loadFromStorage(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : defaultTemplateData
  }
  catch {
    console.warn('Corrupted bracket data, using default')
    return defaultTemplateData as Data
  }
}

function saveToStorage(data: Data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
  catch (e) {
    console.error('Failed to save bracket data', e)
  }
}

// Business logic
function recomputeRounds(data: Data) {
  const matches = data.matches ?? []
  const maxRound = matches.reduce((max, m) => Math.max(max, m.roundIndex), 0)

  for (let r = 1; r <= maxRound; r++) {
    const curMatches = matches
      .filter(m => m.roundIndex === r)
      .sort((a, b) => a.order - b.order)
    const prevMatches = matches
      .filter(m => m.roundIndex === r - 1)
      .sort((a, b) => a.order - b.order)

    curMatches.forEach((target, i) => {
      const left = prevMatches[i * 2]
      const right = prevMatches[i * 2 + 1]

      const leftWinner = left?.prediction || left?.result || null
      const rightWinner = right?.prediction || right?.result || null

      target.sides = [
        { ...target.sides?.[0], teamId: leftWinner ?? undefined },
        { ...target.sides?.[1], teamId: rightWinner ?? undefined },
      ]

      if (!leftWinner || !rightWinner) {
        target.prediction = null
        if (target.matchStatus === 'Predicted') {
          target.matchStatus = 'Scheduled'
        }
      }
      else {
        target.matchStatus = 'Predicted'
      }
    })
  }
}

// Event handlers
function handlePick(match: Match, teamId: string) {
  const target = tournamentData.value.matches?.find(
    m => m.roundIndex === match.roundIndex && m.order === match.order,
  )
  if (!target)
    return

  target.prediction = teamId
  recomputeRounds(tournamentData.value)

  tournamentData.value = { ...tournamentData.value }
  saveToStorage(tournamentData.value)

  if (allPicked.value) {
    isSelectionOpen.value = false
  }
}

function handleRefresh() {
  tournamentData.value = loadFromStorage()
}

function openDialog() {
  isSelectionOpen.value = true
  nextTick(() => {
    dialogRef.value?.showModal()
  })
}

function closeDialog() {
  isSelectionOpen.value = false
}

// Bracket management
function initializeBracket() {
  if (!tournamentData.value.matches || !bracketContainerRef.value)
    return

  bracketInstanceRef.value?.uninstall?.()
  bracketInstanceRef.value = createBracket(
    tournamentData.value,
    bracketContainerRef.value,
    {},
  )
}

async function getUserBracketData() {
  const updatedBracket = await evaluateUserPicks()
  if (updatedBracket) {
    saveToStorage(updatedBracket)
  }
}

// Lifecycle
onMounted(async () => {
  tournamentData.value = loadFromStorage()
  if (!localStorage.getItem(STORAGE_KEY)) {
    saveToStorage(tournamentData.value)
  }
})

onBeforeUnmount(() => {
  bracketInstanceRef.value?.uninstall?.()
})

watch(tournamentData, initializeBracket)
</script>

<template>
  <main class="app-container">
    <div v-if="templateLoading || bracketLoading">
      {{ bracketLoading ? 'Loading your bracket...' : 'Loading template...' }}
    </div>
    <template v-else>
      <div ref="bracketContainerRef" class="bracketry-wrapper" />
      <button class="open-selection-btn" :disabled="!!currentBracketData?.bracket" @click="openDialog">
        Make Picks
      </button>
      <button class="open-selection-btn" @click="getUserBracketData">
        Evaluate Bracket
      </button>
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
            v-if="isSelectionOpen"
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
