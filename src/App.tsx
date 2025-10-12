import { useEffect, useRef, useState } from "react";
import bracketData from "./2025-tournament-blank.json";
import { Data, Match } from "./lib/data/data";
import { createBracket } from "./lib/lib.mjs";
import SelectionTool from "./SelectionTool";

const STORAGE_KEY = "bracketry:tournament:v1";

export default function App() {
  // UI state
  const [showSelection, setShowSelection] = useState(false);
  const [tournamentData, setTournamentData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs for bracket rendering and for serializing localStorage writes
  const bracketContainerRef = useRef<HTMLDivElement | null>(null);
  const bracketInstanceRef = useRef<any>(null);
  // Promise-based lock to serialize concurrent handlePick writes
  const writeLockRef = useRef<Promise<void>>(Promise.resolve());

  // On mount: seed localStorage if missing, then read data and build the bracket.
  // Also return a cleanup that uninstalls the bracket instance.
  useEffect(() => {
    try {
      // Seed localStorage with bundled bracket JSON if key not present.
      if (!safeGetItem(STORAGE_KEY)) {
        safeSetItem(STORAGE_KEY, JSON.stringify(bracketData));
      }
    } catch (err) {
      console.error("Failed to seed localStorage:", err);
      setError("Failed to seed localStorage.");
    }

    try {
      // Load data (from storage or fallback to bundled JSON), set state, render bracket.
      const dataToUse = readStoredData();
      setTournamentData(dataToUse);
      buildBracket(dataToUse);
    } catch (err) {
      console.error("Unexpected error initializing app:", err);
      setError("Unexpected initialization error.");
    }

    // Cleanup: uninstall bracket renderer instance on unmount
    return () => {
      try {
        bracketInstanceRef.current?.uninstall?.();
      } catch (err) {
        console.error("Error during bracket cleanup:", err);
      }
    };
  }, []);

  /* safeGetItem
   - Wrapper around localStorage.getItem that catches exceptions (e.g., if access is blocked).
   - Returns string or null and sets an error message on failure.
  */
  function safeGetItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (err) {
      console.error("localStorage.getItem failed", err);
      setError("Unable to access saved data.");
      return null;
    }
  }

  /* safeSetItem
   - Wrapper around localStorage.setItem that catches exceptions and reports failure.
   - Returns boolean success flag.
  */
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

  /* readStoredData
   - Reads the tournament JSON from localStorage and parses it.
   - Falls back to the bundled bracket JSON on missing key or parse error.
   - Surface user-friendly error messages on parse/access failures.
  */
  function readStoredData(): Data {
    try {
      const raw = safeGetItem(STORAGE_KEY);
      if (!raw) return bracketData as unknown as Data;
      try {
        return JSON.parse(raw) as Data;
      } catch (parseErr) {
        // Malformed JSON -> log and fall back to the bundled data
        console.error("Failed to parse bracket data JSON:", parseErr);
        setError("Failed to parse bracket data - using bundled data.");
        return bracketData as unknown as Data;
      }
    } catch (err) {
      // Defensive: catch any unexpected error and fallback to bundled data
      console.error("Error reading stored bracket data:", err);
      setError("Unable to read saved bracket data - using bundled data.");
      return bracketData as unknown as Data;
    }
  }

  /* buildBracket
   - Creates (or re-creates) the external bracket renderer.
   - Uninstalls any prior instance, then calls createBracket with the container element.
   - Catches and surfaces render-time errors.
  */
  function buildBracket(data: Data) {
    if (!bracketContainerRef.current) return;

    try {
      // Uninstall previous renderer (if present) to avoid duplicate DOM or listeners.
      bracketInstanceRef.current?.uninstall?.();
      // Create and store new bracket instance reference.
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

  /* recomputeLaterRoundsFromPicks
   - Propagates user picks (stored in match.prediction or match.result) forward into
     next-round match slots (sides[].teamId) using the flat matches array.
   - Algorithm: for each round r > 0, target match i receives winners from previous
     round matches at indices 2*i and 2*i+1.
   - Mutates the provided `data` in-place (caller should clone if immutability is required).
   - Defensive: ensures sides array exists and clears predictions on target if inputs
     are incomplete.
  */
  function recomputeLaterRoundsFromPicks(data: Data) {
    const matches = data.matches ?? [];
    if (!matches.length) return data;

    // find highest round index present
    const maxRound = Math.max(...matches.map((m) => m.roundIndex));

    for (let r = 1; r <= maxRound; r++) {
      // matches in this round, sorted by order
      const curMatches = matches
        .filter((m) => m.roundIndex === r)
        .sort((a, b) => a.order - b.order);

      // source matches from previous round, sorted by order
      const prevMatches = matches
        .filter((m) => m.roundIndex === r - 1)
        .sort((a, b) => a.order - b.order);

      curMatches.forEach((targetMatch, mi) => {
        const leftSource = prevMatches[mi * 2];
        const rightSource = prevMatches[mi * 2 + 1];

        // Prefer user prediction, then official result.
        const leftWinner = leftSource?.prediction ?? leftSource?.result ?? null;
        const rightWinner =
          rightSource?.prediction ?? rightSource?.result ?? null;

        // Ensure sides array exists and contains objects at indices 0 and 1.
        targetMatch.sides = Array.isArray(targetMatch.sides)
          ? targetMatch.sides
          : [];

        if (!targetMatch.sides[0]) targetMatch.sides[0] = {};
        if (!targetMatch.sides[1]) targetMatch.sides[1] = {};

        // Populate (or clear) teamId based on available winners.
        targetMatch.sides[0].teamId = leftWinner ?? undefined;
        targetMatch.sides[1].teamId = rightWinner ?? undefined;

        // If either input is missing, the target match cannot be confirmed — clear its prediction.
        if (!leftWinner || !rightWinner) {
          delete (targetMatch as any).prediction;
        }
      });
    }

    return data;
  }

  /* handlePick
   - Called when SelectionTool confirms a pick for a single match.
   - Steps:
   * Serializes work via a promise-lock to avoid concurrent write races.
   * Reads the freshest snapshot from localStorage (falls back to bundled data).
   * Sets match.prediction for the specified match.
   * Recomputes downstream slots (repopulate next-round sides).
   * Persists updated data to localStorage, updates React state, and rebuilds the bracket.
   - Throws/logs on failure and surfaces a user-facing error message.
  */
  async function handlePick(match: Match, teamId: string) {
    // The actual work to perform for this pick
    const run = async () => {
      try {
        // Read freshest persisted snapshot (if any).
        const raw = safeGetItem(STORAGE_KEY);
        const persistedBase: Data | null = raw
          ? (JSON.parse(raw) as Data)
          : null;

        // Choose base: persisted snapshot if available, otherwise bundled JSON clone.
        // We purposely avoid using potentially stale React state here.
        const base: Data =
          persistedBase ?? structuredClone(bracketData as unknown as Data);

        // Work on a deep clone so we can mutate safely.
        const nextData: Data = structuredClone(base);
        nextData.matches = nextData.matches ?? [];

        // Find the target match by roundIndex + order (flat matches array).
        const target = nextData.matches.find(
          (m) => m.roundIndex === match.roundIndex && m.order === match.order,
        );
        if (!target) {
          console.warn("handlePick: match not found", match);
          return;
        }

        // Persist user pick into the existing `prediction` field.
        target.prediction = teamId;

        // Recompute downstream rounds so winners populate next-round slots.
        recomputeLaterRoundsFromPicks(nextData);

        // Write updated JSON to localStorage; throw on failure so caller can react.
        if (!safeSetItem(STORAGE_KEY, JSON.stringify(nextData))) {
          throw new Error("Failed to write to localStorage");
        }

        // Update React state and force a bracket rebuild for immediate visual feedback.
        setTournamentData(nextData);
        buildBracket(nextData);
      } catch (err) {
        console.error("handlePick error:", err);
        setError("Failed to apply pick.");
        throw err;
      }
    };

    // Serialize concurrent runs via a promise chain so multiple quick confirms don't overwrite.
    const prev = writeLockRef.current;
    let releaseNext: () => void;
    const next = new Promise<void>((res) => (releaseNext = res));
    writeLockRef.current = prev.then(() => next);

    try {
      // Wait for any previous queued run, then execute this one.
      await prev;
      await run();
    } finally {
      // Release the queue so the next queued run can proceed.
      releaseNext!();
    }
  }

  // Render
  return (
    <div className="app-container">
      {/* Error banner (if any) */}
      {error ? (
        <div className="app-error" role="status" aria-live="polite">
          {error}
        </div>
      ) : null}

      {/* Controls: toggle selection tool */}
      <div className="controls-row">
        <button onClick={() => setShowSelection((s) => !s)}>
          {showSelection ? "Hide" : "Show"} Selection Tool
        </button>
        <small className="controls-note">Toggle the selection test UI</small>
      </div>

      {/* SelectionTool (first-round selection UI) */}
      {showSelection && tournamentData ? (
        <div className="selection-wrapper">
          <SelectionTool data={tournamentData} onPick={handlePick} />
        </div>
      ) : null}

      {/* Container where the bracket renderer mounts */}
      <div ref={bracketContainerRef} className="bracketry-wrapper" />
    </div>
  );
}
