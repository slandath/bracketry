import type { Data, Match } from '../lib/data/types'
import { ref } from 'vue'
import { loadFromStorage, saveToStorage } from './useBracketStorage'

export function useBracketState() {
  const tournamentData = ref<Data>(loadFromStorage())

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
  }

  function refreshData() {
    tournamentData.value = loadFromStorage()
  }

  return {
    tournamentData,
    handlePick,
    refreshData,
    recomputeRounds,
  }
}
