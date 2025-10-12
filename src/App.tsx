import { useEffect, useRef, useState } from "react";
import bracketData from "./2025-tournament-blank.json";
import { Data } from "./lib/data/data";
import { createBracket } from "./lib/lib.mjs";
import SelectionTool from "./SelectionTool";

const STORAGE_KEY = "bracketry:tournament:v1";

export default function App() {
  const bracketContainerRef = useRef<HTMLDivElement | null>(null);
  const bracketInstanceRef = useRef<any>(null);
  const [showSelection, setShowSelection] = useState(false);
  const [tournamentData, setTournamentData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);


  function readStoredData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return bracketData as unknown as Data;
      try {
        return JSON.parse(raw) as Data;
      } catch (parseErr) {
        // Malformed JSON in localStorage - report and fall back to bundled data
        console.error("Failed to parse bracket data JSON:", parseErr);
        setError("Failed to parse bracket data - using bundled data.");
        return bracketData as unknown as Data
    }
  } catch (err) {
      // localStorage access (or other) error
      console.error("Error reading stored bracket data:", err);
      setError("Unable to read saved bracket data - using bundled data.");
      return bracketData as unknown as Data;
    }
  }

  function buildBracket(data: any) {
    if (!bracketContainerRef.current) return;
    try {
      bracketInstanceRef.current?.uninstall?.();
      bracketInstanceRef.current = createBracket(
        data, bracketContainerRef.current,{}
      )
    } catch (err) {
      console.error("Failed to build bracket:", err);
      setError("An error occured while rendering the bracket.");
    }
  }

  function handlePick(match: any, teamId: string) {
    console.log("Picked", teamId, "for match", match);
  }

  useEffect(() => {
    // Seed localStorage if missing.  If this fails, we show an error but continue by falling back to bundled data.
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bracketData));
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
        // Defensive catch: readStoredData/buildBracket already surfaces most errors, but this guard the effect so the app doesn't crash.
        console.error("Unexpected error initializng app:", err);
        setError("Unexpected initialization error.");
      }
      return () => {
        try {
        bracketInstanceRef.current?.uninstall?.();
        } catch (err) {
          console.error("Error during bracket cleanup:", err);
        }
      }
  }, []);

  return (
    <div className="app-container">
      {error ? (
        <div className="app-error" role="status" aria-live="polite">
          {error}
          </div>
      ): null}
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

      {/* This div is where createBracket will render */}
      <div ref={bracketContainerRef} className="bracketry-wrapper" />
    </div>
  );
}
