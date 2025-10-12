import { useEffect, useRef, useState } from "react";
import bracketData from "./2025-tournament-blank.json";
import { Data, Match } from "./lib/data/data";
import { createBracket } from "./lib/lib.mjs";
import SelectionTool from "./SelectionTool";

const STORAGE_KEY = "bracketry:tournament:v1";

export default function App() {
  const [showSelection, setShowSelection] = useState(false);
  const [tournamentData, setTournamentData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bracketContainerRef = useRef<HTMLDivElement | null>(null);
  const bracketInstanceRef = useRef<any>(null);
  const writeLockRef = useRef<Promise<void>>(Promise.resolve());

  // Initialize on mount
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bracketData));
      }
      const data = readStoredData();
      setTournamentData(data);
    } catch (err) {
      console.error("Initialization failed:", err);
      setError("Failed to load bracket data.");
    }

    return () => bracketInstanceRef.current?.uninstall?.();
  }, []);

  // Rebuild bracket when data changes
  useEffect(() => {
    if (!tournamentData?.matches || !bracketContainerRef.current) return;

    try {
      bracketInstanceRef.current?.uninstall?.();
      bracketInstanceRef.current = createBracket(
        tournamentData,
        bracketContainerRef.current,
        {}
      );

      injectMatchStatuses(bracketContainerRef.current, tournamentData.matches);
    } catch (err) {
      console.error("Bracket render failed:", err);
      setError("Failed to render bracket.");
    }

    return () => bracketInstanceRef.current?.uninstall?.();
  }, [tournamentData]);

  function readStoredData(): Data {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return bracketData as unknown as Data;

    try {
      return JSON.parse(raw) as Data;
    } catch {
      console.warn("Corrupted bracket data, using default");
      return bracketData as unknown as Data;
    }
  }

  function injectMatchStatuses(container: HTMLElement, matches: Match[]) {
    // Build lookup map: "roundIndex:order" -> matchStatus
    const statusMap = new Map<string, string>();
    matches.forEach((m) => {
      if (m.matchStatus) {
        statusMap.set(`${m.roundIndex}:${m.order}`, m.matchStatus);
      }
    });

    container.querySelectorAll(".match-wrapper").forEach((wrapper) => {
      const order = wrapper.getAttribute("match-order");
      const round = wrapper
        .closest(".round-wrapper")
        ?.getAttribute("round-index");

      if (!order || !round) return;

      const status = statusMap.get(`${round}:${order}`);
      if (!status) return;

      let statusDiv = wrapper.querySelector<HTMLDivElement>(".match-status");
      if (!statusDiv) {
        statusDiv = document.createElement("div");
        statusDiv.className = "match-status";
        wrapper.querySelector(".match-body")?.appendChild(statusDiv);
      }
      statusDiv.textContent = status;
    });
  }

function recomputeLaterRoundsFromPicks(data: Data) {
  const matches = data.matches ?? [];
  const maxRound = Math.max(...matches.map((m) => m.roundIndex));

  for (let r = 1; r <= maxRound; r++) {
    const curMatches = matches
      .filter((m) => m.roundIndex === r)
      .sort((a, b) => a.order - b.order);

    const prevMatches = matches
      .filter((m) => m.roundIndex === r - 1)
      .sort((a, b) => a.order - b.order);

    curMatches.forEach((target, i) => {
      const left = prevMatches[i * 2];
      const right = prevMatches[i * 2 + 1];

      const leftWinner = left?.prediction || left?.result || null;
      const rightWinner = right?.prediction || right?.result || null;

      // Ensure sides array exists with proper structure
      if (!Array.isArray(target.sides)) {
        target.sides = [];
      }
      if (!target.sides[0]) {
        target.sides[0] = {};
      }
      if (!target.sides[1]) {
        target.sides[1] = {};
      }

      target.sides[0].teamId = leftWinner ?? undefined;
      target.sides[1].teamId = rightWinner ?? undefined;

      if (leftWinner && rightWinner) {
        target.matchStatus = "Predicted";
      } else {
        delete target.prediction;
        if (target.matchStatus === "Predicted") {
          target.matchStatus = "Scheduled";
        }
      }
    });
  }

  return data;
}

  async function handlePick(match: Match, teamId: string) {
    const run = async () => {
      const base = readStoredData();
      const updated = structuredClone(base);

      const target = updated.matches?.find(
        (m) => m.roundIndex === match.roundIndex && m.order === match.order
      );

      if (!target) return;

      target.prediction = teamId;
      recomputeLaterRoundsFromPicks(updated);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setTournamentData(updated);
    };

    const prev = writeLockRef.current;
    const next = prev.then(run).catch((err) => {
      console.error("Pick failed:", err);
      setError("Failed to save pick.");
    });
    writeLockRef.current = next;
    await next;
  }

  function refreshBracketFromStorage() {
    try {
      setTournamentData(readStoredData());
    } catch (err) {
      console.error("Refresh failed:", err);
      setError("Failed to refresh bracket.");
    }
  }

  return (
    <div className="app-container">
      {error && (
        <div className="app-error" role="alert">
          {error}
        </div>
      )}

      <div className="controls-row">
        <button onClick={() => setShowSelection((s) => !s)}>
          {showSelection ? "Hide" : "Show"} Selection Tool
        </button>
      </div>

      {showSelection && tournamentData && (
        <SelectionTool
          data={tournamentData}
          onPick={handlePick}
          onRefresh={refreshBracketFromStorage}
        />
      )}

      <div ref={bracketContainerRef} className="bracketry-wrapper" />
    </div>
  );
}
