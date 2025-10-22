const highlighted_class = "highlighted";
const last_highlighted_class = "last-highlighted";

/**
 * Highlights all sides and matches belonging to a specific contestant.
 *
 * @param matches_positioner The container element holding all matches.
 * @param new_id The team or contestant ID to highlight, or null to clear highlights.
 */
export const update_highlight = (
  matches_positioner: HTMLElement,
  new_id: string | null,
): void => {
  if (typeof new_id !== "string" && new_id !== null) return;

  // --- Remove old highlight classes ---
  Array.from(
    matches_positioner.querySelectorAll<HTMLElement>(
      `.side-wrapper.${highlighted_class}`,
    ),
  ).forEach((s) => s.classList.remove(highlighted_class));

  Array.from(
    matches_positioner.querySelectorAll<HTMLElement>(
      `.match-wrapper.${highlighted_class}`,
    ),
  ).forEach((m) => m.classList.remove(highlighted_class));

  Array.from(
    matches_positioner.querySelectorAll<HTMLElement>(
      `.match-wrapper.${last_highlighted_class}`,
    ),
  ).forEach((m) => m.classList.remove(last_highlighted_class));

  if (new_id === null || new_id === "") return;

  // --- Collect sides associated with contestant ---
  const sides_to_highlight = Array.from(
    matches_positioner.querySelectorAll<HTMLElement>(
      `.side-wrapper[contestant-id="${new_id}"]`,
    ),
  );

  if (sides_to_highlight.length === 0) return; // nothing to highlight
  if (sides_to_highlight[0].classList.contains(highlighted_class)) return; // already highlighted

  // --- Apply new highlights ---
  sides_to_highlight.reverse().forEach((side, i) => {
    side.classList.add(highlighted_class);

    const match_parent = side.closest<HTMLElement>(".match-wrapper");
    if (!match_parent) return;

    match_parent.classList.add(highlighted_class);

    if (i === 0) {
      match_parent.classList.add(last_highlighted_class);
    }

    const last_round_parent = side.closest<HTMLElement>(
      ".bronze-round-wrapper",
    );
    if (!last_round_parent) return;

    // highlight first pseudo-round wrapper
    last_round_parent
      .querySelector<HTMLElement>(
        ".pseudo-round-wrapper:first-child .match-wrapper",
      )
      ?.classList.add(highlighted_class);

    if (match_parent.classList.contains("even")) {
      last_round_parent
        .querySelector<HTMLElement>(
          ".pseudo-round-wrapper:nth-child(2) .match-wrapper.even",
        )
        ?.classList.add(highlighted_class);
    } else {
      last_round_parent
        .querySelector<HTMLElement>(
          ".pseudo-round-wrapper:nth-child(2) .match-wrapper.odd",
        )
        ?.classList.add(highlighted_class);
    }
  });
};
