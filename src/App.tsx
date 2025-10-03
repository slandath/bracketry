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

  function readStoredData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore parse/storage errors
    }
    return bracketData as unknown as Data;
  }

  function buildBracket(data: any) {
    if (!bracketContainerRef.current) return;
    bracketInstanceRef.current?.uninstall?.();
    bracketInstanceRef.current = createBracket(
      data,
      bracketContainerRef.current,
      {},
    );
  }

  function handlePick(match: any, teamId: string) {
    // For now just log. You can extend to persist prediction into localStorage.
    console.log("Picked", teamId, "for match", match);
  }

  useEffect(() => {
    // seed storage if empty
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bracketData));
      }
    } catch {
      // localStorage may be disabled — fall back to bundled data
    }

    const dataToUse = readStoredData();
    setTournamentData(dataToUse);
    buildBracket(dataToUse);

    return () => {
      bracketInstanceRef.current?.uninstall?.();
    };
  }, []);

  return (
    <div style={{ padding: 12 }}>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <button onClick={() => setShowSelection((s) => !s)}>
          {showSelection ? "Hide" : "Show"} Selection Tool
        </button>
        <small style={{ color: "#666" }}>Toggle the selection test UI</small>
      </div>

      {showSelection && tournamentData ? (
        <div style={{ marginBottom: 12 }}>
          <SelectionTool data={tournamentData} onPick={handlePick} />
        </div>
      ) : null}

      {/* This div is where createBracket will render */}
      <div ref={bracketContainerRef} className="bracketry-wrapper" />
    </div>
  );
}
