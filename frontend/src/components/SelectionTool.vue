<script setup lang="ts">
import type { Data, Match } from '../lib/data/types'
import { ArrowLeftIcon, ArrowRightIcon } from '../assets/'
import { useSelectionState } from '../composables'
import TeamCard from './TeamCard.vue'

interface Props {
  data: Data
  roundNames?: Record<number, string>
}

const props = withDefaults(defineProps<Props>(), {
  roundNames: undefined,
})

const emit = defineEmits<{
  pick: [match: Match, teamId: string]
  refresh: []
  save: []
}>()

const selectionState = useSelectionState(
  () => props.data,
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

async function handleSaveAll() {
  if (!allRoundMatchesPicked.value || isSaving.value)
    return

  isSaving.value = true
  try {
    for (const m of roundMatches.value) {
      const key = `${m.roundIndex}:${m.order}`
      const teamId = selectionState.pendingPicks.value[key]
      if (teamId) {
        emit('pick', m, teamId)
      }
    }

    const updated = { ...selectionState.pendingPicks.value }
    roundMatches.value.forEach((m) => {
      delete updated[`${m.roundIndex}:${m.order}`]
    })
    selectionState.pendingPicks.value = updated

    emit('refresh')
    emit('save')

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
            :disabled="isSaving || !allRoundMatchesPicked"
            @click="handleSaveAll"
          >
            {{
              isSaving
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
