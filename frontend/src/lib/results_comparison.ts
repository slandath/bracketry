import type { BracketScore, Data, Match } from './data/types'

function evaluateUserPicks(
  userBracket: Data,
  actualResults: Match[],
): Data | null {
  const mergedMatches = (userBracket.matches || []).map((prediction: Match) => {
    const resultMatch = actualResults.find(m => m.id === prediction.id)
    if (!resultMatch || !resultMatch.result)
      return null
    return {
      ...prediction,
      result: resultMatch.result,
      sides: resultMatch.sides || prediction.sides,
      matchStatus: resultMatch.matchStatus || prediction.matchStatus,
    }
  }).filter(Boolean) as Match[]

  return { ...userBracket, matches: mergedMatches }
}

function scoreUserPics(matchArray: Match[]) {
  const scoreObject: BracketScore = {
    correctPicks: 0,
  }
  const evaluation = matchArray.reduce((count, currentValue) => {
    if (currentValue.prediction === currentValue.result) {
      return count + 1
    }
    else {
      return count
    }
  }, 0)
  scoreObject.correctPicks = evaluation
  return scoreObject
}

export { evaluateUserPicks, scoreUserPics }
