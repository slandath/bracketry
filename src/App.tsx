import { useEffect, useRef, useState } from "react";
import bracketData from "./2025-tournament-blank.json";
import { Data, Match } from "./lib/data/data";
import { createBracket } from "./lib/lib.mjs";
import SelectionTool from "./SelectionTool";

const STORAGE_KEY = "bracketry:tournament:v1";

export default function App() {
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [tournamentData, setTournamentData] = useState<Data | null>(null);

  const bracketContainerRef = useRef<HTMLDivElement | null>(null);
  const bracketInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bracketData));
    }
    setTournamentData(readStoredData());
  }, []);

  useEffect(() => {
    if (!tournamentData?.matches || !bracketContainerRef.current) return;
    bracketInstanceRef.current?.uninstall?.();
    bracketInstanceRef.current = createBracket(
      tournamentData,
      bracketContainerRef.current,
      {},
    );
    injectMatchStatuses(bracketContainerRef.current, tournamentData.matches);

    return () => bracketInstanceRef.current?.uninstall?.();
  }, [tournamentData]);

  function readStoredData(): Data {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return bracketData as Data;

    try {
      return JSON.parse(raw) as Data;
    } catch {
      console.warn("Corrupted bracket data, using default");
      return bracketData as unknown as Data;
    }
  }

  function injectMatchStatuses(container: HTMLElement, matches: Match[]) {
    const statusMap = new Map(
      matches
        .filter((m) => m.matchStatus)
        .map((m) => [`${m.roundIndex}:${m.order}`, m.matchStatus!]),
    );

    container.querySelectorAll(".match-wrapper").forEach((wrapper) => {
      const order = wrapper.getAttribute("match-order");
      const round = wrapper
        .closest(".round-wrapper")
        ?.getAttribute("round-index");

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

        target.sides = [
          { ...target.sides?.[0], teamId: leftWinner ?? undefined },
          { ...target.sides?.[1], teamId: rightWinner ?? undefined },
        ];

        if (!leftWinner || !rightWinner) {
          delete target.prediction;
          target.matchStatus =
            target.matchStatus === "Predicted"
              ? "Scheduled"
              : target.matchStatus;
        } else {
          target.matchStatus = "Predicted";
        }
      });
    }
    return data;
  }

  function handlePick(match: Match, teamId: string) {
    const updated = structuredClone(readStoredData());
    const target = updated.matches?.find(
      (m) => m.roundIndex === match.roundIndex && m.order === match.order,
    );
    if (!target) return;

    target.prediction = teamId;
    recomputeLaterRoundsFromPicks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTournamentData(updated);
  }

  function refreshBracketFromStorage() {
    setTournamentData(readStoredData());
  }

  return (
    <div className="app-container">
      {isSelectionOpen && tournamentData && (
        <dialog className="selection-modal" open>
          <div className="selection-modal__content">
            <button
              className="selection-modal__close"
              onClick={() => setIsSelectionOpen(false)}
              aria-label="Close"
            >
              x
            </button>
            <SelectionTool
              data={tournamentData}
              onPick={handlePick}
              onRefresh={refreshBracketFromStorage}
            />
          </div>
        </dialog>
      )}

      <div
        ref={bracketContainerRef}
        className="bracketry-wrapper"
        style={{ filter: isSelectionOpen ? "blur(4px)" : "none" }}
      />
      <button
        className="open-selection-btn"
        onClick={() => setIsSelectionOpen(true)}
      >
        Make Predictions
      </button>
    </div>
  );
}
