<script setup lang="ts">
import type { Data, Match } from '../lib/data/types'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ArrowLeftIcon, ArrowRightIcon } from '../assets/'
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
}>()

const SELECTION_STATE_KEY = 'bracketry:selection:state'

const defaultRoundNames: Record<number, string> = {
  0: 'Round of 64',
  1: 'Round of 32',
  2: 'Sweet 16',
  3: 'Elite 8',
  4: 'Final 4',
  5: 'Championship',
}

// State
const pendingPicks = ref<Record<string, string>>({})
const isSaving = ref(false)
const currentRound = ref(0)
const index = ref(0)

// Helpers
function makeMatchKey(roundIndex: number, order: number) {
  return `${roundIndex}:${order}`
}

function getMatchKey(match: Match) {
  return makeMatchKey(match.roundIndex, match.order)
}

// Computed
const sortedMatches = computed(() =>
  [...(props.data.matches ?? [])].sort(
    (a, b) => a.roundIndex - b.roundIndex || a.order - b.order,
  ),
)

const maxRound = computed(() =>
  sortedMatches.value.length > 0
    ? Math.max(...sortedMatches.value.map(m => m.roundIndex))
    : -1,
)

const names = computed(() => props.roundNames || defaultRoundNames)

const roundMatches = computed(() =>
  sortedMatches.value.filter(m => m.roundIndex === currentRound.value),
)

const match = computed(() => roundMatches.value[index.value])

const matchKey = computed(() => (match.value ? getMatchKey(match.value) : ''))

const left = computed(() => {
  const teamId = match.value?.sides?.[0]?.teamId
  return teamId ? props.data.teams?.[teamId] : undefined
})

const right = computed(() => {
  const teamId = match.value?.sides?.[1]?.teamId
  return teamId ? props.data.teams?.[teamId] : undefined
})

const savedPick = computed(() => match.value?.prediction || '')

const currentPick = computed(
  () => pendingPicks.value[matchKey.value] || savedPick.value,
)

const isLocked = computed(() => !!savedPick.value)

const pendingInRound = computed(() => {
  let count = 0
  for (const m of roundMatches.value) {
    const key = getMatchKey(m)
    if (pendingPicks.value[key])
      count++
  }
  return count
})

const allRoundMatchesPicked = computed(
  () =>
    roundMatches.value.length > 0
    && pendingInRound.value === roundMatches.value.length,
)

const isLastRound = computed(() => currentRound.value === maxRound.value)

// Storage
function loadSelectionState() {
  try {
    const saved = localStorage.getItem(SELECTION_STATE_KEY)
    return saved ? JSON.parse(saved) : { round: 0, matchIndex: 0 }
  }
  catch {
    return { round: 0, matchIndex: 0 }
  }
}

function saveSelectionState() {
  try {
    localStorage.setItem(
      SELECTION_STATE_KEY,
      JSON.stringify({
        round: currentRound.value,
        matchIndex: index.value,
      }),
    )
  }
  catch (err) {
    console.warn('Failed to save selection state:', err)
  }
}

// Actions
function selectTeam(teamId: string | null) {
  if (isLocked.value || !matchKey.value)
    return
  pendingPicks.value[matchKey.value] = teamId || ''
}

async function handleSaveAll() {
  if (!allRoundMatchesPicked.value || isSaving.value)
    return

  isSaving.value = true
  try {
    for (const m of roundMatches.value) {
      const key = getMatchKey(m)
      const teamId = pendingPicks.value[key]
      if (teamId) {
        emit('pick', m, teamId)
      }
    }

    // Clear pending picks for this round
    const updated = { ...pendingPicks.value }
    roundMatches.value.forEach((m) => {
      delete updated[getMatchKey(m)]
    })
    pendingPicks.value = updated

    emit('refresh')

    // Advance to next round
    if (currentRound.value < maxRound.value) {
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

function handleReset() {
  const updated = { ...pendingPicks.value }
  roundMatches.value.forEach((m) => {
    delete updated[getMatchKey(m)]
  })
  pendingPicks.value = updated
}

function navigate(delta: number) {
  const newIndex = index.value + delta
  index.value = Math.max(0, Math.min(roundMatches.value.length - 1, newIndex))
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    navigate(-1)
  }
  else if (e.key === 'ArrowRight') {
    e.preventDefault()
    navigate(1)
  }
}

// Lifecycle
onMounted(() => {
  const state = loadSelectionState()
  currentRound.value = state.round
  index.value = state.matchIndex
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Watchers
watch([currentRound, index], saveSelectionState)

watch(
  () => roundMatches.value.length,
  (newLength) => {
    if (newLength > 0 && index.value >= newLength) {
      index.value = newLength - 1
    }
  },
)
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

.team-card {
  width: 100%;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.625rem;
  border: 1px solid hsl(0 0% 93.3%);
  background: hsl(0 0% 98%);
  transition: box-shadow 120ms ease, border-color 120ms ease;
  cursor: pointer;
  user-select: none;
}

.team-card:hover {
  box-shadow: 0 0.25rem 0.625rem hsla(0 0% 0% / 0.04);
}

.team-card--tbd {
  padding: 0.75rem;
  border: 1px dashed hsl(0 0% 73%);
  text-align: center;
  color: hsl(0 0% 40%);
}

.team-card--selected {
  border: 2px solid hsl(198 100% 44%);
  background: hsla(210 89% 46% / 0.06);
}

.team-card__logo {
  width: 3.5rem;
  height: 3.5rem;
  object-fit: contain;
  border-radius: 0.25rem;
  flex-shrink: 0;
}

.team-card__logo--placeholder {
  background: hsl(0 0% 95%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-card__body {
  flex: 1;
  min-width: 0;
}

.team-card__title {
  font-weight: 700;
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

.team-card__seed {
  font-weight: 700;
  color: hsl(0 0% 40%);
}

.team-card__name {
  font-weight: 700;
}

.team-card__action {
  display: flex;
  align-items: center;
}

.team-card__radio {
  width: 1.1rem;
  height: 1.1rem;
  margin: 0;
  cursor: pointer;
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
