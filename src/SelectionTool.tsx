import { useEffect, useState } from "react";
import { Data, Match, Team } from "./lib/data/data";
import "./lib/styles/SelectionTool.scss";

type Props = {
  data: Data;
  onPick?: (match: Match, teamId: string) => void;
  onRefresh?: () => void;
  roundNames?: Record<number, string>;
};

export default function SelectionTool({
  data,
  onPick,
  onRefresh,
  roundNames,
}: Props) {
  const SELECTION_STATE_KEY = "bracketry:selection:state";

  const getInitialState = () => {
    try {
      const saved = localStorage.getItem(SELECTION_STATE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (err) {
      console.warn("Failed to restore selection state:", err);
    }
    return { round: 0, matchIndex: 0 };
  };

  const [pendingPicks, setPendingPicks] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [currentRound, setCurrentRound] = useState(
    () => getInitialState().round,
  );
  const [index, setIndex] = useState(() => getInitialState().matchIndex);

  const allMatches = (data?.matches ?? []).sort(
    (a, b) => a.roundIndex - b.roundIndex || a.order - b.order,
  );

  const maxRound = Math.max(...allMatches.map((m) => m.roundIndex), -1);
  const defaultRoundNames: Record<number, string> = {
    0: "Round of 64",
    1: "Round of 32",
    2: "Sweet 16",
    3: "Elite 8",
    4: "Final 4",
    5: "Championship",
  };

  const names = roundNames || defaultRoundNames;
  const roundMatches = allMatches
    .filter((m) => m.roundIndex === currentRound)
    .sort((a, b) => a.order - b.order);

  const match = roundMatches[index];

  if (!match) {
    return (
      <div className="selection-tool__empty">
        No matches available for this round.
      </div>
    );
  }

  const matchKey = `${match.roundIndex}:${match.order}`;
  const [left, right] = (match.sides ?? []).map((side) =>
    side?.teamId ? data.teams?.[side.teamId] : undefined,
  );

  const savedPick = match.prediction || "";
  const currentPick = pendingPicks[matchKey] || savedPick;
  const isLocked = !!savedPick;

  const roundMatchKeys = new Set(
    roundMatches.map((m) => `${m.roundIndex}:${m.order}`),
  );
  const pendingInRound = Object.entries(pendingPicks).filter(
    ([key, teamId]) => roundMatchKeys.has(key) && teamId,
  ).length;
  const allRoundMatchesPicked = pendingInRound === roundMatches.length;

  useEffect(() => {
    if (index >= roundMatches.length && roundMatches.length > 0) {
      setIndex(roundMatches.length - 1);
    }
  }, [roundMatches.length, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setIndex((i: number) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setIndex((i: number) => Math.min(roundMatches.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [roundMatches.length]);

  useEffect(() => {
    localStorage.setItem(
      SELECTION_STATE_KEY,
      JSON.stringify({ round: currentRound, matchIndex: index }),
    );
  }, [currentRound, index]);

  const selectTeam = (teamId: string | null) => {
    if (isLocked) return;
    setPendingPicks((prev) => ({ ...prev, [matchKey]: teamId || "" }));
  };

  const handleSaveAll = async () => {
    if (!onPick || !allRoundMatchesPicked) return;

    setIsSaving(true);

    try {
      for (const m of roundMatches) {
        const key = `${m.roundIndex}:${m.order}`;
        const teamId = pendingPicks[key];
        if (teamId) await Promise.resolve(onPick(m, teamId));
      }

      setPendingPicks((prev) => {
        const updated = { ...prev };
        roundMatches.forEach((m) => {
          delete updated[`${m.roundIndex}:${m.order}`];
        });
        return updated;
      });

      onRefresh?.();

      if (currentRound < maxRound) {
        setCurrentRound((r: number) => r + 1);
        setIndex(0);
      }
    } catch (err) {
      console.error("Failed to save picks:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPendingPicks({});
    setIndex(0);
  };

  const navigate = (delta: number) => {
    setIndex((i: number) =>
      Math.max(0, Math.min(roundMatches.length - 1, i + delta)),
    );
  };

  const isLastRound = currentRound === maxRound;

  return (
    <div className="selection-tool-wrapper">
      <div className="selection-tool">
        <div className="selection-tool__side selection-tool__side--left">
          <button
            aria-label="Previous match"
            className="selection-tool__nav selection-tool__nav--left"
            onClick={() => navigate(-1)}
            disabled={index === 0}
          >
            ‹
          </button>
        </div>

        <div className="selection-tool__panel">
          <div className="selection-tool__header">
            <h4 className="selection-tool__title">
              {names[match.roundIndex] || `Round ${match.roundIndex + 1}`}
            </h4>
            <div className="selection-tool__position">
              {index + 1} / {roundMatches.length}
            </div>
          </div>

          <div className="selection-tool__match">
            <TeamCard
              team={left}
              checked={currentPick === left?.id}
              onChange={() => selectTeam(left?.id ?? null)}
              name={`team-selection-${matchKey}`}
              disabled={isLocked}
            />
            <TeamCard
              team={right}
              checked={currentPick === right?.id}
              onChange={() => selectTeam(right?.id ?? null)}
              name={`team-selection-${matchKey}`}
              disabled={isLocked}
            />
          </div>

          <div className="selection-tool__controls">
            <button
              type="button"
              className="selection-tool__save-all-btn"
              onClick={handleSaveAll}
              disabled={isSaving || !allRoundMatchesPicked}
            >
              {isSaving
                ? "Saving…"
                : isLastRound
                  ? "Save Final Picks"
                  : "Save & Continue"}
            </button>
            <button
              type="button"
              className="selection-tool__reset-btn"
              onClick={handleReset}
              disabled={isSaving || Object.keys(pendingPicks).length === 0}
            >
              Reset Round
            </button>
          </div>
        </div>

        <div className="selection-tool__side selection-tool__side--right">
          <button
            aria-label="Next match"
            className="selection-tool__nav selection-tool__nav--right"
            onClick={() => navigate(1)}
            disabled={index === roundMatches.length - 1}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamCard({
  team,
  onChange,
  checked,
  name,
  disabled,
}: {
  team?: Team;
  onChange?: () => void;
  checked?: boolean;
  name?: string;
  disabled?: boolean;
}) {
  if (!team) {
    return <div className="team-card team-card--tbd">TBD</div>;
  }

  return (
    <label
      className={`team-card ${checked ? "team-card--selected" : ""} ${disabled ? "team-card--disabled" : ""}`}
    >
      <div className="team-card__left">
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt={`${team.name} logo`}
            className="team-card__logo"
          />
        ) : (
          <div className="team-card__logo team-card__logo--placeholder">
            <small>{team.name.charAt(0)}</small>
          </div>
        )}
      </div>

      <div className="team-card__body">
        <div className="team-card__title">
          <span className="team-card__seed">{team.seed}</span>
          <span className="team-card__name">{team.name}</span>
        </div>
      </div>

      <div className="team-card__action">
        <input
          type="radio"
          className="team-card__pick-checkbox"
          checked={checked}
          onChange={onChange}
          name={name}
          disabled={disabled}
        />
      </div>
    </label>
  );
}
