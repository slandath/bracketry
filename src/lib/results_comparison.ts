import { BracketScore, Match } from "./data/data"

function predictionResultDataMerge(bracket: { matches: Match[] }, results: Match[]) {
    const merged = bracket.matches.map((match) => {
        const foo = results.find(result => result.id === match.id)
        match.result = foo?.result
        return match
    })
    return merged
}

function resultsComparison(matchArray: Match[]) {
    const scoreObject: BracketScore = {
        "correctPicks": 0
    }
    const evaluation = matchArray.reduce(
        (count, currentValue) => {
           if (currentValue.prediction === currentValue.result) {
            return count + 1
           } else {
            return count
           }
        },
        0
    )
    scoreObject.correctPicks = evaluation
    return scoreObject
    }

export { predictionResultDataMerge, resultsComparison }
