import { useEffect, useMemo, useState } from "react";
import { Data, Match, Team } from "./lib/data/data";
import "./lib/styles/SelectionTool.scss";

type Props = {
  data: Data;
  onPick?: (match: Match, teamId: string) => void;
};

/**
 * SelectionTool
 * - UI for selecting and batching-confirming first-round match winners.
 * - Shows one first-round match at a time with Prev/Next navigation.
 * - Selections are kept locally in selectedByMatch; Save All flushes selections
 *   by calling onPick for each selected match (App persists/propagates).
 */
export default function SelectionTool({ data, onPick }: Props) {
  // Compute sorted first-round matches (memoized for performance)
  const firstRoundMatches = useMemo(
    () =>
      (data?.matches ?? [])
        .filter((m) => m.roundIndex === 0)
        .sort((a, b) => a.order - b.order),
    [data],
  );

  // index: currently visible match in firstRoundMatches
  const [index, setIndex] = useState(0);

  // selectedByMatch: temporary in-UI selections keyed by "round:order"
  // savedByMatch: selections that have already been saved (persisted) via onPick
  const [selectedByMatch, setSelectedByMatch] = useState<
    Record<string, string>
  >({});
  const [savedByMatch, setSavedByMatch] = useState<Record<string, string>>({});

  // savingAll: UI flag while Save All is in progress
  const [savingAll, setSavingAll] = useState(false);

  // Current match and derived helpers
  const match = firstRoundMatches[index];
  const matchKey = `${match.roundIndex}:${match.order}`;

  // Resolve left/right Team objects for the current match sides (may be undefined)
  const [left, right] = (match.sides ?? []).map((side) =>
    side?.teamId ? data.teams?.[side.teamId] : undefined,
  );

  // Selection/saved values for current match
  const selectedForThis = selectedByMatch[matchKey] ?? "";
  const savedForThis = savedByMatch[matchKey] ?? "";
  const isLocked = !!savedForThis; // locked if already saved
  const hasSelections = Object.values(selectedByMatch).some(Boolean);

  /* Clamp index if matches shrink
   - Ensures index remains valid if firstRoundMatches length changes.
  */
  useEffect(() => {
    if (index >= firstRoundMatches.length && firstRoundMatches.length) {
      setIndex(firstRoundMatches.length - 1);
    }
  }, [firstRoundMatches.length, index]);

  /* Keyboard navigation
   - Adds global keydown listeners for ArrowLeft / ArrowRight to move between matches.
   - Uses functional updater for setIndex to avoid stale-state issues.
   */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setIndex((i) => Math.min(firstRoundMatches.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [firstRoundMatches.length]);

  // If there are no first-round matches, render an informative empty state
  if (!firstRoundMatches.length) {
    return (
      <div className="selection-tool__empty">
        No first-round matches available.
      </div>
    );
  }

  /**
   * selectTeam
   * - Update temporary selection for the current match.
   * - No-op if the match is already saved/locked (isLocked).
   * - Stores selection under the matchKey so Save All can batch them later.
   */
  const selectTeam = (teamId: string | null) => {
    if (!isLocked) {
      setSelectedByMatch((p) => ({ ...p, [matchKey]: teamId ?? "" }));
    }
  };

  /**
   * handleSaveAll
   * - Iterates over temporary selectedByMatch entries and calls onPick(match, teamId)
   *   for each one. onPick is expected to persist and propagate picks (handled in App).
   * - Saves in deterministic order by iterating the filtered entries.
   * - Marks each saved entry in savedByMatch so the UI shows locked state.
   * - Clears selectedByMatch after completing the batch.
   */
  const handleSaveAll = async () => {
    if (!onPick) return;

    // Only consider entries with a non-empty teamId
    const selectedEntries = Object.entries(selectedByMatch).filter(
      ([_, teamId]) => teamId,
    );
    if (!selectedEntries.length) return;

    setSavingAll(true);
    for (const [key, teamId] of selectedEntries) {
      // Parse the key back into numeric round/order to find the original match object
      const [r, order] = key.split(":").map(Number);
      const match = data.matches?.find(
        (m) => m.roundIndex === r && m.order === order,
      );
      if (match) {
        try {
          // Await onPick so App can serialize writes; catch failures per-match.
          await onPick(match, teamId);
          // Mark the match as saved/locked in the UI
          setSavedByMatch((p) => ({ ...p, [key]: teamId }));
        } catch (err) {
          console.error("onPick failed for match", key, err);
        }
      }
    }
    // Clear temporary selections after saving
    setSelectedByMatch({});
    setSavingAll(false);
  };

  /**
   * navigate
   * - Small helper to move the index by delta (-1 / +1) with clamping.
   * - Keeps the UI navigation concise and centralized.
   */
  const navigate = (delta: number) => {
    setIndex((i) =>
      Math.max(0, Math.min(firstRoundMatches.length - 1, i + delta)),
    );
  };

  // Render the selection UI for the current first-round match
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
            {/* Left / Right Team cards for the current match.
                - checked prop shows either the temporary selection or the saved/locked value.
                - disabled when the match has already been saved (isLocked).
            */}
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
            {/* Save All Picks: batch-persist all temporary selections via handleSaveAll */}
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

/**
 * TeamCard
 * - Stateless presentational card for a team option within a match.
 * - Renders logo (or placeholder), seed/name, and a radio input for selection.
 * - Props:
 *   - team?: Team — team to show (if undefined, render "TBD")
 *   - onChange?: () => void — called when user toggles the radio
 *   - checked?: boolean — whether this card is selected
 *   - name?: string — radio group name (should be unique per match)
 *   - disabled?: boolean — whether selection is disabled (e.g., saved/locked)
 */
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
  // Render a placeholder when no team is present for the slot
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
