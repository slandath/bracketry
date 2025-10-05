import { useEffect, useMemo, useState } from "react";
import { Data, Match, Team } from "./lib/data/data";
import "./lib/styles/SelectionTool.scss";

type Props = {
  data: Data;
  onPick?: (match: Match, teamId: string) => void;
};

export default function SelectionTool({ data, onPick }: Props) {
  const firstRoundMatches = useMemo(() => {
    if (!data?.matches) return [];
    return [...data.matches]
      .filter((m) => m.roundIndex === 0)
      .sort((a, b) => a.order - b.order);
  }, [data]);

  const [index, setIndex] = useState(0);
  const [confirmedByMatch, setConfirmedByMatch] = useState<
    Record<string, string>
  >({});

  const match = firstRoundMatches[index];
  const matchKey = match ? `${match.roundIndex}:${match.order}` : "";
  const predictedTeam = confirmedByMatch[matchKey] ?? null;

  // Clamp index when matches change
  useEffect(() => {
    if (index >= firstRoundMatches.length && firstRoundMatches.length > 0) {
      setIndex(firstRoundMatches.length - 1);
    }
  }, [firstRoundMatches.length, index]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft")
        setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setIndex((i) =>
          Math.min(firstRoundMatches.length - 1, i + 1)
        );
    }
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

  const sides = match.sides ?? [];
  const left = sides[0]?.teamId
    ? data.teams?.[sides[0].teamId]
    : undefined;
  const right = sides[1]?.teamId
    ? data.teams?.[sides[1].teamId]
    : undefined;

  function handleConfirm() {
    if (!predictedTeam) return;
    setConfirmedByMatch((prev) => ({
      ...prev,
      [matchKey]: predictedTeam,
    }));
    onPick?.(match, predictedTeam);
  }

  function selectTeam(teamId: string | null) {
    setConfirmedByMatch((prev) => ({
      ...prev,
      [matchKey]: teamId ?? "",
    }));
  }

  return (
    <div className="selection-tool-wrapper">
      <div className="selection-tool">
        <div className="selection-tool__side selection-tool__side--left">
          <button
            aria-label="Previous match"
            className="selection-tool__nav selection-tool__nav--left"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
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
              checked={predictedTeam === left?.id}
              onChange={() => selectTeam(left?.id ?? null)}
            />
            <TeamCard
              team={right}
              checked={predictedTeam === right?.id}
              onChange={() => selectTeam(right?.id ?? null)}
            />
          </div>

          <div className="selection-tool__controls">
            <button
              type="button"
              className="selection-tool__confirm-btn"
              onClick={handleConfirm}
              disabled={!predictedTeam}
            >
              Confirm Selection
            </button>
          </div>
        </div>

        <div className="selection-tool__side selection-tool__side--right">
          <button
            aria-label="Next match"
            className="selection-tool__nav selection-tool__nav--right"
            onClick={() =>
              setIndex((i) =>
                Math.min(firstRoundMatches.length - 1, i + 1)
              )
            }
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
}: {
  team?: Team;
  onChange?: () => void;
  checked?: boolean;
}) {
  if (!team) {
    return <div className="team-card team-card--tbd">TBD</div>;
  }

  return (
    <label
      className={`team-card ${checked ? "team-card--selected" : ""}`}
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
          name="team-selection"
        />
      </div>
    </label>
  );
}
