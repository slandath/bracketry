<script setup lang="ts">
import type { Data, Match } from '../lib/data/types'
import { onMounted, ref } from 'vue'
import { ArrowLeftIcon, ArrowRightIcon } from '../assets/'
import { loadFromStorage, saveToStorage, useSelectionState } from '../composables'
import TeamCard from './TeamCard.vue'

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

onMounted(() => {
  const stored = loadFromStorage()
  if (stored && stored.matches?.some(m => m.prediction)) {
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
  matchKey,
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
} = selectionState

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
        const isSaved = verifyRoundPicksPersisted(persisted, roundPicks)
        if (!isSaved) {
          console.error('[SelectionTool] Round picks were not persisted to localStorage', {
            round: currentRound.value,
            picks: roundPicks,
          })
        }
        else {
          console.info('[SelectionTool] Round picks persisted to localStorage', {
            round: currentRound.value,
            picksSaved: roundPicks.length,
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
      <div class="selection-tool__side selection-tool__side--left">
        <button
          aria-label="Previous match"
          class="selection-tool__nav selection-tool__nav--left"
          :disabled="index === 0"
          @click="navigate(-1)"
        >
          <ArrowLeftIcon />
        </button>
      </div>

      <div class="selection-tool__panel">
        <div class="selection-tool__header">
          <h4 class="selection-tool__title">
            {{ names[match.roundIndex] || `Round ${match.roundIndex + 1}` }}
          </h4>
          <div class="selection-tool__position">
            {{ index + 1 }} / {{ roundMatches.length }}
          </div>
        </div>

        <div class="selection-tool__match">
          <TeamCard
            :team="left"
            :checked="currentPick === left?.id"
            :name="`team-selection-${matchKey}`"
            :disabled="isLocked"
            @change="selectTeam(left?.id ?? null)"
          />
          <TeamCard
            :team="right"
            :checked="currentPick === right?.id"
            :name="`team-selection-${matchKey}`"
            :disabled="isLocked"
            @change="selectTeam(right?.id ?? null)"
          />
        </div>

        <div class="selection-tool__controls">
          <button
            type="button"
            class="selection-tool__save-all-btn"
            :disabled="isSaving || saveLoading || !allRoundMatchesPicked"
            @click="handleSaveAll"
          >
            {{
              saveLoading
                ? "Saving..."
                : isSaving
                  ? "Saving…"
                  : isLastRound
                    ? "Save Final Picks"
                    : "Confirm Picks"
            }}
          </button>
          <button
            type="button"
            class="selection-tool__reset-btn"
            :disabled="isSaving || Object.keys(selectionState.pendingPicks.value).length === 0"
            @click="handleReset"
          >
            Reset
          </button>
        </div>
      </div>

      <div class="selection-tool__side selection-tool__side--right">
        <button
          aria-label="Next match"
          class="selection-tool__nav selection-tool__nav--right"
          :disabled="index === roundMatches.length - 1"
          @click="navigate(1)"
        >
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  </div>
</template>
