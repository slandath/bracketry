import { useMemo, useState } from "react";
import { Data, Match, Team } from "./lib/data/data";

type Props = {
  data: Data;
  onPick?: (match: Match, teamId: string) => void;
};

export default function SelectionTool({ data, onPick }: Props) {
  const [predictedTeam, setPredictedTeam] = useState<string | null>(null);

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
    return <div>No matches available to select.</div>;
  }

  const sides = firstMatch.sides ?? [];
  const left = sides[0]?.teamId ? data.teams?.[sides[0]!.teamId!] : undefined;
  const right = sides[1]?.teamId ? data.teams?.[sides[1]!.teamId!] : undefined;

  function handlePick(teamId?: string) {
    if (!teamId || !firstMatch) return;
    setPredictedTeam(teamId);
    onPick?.(firstMatch, teamId);
  }

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: 12,
        borderRadius: 8,
        maxWidth: 560,
        background: "#fff",
      }}
    >
      <h4 style={{ marginTop: 0 }}>
        First match — Round {firstMatch.roundIndex + 1} · Order{" "}
        {firstMatch.order}
      </h4>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <TeamCard
          team={left}
          onPick={() => handlePick(left?.id)}
          selected={predictedTeam === left?.id}
        />
        <div style={{ width: 48, textAlign: "center", color: "#666" }}>vs</div>
        <TeamCard
          team={right}
          onPick={() => handlePick(right?.id)}
          selected={predictedTeam === right?.id}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <small style={{ color: "#666" }}>
          Match ID: {firstMatch.id ?? "(none)"} · Status:{" "}
          {firstMatch.matchStatus ?? "n/a"}
        </small>
      </div>
    </div>
  );
}

function TeamCard({
  team,
  onPick,
  selected,
}: {
  team?: Team;
  onPick?: () => void;
  selected?: boolean;
}) {
  if (!team) {
    return (
      <div
        style={{
          flex: 1,
          padding: 12,
          border: "1px dashed #ddd",
          borderRadius: 8,
          textAlign: "center",
          color: "#666",
        }}
      >
        TBD
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: 10,
        borderRadius: 8,
        border: selected ? "2px solid #0b74de" : "1px solid #eee",
        background: selected ? "rgba(11,116,222,0.06)" : "#fafafa",
      }}
    >
      {team.logoUrl ? (
        <img
          src={team.logoUrl}
          alt={`${team.name} logo`}
          style={{ width: 56, height: 56, objectFit: "contain" }}
        />
      ) : (
        <div
          style={{
            width: 56,
            height: 56,
            background: "#f3f3f3",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <small>{team.name.charAt(0)}</small>
        </div>
      )}

      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700 }}>{team.name}</div>
        <div style={{ color: "#666" }}>Seed: {team.seed}</div>
      </div>

      <div>
        <button onClick={onPick} style={{ padding: "6px 10px" }}>
          Pick
        </button>
      </div>
    </div>
  );
}
