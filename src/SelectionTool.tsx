import { useEffect, useMemo, useState } from "react";
import { Data, Match, Team } from "./lib/data/data";
import "./lib/styles/SelectionTool.scss";

type Props = {
  data: Data;
  onPick?: (match: Match, teamId: string) => void;
};

export default function SelectionTool({ data, onPick }: Props) {
  const firstRoundMatches = useMemo(
    () =>
      (data?.matches ?? [])
        .filter((m) => m.roundIndex === 0)
        .sort((a, b) => a.order - b.order),
    [data],
  );

  const [index, setIndex] = useState(0);
  const [selectedByMatch, setSelectedByMatch] = useState<
    Record<string, string>
  >({});
  const [savedByMatch, setSavedByMatch] = useState<Record<string, string>>({});
  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    if (index >= firstRoundMatches.length && firstRoundMatches.length) {
      setIndex(firstRoundMatches.length - 1);
    }
  }, [firstRoundMatches.length, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setIndex((i) => Math.min(firstRoundMatches.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [firstRoundMatches.length]);

  if (!firstRoundMatches.length) {
    return (
      <div className="selection-tool__empty">
        No first-round matches available.
      </div>
    );
  }

  const match = firstRoundMatches[index];
  const matchKey = `${match.roundIndex}:${match.order}`;
  const [left, right] = (match.sides ?? []).map((side) =>
    side?.teamId ? data.teams?.[side.teamId] : undefined,
  );

  const selectedForThis = selectedByMatch[matchKey] ?? "";
  const savedForThis = savedByMatch[matchKey] ?? "";
  const isLocked = !!savedForThis;

  const selectTeam = (teamId: string | null) => {
    if (!isLocked) {
      setSelectedByMatch((p) => ({ ...p, [matchKey]: teamId ?? "" }));
    }
  };

  const handleSaveAll = async () => {
    if (!onPick) return;

    const selectedEntries = Object.entries(selectedByMatch).filter(
      ([_, teamId]) => teamId,
    );
    if (!selectedEntries.length) return;

    setSavingAll(true);
    for (const [key, teamId] of selectedEntries) {
      const [r, order] = key.split(":").map(Number);
      const match = data.matches?.find(
        (m) => m.roundIndex === r && m.order === order,
      );
      if (match) {
        try {
          await onPick(match, teamId);
          setSavedByMatch((p) => ({ ...p, [key]: teamId }));
        } catch (err) {
          console.error("onPick failed for match", key, err);
        }
      }
    }
    setSelectedByMatch({});
    setSavingAll(false);
  };

  const navigate = (delta: number) => {
    setIndex((i) =>
      Math.max(0, Math.min(firstRoundMatches.length - 1, i + delta)),
    );
  };

  const hasSelections = Object.values(selectedByMatch).some(Boolean);

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
              checked={
                selectedForThis === left?.id || savedForThis === left?.id
              }
              onChange={() => selectTeam(left?.id ?? null)}
              name={`team-selection-${matchKey}`}
              disabled={isLocked}
            />
            <TeamCard
              team={right}
              checked={
                selectedForThis === right?.id || savedForThis === right?.id
              }
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
              disabled={savingAll || !hasSelections}
            >
              {savingAll ? "Saving…" : "Save All Picks"}
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
  if (!team) return <div className="team-card team-card--tbd">TBD</div>;

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
          checked={!!checked}
          onChange={onChange}
          name={name}
          disabled={disabled}
        />
      </div>
    </label>
  );
}
