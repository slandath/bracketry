<script setup lang="ts">
import type { Data, Match } from '../lib/data/types'
import Button from 'primevue/button'
import Panel from 'primevue/panel'
import ProgressBar from 'primevue/progressbar'
import Step from 'primevue/step'
import StepList from 'primevue/steplist'
import Stepper from 'primevue/stepper'
import { computed, onMounted, ref } from 'vue'
import { loadFromStorage, saveToStorage, useSelectionState } from '../composables'
import '../styles/components/SelectionTool.scss'

interface Props {
  data: Data
  roundNames?: Record<number, string>
  saveLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  roundNames: undefined,
  saveLoading: false,
})

const emit = defineEmits<{
  pick: [match: Match, teamId: string]
  refresh: []
  save: [roundIndex: number]
}>()

const savedBracketData = ref<Data | null>(null)

function cloneBracketData(data: Data): Data {
  try {
    return structuredClone(data)
  }
  catch {
    return JSON.parse(JSON.stringify(data)) as Data
  }
}
function isBracketCompatible(stored: Data, source: Data) {
  const storedMatches = stored.matches ?? []
  const sourceMatches = source.matches ?? []
  if (storedMatches.length !== sourceMatches.length)
    return false
  return storedMatches.every(sm => sourceMatches.some(tm => tm.roundIndex === sm.roundIndex && tm.order === sm.order))
}

onMounted(() => {
  const stored = loadFromStorage()
  if (stored && isBracketCompatible(stored, props.data) && stored.matches?.some(m => m.prediction)) {
    savedBracketData.value = cloneBracketData(stored)
  }
  else {
    const templateCopy = cloneBracketData(props.data)
    savedBracketData.value = templateCopy
    saveToStorage(templateCopy)
  }
})

const selectionState = useSelectionState(
  () => savedBracketData.value ?? props.data,
  () => props.roundNames || {},
)

const {
  isSaving,
  currentRound,
  index,
  match,
  left,
  right,
  currentPick,
  isLocked,
  allRoundMatchesPicked,
  isLastRound,
  roundMatches,
  names,
  selectTeam,
  handleReset,
  navigate,
  maxRound,
} = selectionState

// Computed property for rounds array (for Stepper)
const rounds = computed(() => {
  const roundArray = []
  for (let i = 0; i <= maxRound.value; i++) {
    roundArray.push({
      index: i,
      name: names.value[i] || `Round ${i + 1}`,
    })
  }
  return roundArray
})

// Computed property for match progress
const matchProgress = computed(() => {
  if (roundMatches.value.length === 0)
    return 0
  return ((index.value + 1) / roundMatches.value.length) * 100
})

// Computed property for card selection classes
const leftPanelClass = computed(() => ({
  'cursor-pointer': !isLocked.value,
  'border-primary': currentPick.value === left?.value?.id,
  'opacity-50': isLocked.value && currentPick.value !== left?.value?.id,
}))

const rightPanelClass = computed(() => ({
  'cursor-pointer': !isLocked.value,
  'border-primary': currentPick.value === right?.value?.id,
  'opacity-50': isLocked.value && currentPick.value !== right?.value?.id,
}))

function handleLeftCardClick() {
  if (!isLocked.value) {
    selectTeam(left?.value?.id ?? null)
  }
}

function handleRightCardClick() {
  if (!isLocked.value) {
    selectTeam(right?.value?.id ?? null)
  }
}

const helperMessage = computed(() => {
  if (isLocked.value)
    return 'This round has been locked. Proceed to the next round to continue picking.'
  return allRoundMatchesPicked.value
    ? 'All matchups selected. Confirm to lock in this round.'
    : 'Select a winner for every matchup to enable Confirm Picks.'
})

function verifyRoundPicksPersisted(data: Data, roundPicks: Array<{ roundIndex: number, order: number, teamId: string }>) {
  const matches = data.matches || []
  return roundPicks.every(({ roundIndex, order, teamId }) => {
    const match = matches.find(m => m.roundIndex === roundIndex && m.order === order)
    return match?.prediction === teamId
  })
}

function advanceWinnersToNextRound(data: Data, completedRoundIndex: number): Data {
  const updatedData = cloneBracketData(data)
  const matches = updatedData.matches || []
  const completedMatches = matches.filter(m => m.roundIndex === completedRoundIndex && m.prediction)
  for (const match of completedMatches) {
    const winner = match.prediction
    if (!winner)
      continue
    const targetRoundIndex = completedRoundIndex + 1
    const targetOrder = Math.floor(match.order / 2)
    const targetSideIndex = match.order % 2
    const targetMatch = matches.find(m => m.roundIndex === targetRoundIndex && m.order === targetOrder)
    if (targetMatch) {
      if (!targetMatch.sides || targetMatch.sides.length < 2) {
        targetMatch.sides = [{}, {}]
      }
      targetMatch.sides[targetSideIndex] = {
        ...targetMatch.sides[targetSideIndex],
        teamId: winner,
      }
    }
  }
  return updatedData
}

async function handleSaveAll() {
  if (!allRoundMatchesPicked.value || isSaving.value)
    return

  isSaving.value = true
  try {
    const roundPicks = roundMatches.value
      .map((m) => {
        const key = `${m.roundIndex}:${m.order}`
        const teamId = selectionState.pendingPicks.value[key]
        return teamId
          ? { roundIndex: m.roundIndex, order: m.order, teamId }
          : null
      })
      .filter((pick): pick is { roundIndex: number, order: number, teamId: string } => !!pick)

    for (const m of roundMatches.value) {
      const key = `${m.roundIndex}:${m.order}`
      const teamId = selectionState.pendingPicks.value[key]
      if (teamId) {
        emit('pick', m, teamId)
      }
    }
    if (savedBracketData.value) {
      const updatedData = cloneBracketData(savedBracketData.value)
      Object.entries(selectionState.pendingPicks.value).forEach(([key, teamId]) => {
        const [roundIndex, order] = key.split(':').map(Number)
        const match = updatedData.matches?.find(
          m => m.roundIndex === roundIndex && m.order === order,
        )
        if (match) {
          match.prediction = teamId
        }
      })
      const dataWithAdvanceWinners = advanceWinnersToNextRound(updatedData, currentRound.value)
      saveToStorage(dataWithAdvanceWinners)
      savedBracketData.value = dataWithAdvanceWinners

      if (import.meta.env.DEV) {
        const persisted = loadFromStorage()
        const isSaved = !!persisted && verifyRoundPicksPersisted(persisted, roundPicks)
        if (!isSaved) {
          console.error('[SelectionTool] Round picks were not persisted to localStorage', {
            round: currentRound.value,
            picks: roundPicks,
          })
        }
      }
    }

    const updated = { ...selectionState.pendingPicks.value }
    roundMatches.value.forEach((m) => {
      delete updated[`${m.roundIndex}:${m.order}`]
    })
    selectionState.pendingPicks.value = updated

    emit('refresh')
    emit('save', currentRound.value)

    if (currentRound.value < selectionState.maxRound.value) {
      currentRound.value++
      index.value = 0
    }
  }
  catch (err) {
    console.error('Failed to save picks:', err)
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="selection-tool-wrapper">
    <div v-if="!match" class="selection-tool__empty">
      No matches available for this round.
    </div>

    <div v-else class="selection-tool">
      <div>
        <Stepper :value="(currentRound + 1).toString()" linear class="selection-tool__stepper">
          <StepList>
            <Step
              v-for="round in rounds"
              :key="round.index"
              :value="(round.index + 1).toString()"
            >
              <div
                class="selection-tool__step-label"
                :class="{
                  'is-active': round.index === currentRound,
                  'is-complete': round.index < currentRound,
                }"
              />
            </Step>
          </StepList>
        </Stepper>

        <div class="selection-tool__nav-row">
          <Button
            icon="pi pi-chevron-left"
            text
            class="selection-tool__nav-button"
            aria-label="Previous match"
            :disabled="index === 0"
            @click="navigate(-1)"
          />

          <div class="selection-tool__progress">
            <ProgressBar :value="matchProgress" :show-value="false" />
            <span class="selection-tool__progress-text">
              Match {{ index + 1 }} / {{ roundMatches.length }}
            </span>
          </div>

          <Button
            icon="pi pi-chevron-right"
            text
            class="selection-tool__nav-button"
            aria-label="Next match"
            :disabled="index === roundMatches.length - 1"
            @click="navigate(1)"
          />
        </div>

        <div class="selection-tool__match-list">
          <Panel
            :collapsed="false"
            :toggleable="false"
            class="selection-tool__team-panel"
            :class="leftPanelClass"
            @click="handleLeftCardClick"
          >
            <template #header>
              <div class="selection-tool__panel-header">
                <div class="selection-tool__panel-header-left">
                  <img
                    v-if="left?.logoUrl"
                    class="selection-tool__team-logo"
                    :src="left.logoUrl"
                    :alt="`${left.name} logo`"
                  >
                  <div class="selection-tool__team-title">
                    <span v-if="left?.seed" class="selection-tool__team-seed">({{ left.seed }})</span>
                    <span class="selection-tool__team-name">{{ left?.name || 'TBD' }}</span>
                  </div>
                </div>
                <span v-if="currentPick === left?.id" class="selection-tool__selected-label">
                  Selected
                </span>
              </div>
            </template>

            <div class="selection-tool__panel-body" />
          </Panel>

          <div class="selection-tool__vs-divider">
            VS
          </div>

          <Panel
            :collapsed="false"
            :toggleable="false"
            class="selection-tool__team-panel"
            :class="rightPanelClass"
            @click="handleRightCardClick"
          >
            <template #header>
              <div class="selection-tool__panel-header">
                <div class="selection-tool__panel-header-left">
                  <img
                    v-if="right?.logoUrl"
                    class="selection-tool__team-logo"
                    :src="right.logoUrl"
                    :alt="`${right.name} logo`"
                  >
                  <div class="selection-tool__team-title">
                    <span v-if="right?.seed" class="selection-tool__team-seed">({{ right.seed }})</span>
                    <span class="selection-tool__team-name">{{ right?.name || 'TBD' }}</span>
                  </div>
                </div>
                <span v-if="currentPick === right?.id" class="selection-tool__selected-label">
                  Selected
                </span>
              </div>
            </template>

            <div class="selection-tool__panel-body" />
          </Panel>
        </div>

        <div class="selection-tool__actions">
          <div class="selection-tool__helper">
            {{ helperMessage }}
          </div>
          <div class="selection-tool__action-buttons">
            <Button
              icon="pi pi-refresh"
              severity="secondary"
              outlined
              label="Reset"
              :disabled="isSaving || Object.keys(selectionState.pendingPicks.value).length === 0"
              @click="handleReset"
            />
            <Button
              icon="pi pi-check"
              :label="isLastRound ? 'Save Final Picks' : 'Confirm Picks'"
              :loading="isSaving || saveLoading"
              :disabled="isSaving || saveLoading || !allRoundMatchesPicked"
              @click="handleSaveAll"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
