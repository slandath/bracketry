import { useEffect, useRef, useState } from "react";
import bracketData from "./2025-tournament-blank.json";
import { Data, Match } from "./lib/data/data";
import { createBracket } from "./lib/lib.mjs";
import SelectionTool from "./SelectionTool";

const STORAGE_KEY = "bracketry:tournament:v1";

export default function App() {
  const bracketContainerRef = useRef<HTMLDivElement | null>(null);
  const bracketInstanceRef = useRef<any>(null);
  const writeLockRef = useRef<Promise<void>>(Promise.resolve());
  const [showSelection, setShowSelection] = useState(false);
  const [tournamentData, setTournamentData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  // safe localStorage ops
  function safeGetItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.error("localStorage.getItem failed", err);
      setError("Unable to access saved data.");
      return null;
    }
  }
  function safeSetItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err) {
      console.error("localStorage.setItem failed", err);
      setError("Unable to save picks to local storage.");
      return false;
    }
  }

  function readStoredData(): Data {
    try {
      const raw = safeGetItem(STORAGE_KEY);
      if (!raw) return bracketData as unknown as Data;
      try {
        return JSON.parse(raw) as Data;
      } catch (parseErr) {
        console.error("Failed to parse bracket data JSON:", parseErr);
        setError("Failed to parse bracket data - using bundled data.");
        return bracketData as unknown as Data;
      }
    } catch (err) {
      console.error("Error reading stored bracket data:", err);
      setError("Unable to read saved bracket data - using bundled data.");
      return bracketData as unknown as Data;
    }
  }

  function buildBracket(data: Data) {
    if (!bracketContainerRef.current) return;
    try {
      bracketInstanceRef.current?.uninstall?.();
      bracketInstanceRef.current = createBracket(
        data,
        bracketContainerRef.current,
        {},
      );
    } catch (err) {
      console.error("Failed to build bracket:", err);
      setError("An error occurred while rendering the bracket.");
    }
  }

  function recomputeLaterRoundsFromPicks(data: Data) {
    const matches = data.matches ?? [];
    if (!matches.length) return data;

    const maxRound = Math.max(...matches.map((m) => m.roundIndex));

    for (let r = 1; r <= maxRound; r++) {
      const curMatches = matches
        .filter((m) => m.roundIndex === r)
        .sort((a, b) => a.order - b.order);

      const prevMatches = matches
        .filter((m) => m.roundIndex === r - 1)
        .sort((a, b) => a.order - b.order);

      curMatches.forEach((targetMatch, mi) => {
        const leftSource = prevMatches[mi * 2];
        const rightSource = prevMatches[mi * 2 + 1];

        const leftWinner = leftSource?.prediction ?? leftSource?.result ?? null;
        const rightWinner =
          rightSource?.prediction ?? rightSource?.result ?? null;

        targetMatch.sides = Array.isArray(targetMatch.sides)
          ? targetMatch.sides
          : [];

        if (!targetMatch.sides[0]) targetMatch.sides[0] = {};
        if (!targetMatch.sides[1]) targetMatch.sides[1] = {};

        targetMatch.sides[0].teamId = leftWinner ?? undefined;
        targetMatch.sides[1].teamId = rightWinner ?? undefined;

        // if either source is missing, clear any locked pick on the target
        if (!leftWinner || !rightWinner) {
          delete (targetMatch as any).prediction;
        }
      });
    }

    return data;
  }

  async function handlePick(match: Match, teamId: string) {
    const run = async () => {
      try {
        const raw = safeGetItem(STORAGE_KEY);
        const persistedBase: Data | null = raw
          ? (JSON.parse(raw) as Data)
          : null;
        const base: Data =
          persistedBase ?? structuredClone(bracketData as unknown as Data);
        const nextData: Data = structuredClone(base);
        nextData.matches = nextData.matches ?? [];

        const target = nextData.matches.find(
          (m) => m.roundIndex === match.roundIndex && m.order === match.order,
        );
        if (!target) {
          console.warn("handlePick: match not found", match);
          return;
        }

        target.prediction = teamId;
        recomputeLaterRoundsFromPicks(nextData);

        if (!safeSetItem(STORAGE_KEY, JSON.stringify(nextData))) {
          throw new Error("Failed to write to localStorage");
        }

        setTournamentData(nextData);
        buildBracket(nextData);
      } catch (err) {
        console.error("handlePick error:", err);
        setError("Failed to apply pick.");
        throw err;
      }
    };

    const prev = writeLockRef.current;
    let releaseNext: () => void;
    const next = new Promise<void>((res) => (releaseNext = res));
    writeLockRef.current = prev.then(() => next);

    try {
      await prev;
      await run();
    } finally {
      releaseNext!();
    }
  }

  useEffect(() => {
    try {
      if (!safeGetItem(STORAGE_KEY)) {
        safeSetItem(STORAGE_KEY, JSON.stringify(bracketData));
      }
    } catch (err) {
      console.error("Failed to seed localStorage:", err);
      setError("Failed to seed localStorage.");
    }

    try {
      const dataToUse = readStoredData();
      setTournamentData(dataToUse);
      buildBracket(dataToUse);
    } catch (err) {
      console.error("Unexpected error initializing app:", err);
      setError("Unexpected initialization error.");
    }

    return () => {
      try {
        bracketInstanceRef.current?.uninstall?.();
      } catch (err) {
        console.error("Error during bracket cleanup:", err);
      }
    };
  }, []);

  return (
    <div className="app-container">
      {error ? (
        <div className="app-error" role="status" aria-live="polite">
          {error}
        </div>
      ) : null}
      <div className="controls-row">
        <button onClick={() => setShowSelection((s) => !s)}>
          {showSelection ? "Hide" : "Show"} Selection Tool
        </button>
        <small className="controls-note">Toggle the selection test UI</small>
      </div>

      {showSelection && tournamentData ? (
        <div className="selection-wrapper">
          <SelectionTool data={tournamentData} onPick={handlePick} />
        </div>
      ) : null}

      <div ref={bracketContainerRef} className="bracketry-wrapper" />
    </div>
  );
}
