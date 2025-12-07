import { BracketScore, Match } from "./data/data";

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

export { resultsComparison };
