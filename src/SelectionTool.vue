<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch
} from 'vue'
import { Data, Match } from './lib/data/data'
import './lib/styles/SelectionTool.scss'
import TeamCard from './TeamCard.vue'

interface Props {
  data: Data
  roundNames?: Record<number, string>
}

const props = withDefaults(defineProps<Props>(), {
  roundNames: undefined
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
  5: 'Championship'
}

// State
const pendingPicks = ref<Record<string, string>>({})
const isSaving = ref(false)
const currentRound = ref(0)
const index = ref(0)

// Helpers
const makeMatchKey = (roundIndex: number, order: number) =>
  `${roundIndex}:${order}`

const getMatchKey = (match: Match) =>
  makeMatchKey(match.roundIndex, match.order)

// Computed
const sortedMatches = computed(() =>
  [...(props.data.matches ?? [])].sort(
    (a, b) => a.roundIndex - b.roundIndex || a.order - b.order
  )
)

const maxRound = computed(() =>
  sortedMatches.value.length > 0
    ? Math.max(...sortedMatches.value.map(m => m.roundIndex))
    : -1
)

const names = computed(() => props.roundNames || defaultRoundNames)

const roundMatches = computed(() =>
  sortedMatches.value.filter(m => m.roundIndex === currentRound.value)
)

const match = computed(() => roundMatches.value[index.value])

const matchKey = computed(() =>
  match.value ? getMatchKey(match.value) : ''
)

const left = computed(() => {
  const teamId = match.value?.sides?.[0]?.teamId
  return teamId ? props.data.teams?.[teamId] : undefined
})

const right = computed(() => {
  const teamId = match.value?.sides?.[1]?.teamId
  return teamId ? props.data.teams?.[teamId] : undefined
})

const savedPick = computed(() => match.value?.prediction || '')

const currentPick = computed(() =>
  pendingPicks.value[matchKey.value] || savedPick.value
)

const isLocked = computed(() => !!savedPick.value)

const pendingInRound = computed(() => {
  let count = 0
  for (const m of roundMatches.value) {
    const key = getMatchKey(m)
    if (pendingPicks.value[key]) count++
  }
  return count
})

const allRoundMatchesPicked = computed(
  () =>
    roundMatches.value.length > 0 &&
    pendingInRound.value === roundMatches.value.length
)

const isLastRound = computed(
  () => currentRound.value === maxRound.value
)

// Storage
function loadSelectionState() {
  try {
    const saved = localStorage.getItem(SELECTION_STATE_KEY)
    return saved ? JSON.parse(saved) : { round: 0, matchIndex: 0 }
  } catch {
    return { round: 0, matchIndex: 0 }
  }
}

function saveSelectionState() {
  try {
    localStorage.setItem(
      SELECTION_STATE_KEY,
      JSON.stringify({
        round: currentRound.value,
        matchIndex: index.value
      })
    )
  } catch (err) {
    console.warn('Failed to save selection state:', err)
  }
}

// Actions
function selectTeam(teamId: string | null) {
  if (isLocked.value || !matchKey.value) return
  pendingPicks.value[matchKey.value] = teamId || ''
}

async function handleSaveAll() {
  if (!allRoundMatchesPicked.value || isSaving.value) return

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
    roundMatches.value.forEach(m => {
      delete updated[getMatchKey(m)]
    })
    pendingPicks.value = updated

    emit('refresh')

    // Advance to next round
    if (currentRound.value < maxRound.value) {
      currentRound.value++
      index.value = 0
    }
  } catch (err) {
    console.error('Failed to save picks:', err)
  } finally {
    isSaving.value = false
  }
}

function handleReset() {
  const updated = { ...pendingPicks.value }
  roundMatches.value.forEach(m => {
    delete updated[getMatchKey(m)]
  })
  pendingPicks.value = updated
}

function navigate(delta: number) {
  const newIndex = index.value + delta
  index.value = Math.max(
    0,
    Math.min(roundMatches.value.length - 1, newIndex)
  )
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    navigate(-1)
  } else if (e.key === 'ArrowRight') {
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
  newLength => {
    if (newLength > 0 && index.value >= newLength) {
      index.value = newLength - 1
    }
  }
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
          ‹
        </button>
      </div>

      <div class="selection-tool__panel">
        <div class="selection-tool__header">
          <h4 class="selection-tool__title">
            {{
              names[match.roundIndex] ||
              `Round ${match.roundIndex + 1}`
            }}
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
                ? 'Saving…'
                : isLastRound
                  ? 'Save Final Picks'
                  : 'Save & Continue'
            }}
          </button>
          <button
            type="button"
            class="selection-tool__reset-btn"
            :disabled="isSaving || Object.keys(pendingPicks).length === 0"
            @click="handleReset"
          >
            Reset Round
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
          ›
        </button>
      </div>
    </div>
  </div>
</template>
