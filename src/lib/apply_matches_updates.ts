import { handle_data_errors } from "./data/handle_errors.mjs";
import { validate_matches } from "./data/validate_matches.mjs";
import { get_match_content } from "./draw/get_match_element.mjs";
import { update_highlight } from "./ui_events/highlight.mjs";
import { is_valid_number } from "./utils";

// You can replace Record<string, unknown> with your real "Match" and "Data" interfaces when available
export interface MatchLike extends Record<string, unknown> {
  order: number;
  roundIndex: number;
}

export interface AllDataLike extends Record<string, unknown> {
  matches: MatchLike[];
  contestants?: unknown[];
}

export interface HtmlShellLike {
  the_root_element: HTMLElement;
  matches_positioner: HTMLElement;
}

/**
 * Updates existing matches in the bracket when new data arrives,
 * re‑renders their DOM, and re‑applies highlights if needed.
 */
export function apply_matches_updates(
  updates: MatchLike[] | unknown,
  all_data: AllDataLike,
  html_shell: HtmlShellLike,
  get_option: (key?: unknown) => unknown,
  repaint: () => void,
): void {
  if (!Array.isArray(all_data.matches)) return;

  if (!Array.isArray(updates)) {
    console.warn(
      "applyMatchesUpdates must be called with an array of matches, instead got:",
      updates,
    );
    return;
  }

  const { have_critical_error } = handle_data_errors(
    validate_matches(updates, all_data.contestants),
  );
  if (have_critical_error) return;

  const hl_contestant_id = html_shell.matches_positioner
    .querySelector(".side-wrapper.highlighted")
    ?.getAttribute("contestant-id");

  updates.forEach((u) => {
    if (!is_valid_number(u.order) || !is_valid_number(u.roundIndex)) return;

    const old_match_data_i = all_data.matches.findIndex(
      (old_match) =>
        old_match.roundIndex === u.roundIndex &&
        old_match.order === u.order,
    );

    if (old_match_data_i > -1) {
      all_data.matches[old_match_data_i] = u;
    } else {
      all_data.matches.push(u);
    }

    const round_el = html_shell.the_root_element.querySelector<HTMLElement>(
      `.round-wrapper[round-index="${u.roundIndex}"]`,
    );

    const match_wrapper =
      round_el?.querySelector<HTMLElement>(
        `.match-wrapper[match-order="${u.order}"]`,
      ) ?? null;

    if (!match_wrapper) return; // perhaps an impossible combination

    match_wrapper.querySelector(".match-body")?.remove();

    const content = get_match_content(
      u,
      all_data,
      u.roundIndex,
      u.order,
      get_option,
    ) as HTMLElement | string | null;

    if (content) {
      match_wrapper.prepend(content);
    } else {
      match_wrapper.prepend("");
    }
  });

  repaint();

  if (typeof hl_contestant_id === "string" && hl_contestant_id.length) {
    update_highlight(html_shell.matches_positioner, hl_contestant_id);
  }
}
