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
  () => props.roundNames,
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
            :disabled="isSaving || Object.keys(pendingPicks).length === 0"
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

<style scoped>
.selection-tool-wrapper {
  display: block;
  margin: 0;
}

.selection-tool {
  padding: 0.75rem;
  max-width: 21.875rem;
  background: hsl(0 0% 100%);
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.5rem;
  align-items: center;
}

.selection-tool__title {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
}

.selection-tool__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.selection-tool__match {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: stretch;
}

.selection-tool__controls {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.selection-tool__save-all-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid hsl(0 0% 87.3%);
  background: hsl(0 0% 100%);
  cursor: pointer;
  font-weight: 700;
}

.selection-tool__save-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selection-tool__reset-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid hsl(0 0% 87.3%);
  background: hsl(0 0% 100%);
  cursor: pointer;
  font-weight: 700;
}

.selection-tool__reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selection-tool__position {
  font-size: 0.9rem;
  color: hsl(0 0% 40%);
}

.selection-tool__side {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.selection-tool__side--left {
  justify-content: flex-start;
}

.selection-tool__side--right {
  justify-content: flex-end;
}

.selection-tool__nav {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid hsl(0 0% 93.3%);
  background: hsl(0 0% 100%);
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  box-shadow: 0 1px 2px hsla(0 0% 0% / 0.04);
  user-select: none;
}

.selection-tool__nav:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.open-selection-btn {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 700;
  background: hsl(198 100% 44%);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  margin: 1rem auto;
}

.open-selection-btn:hover {
  opacity: 0.9;
}

.selection-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  border: none;
  padding: 0;
  animation: modalFadeIn 0.3s ease-out;
}

.selection-modal::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.selection-modal__content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 1rem;
  border: 1px solid hsl(0 0% 73%);
  box-sizing: border-box;
}

.selection-modal__close {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: white;
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.selection-modal__close:hover {
  opacity: 0.8;
}

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease-out;
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.05);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
