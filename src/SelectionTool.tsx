import { useEffect, useState } from "react";
import { Data, Match, Team } from "./lib/data/data";
import "./lib/styles/SelectionTool.scss";

type Props = {
  data: Data;
  onPick?: (match: Match, teamId: string) => void;
  onRefresh?: () => void;
};

export default function SelectionTool({ data, onPick, onRefresh }: Props) {
  const firstRoundMatches = (data?.matches ?? [])
    .filter((m) => m.roundIndex === 0)
    .sort((a, b) => a.order - b.order);

  const [index, setIndex] = useState(0);
  const [pendingPicks, setPendingPicks] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const match = firstRoundMatches[index];
  if (!match) {
    return (
      <div className="selection-tool__empty">
        No first-round matches available.
      </div>
    );
  }

  const matchKey = `${match.roundIndex}:${match.order}`;
  const [left, right] = (match.sides ?? []).map((side) =>
    side?.teamId ? data.teams?.[side.teamId] : undefined
  );

  // Derive saved state from data instead of maintaining separate state
  const savedPick = match.prediction || "";
  const pendingPick = pendingPicks[matchKey] || "";
  const currentPick = pendingPick || savedPick;
  const isLocked = !!savedPick;
  const hasPendingPicks = Object.values(pendingPicks).some(Boolean);

  // Clamp index if array shrinks
  useEffect(() => {
    if (index >= firstRoundMatches.length && firstRoundMatches.length > 0) {
      setIndex(firstRoundMatches.length - 1);
    }
  }, [firstRoundMatches.length, index]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(0, i - 1));
      }
      if (e.key === "ArrowRight") {
        setIndex((i) => Math.min(firstRoundMatches.length - 1, i + 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [firstRoundMatches.length]);

  const selectTeam = (teamId: string | null) => {
    if (isLocked) return;
    setPendingPicks((prev) => ({ ...prev, [matchKey]: teamId || "" }));
  };

  const handleSaveAll = async () => {
    if (!onPick || !hasPendingPicks) return;

    setIsSaving(true);

    try {
      // Call onPick for each pending selection
      for (const [key, teamId] of Object.entries(pendingPicks)) {
        if (!teamId) continue;

        const [roundStr, orderStr] = key.split(":");
        const targetMatch = firstRoundMatches.find(
          (m) => m.roundIndex === Number(roundStr) && m.order === Number(orderStr)
        );

        if (targetMatch) {
          await onPick(targetMatch, teamId);
        }
      }

      // Clear pending picks and trigger refresh
      setPendingPicks({});
      onRefresh?.();
    } catch (err) {
      console.error("Failed to save picks:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const navigate = (delta: number) => {
    setIndex((i) =>
      Math.max(0, Math.min(firstRoundMatches.length - 1, i + delta))
    );
  };

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
              Round {match.roundIndex + 1}
            </h4>
            <div className="selection-tool__position">
              {index + 1} / {firstRoundMatches.length}
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
              disabled={isSaving || !hasPendingPicks}
            >
              {isSaving ? "Saving…" : "Save All Picks"}
            </button>
          </div>
        </div>

        <div className="selection-tool__side selection-tool__side--right">
          <button
            aria-label="Next match"
            className="selection-tool__nav selection-tool__nav--right"
            onClick={() => navigate(1)}
            disabled={index === firstRoundMatches.length - 1}
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
      className={`team-card ${checked ? "team-card--selected" : ""} ${
        disabled ? "team-card--disabled" : ""
      }`}
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
