import { useMemo, useState } from "react";
import { Data, Match, Team } from "./lib/data/data";
import "./lib/styles/SelectionTool.scss";

type Props = {
  data: Data;
  onPick?: (match: Match, teamId: string) => void;
};

export default function SelectionTool({ data, onPick }: Props) {
  const [predictedTeam, setPredictedTeam] = useState<string | null>(null);
  const [confirmedTeam, setConfirmedTeam] = useState<string | null>(null);

  const firstMatch = useMemo<Match | null>(() => {
    if (!data?.matches || data.matches.length === 0) return null;
    const sorted = [...data.matches].sort((a, b) =>
      a.roundIndex === b.roundIndex
        ? a.order - b.order
        : a.roundIndex - b.roundIndex,
    );
    return sorted[0] ?? null;
  }, [data]);

  if (!firstMatch) {
    return <div className="selection-tool__empty">No matches available to select.</div>;
  }

  const sides = firstMatch.sides ?? [];
  const left = sides[0]?.teamId ? data.teams?.[sides[0]!.teamId!] : undefined;
  const right = sides[1]?.teamId ? data.teams?.[sides[1]!.teamId!] : undefined;

  function handleConfirm() {
    if (!predictedTeam || !firstMatch) return;
    setConfirmedTeam(predictedTeam);
    onPick?.(firstMatch, predictedTeam);
  }

  return (
    <div className="selection-tool">
      <h4 className="selection-tool__title">Round {firstMatch.roundIndex + 1}</h4>

      <div className="selection-tool__match">
        <TeamCard
          team={left}
          checked={predictedTeam === left?.id}
          onChange={() => setPredictedTeam(left?.id ?? null)}
        />

        <div className="selection-tool__vs">vs</div>

        <TeamCard
          team={right}
          checked={predictedTeam === right?.id}
          onChange={() => setPredictedTeam(right?.id ?? null)}
        />
      </div>

      <div className="selection-tool__controls">
        <button
          type="button"
          className="selection-tool__confirm-btn"
          onClick={handleConfirm}
          disabled={!predictedTeam}
          aria-disabled={!predictedTeam}
        >
          Confirm Selection
        </button>

        {confirmedTeam ? (
          <div className="selection-tool__confirmed">
            Confirmed: {data.teams?.[confirmedTeam]?.name ?? confirmedTeam}
          </div>
        ) : null}
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
    <label className={`team-card ${checked ? "team-card--selected" : ""}`}>
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
          type="checkbox"
          className="team-card__pick-checkbox"
          checked={!!checked}
          onChange={onChange}
          aria-checked={!!checked}
        />
      </div>
    </label>
  );
}
