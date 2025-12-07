import { BracketScore, Data, Match } from "./data/data";
const STORAGE_KEY = "bracketry:tournament:v1";

async function evaluateUserPicks() {
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (!item) return;
    const userBracket: Data = JSON.parse(item);
    const response = await fetch("/results.json");
    const gameScores: Data = await response.json();
    const mergedData = (userBracket.matches || []).map((prediction: Match) => ({
      ...prediction,
      ...(gameScores.matches || []).find((m) => m.id === prediction.id),
    }));
    return { ...userBracket, matches: mergedData };
  } catch (error) {
    console.error("Failed to load bracket data", error);
  }
}

function scoreUserPics(matchArray: Match[]) {
  const scoreObject: BracketScore = {
    correctPicks: 0,
  };
  const evaluation = matchArray.reduce((count, currentValue) => {
    if (currentValue.prediction === currentValue.result) {
      return count + 1;
    } else {
      return count;
    }
  }, 0);
  scoreObject.correctPicks = evaluation;
  return scoreObject;
}

export { evaluateUserPicks, scoreUserPics };
