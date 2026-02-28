import type { Data, Match } from '../lib/data/types'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

/**
 * LocalStorage key used for persisting selection state (current round and match index).
 */
export const SELECTION_STATE_KEY = 'bracketry:selection:state'

const defaultRoundNames: Record<number, string> = {
  0: 'Round of 64',
  1: 'Round of 32',
  2: 'Sweet 16',
  3: 'Elite 8',
  4: 'Final 4',
  5: 'Championship',
}

/**
 * Manages the state of the bracket selection interface.
 * Handles navigation between rounds/matches, team selection, and keyboard shortcuts.
 * Persists the current position (round and match index) to localStorage.
 *
 * @param data - Function that returns the tournament Data
 * @param roundNames - Optional function that returns custom round names
 * @returns Selection state and navigation methods
 */
export function useSelectionState(data: () => Data, roundNames?: () => Record<number, string>) {
  const pendingPicks = ref<Record<string, string>>({})
  const isSaving = ref(false)
  const currentRound = ref(0)
  const index = ref(0)

  function makeMatchKey(roundIndex: number, order: number) {
    return `${roundIndex}:${order}`
  }

  function getMatchKey(match: Match) {
    return makeMatchKey(match.roundIndex, match.order)
  }

  const sortedMatches = computed(() =>
    [...(data().matches ?? [])].sort(
      (a, b) => a.roundIndex - b.roundIndex || a.order - b.order,
    ),
  )

  const maxRound = computed(() =>
    sortedMatches.value.length > 0
      ? Math.max(...sortedMatches.value.map(m => m.roundIndex))
      : -1,
  )

  const names = computed(() => roundNames?.() || defaultRoundNames)

  const roundMatches = computed(() =>
    sortedMatches.value.filter(m => m.roundIndex === currentRound.value),
  )

  const match = computed(() => roundMatches.value[index.value])

  const matchKey = computed(() => (match.value ? getMatchKey(match.value) : ''))

  const left = computed(() => {
    const teamId = match.value?.sides?.[0]?.teamId
    return teamId ? data().teams?.[teamId] : undefined
  })

  const right = computed(() => {
    const teamId = match.value?.sides?.[1]?.teamId
    return teamId ? data().teams?.[teamId] : undefined
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

  function selectTeam(teamId: string | null) {
    if (isLocked.value || !matchKey.value)
      return
    pendingPicks.value[matchKey.value] = teamId || ''
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

  onMounted(() => {
    const state = loadSelectionState()
    currentRound.value = state.round
    index.value = state.matchIndex
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  watch([currentRound, index], saveSelectionState)

  watch(
    () => roundMatches.value.length,
    (newLength) => {
      if (newLength > 0 && index.value >= newLength) {
        index.value = newLength - 1
      }
    },
  )

  return {
    pendingPicks,
    isSaving,
    currentRound,
    index,
    match,
    matchKey,
    left,
    right,
    savedPick,
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
  }
}
