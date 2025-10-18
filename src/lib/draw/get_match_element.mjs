import { create_element_from_Html } from "../utils.ts";
import { try_get_custom_element } from "./try_get_custom_element.mjs";

const checkmark_svg = `<svg class="default-winner-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><path d="M21 6.285l-11.16 12.733-6.84-6.018 1.319-1.49 5.341 4.686 9.865-11.196 1.475 1.285z"/></svg>`;

/**
 * Render a single team side in a match
 */
const get_side_html = (match, side_index, all_data) => {
  const side = match.sides?.[side_index];
  const other = match.sides?.[side_index === 0 ? 1 : 0];

  if (!side || !side.teamId) {
    return `<div class="side-wrapper empty-side"><span class="placeholder">TBD</span></div>`;
  }

  const team = all_data.teams?.[side.teamId];
  if (!team) {
    return `<div class="side-wrapper empty-side"><span class="placeholder">TBD</span></div>`;
  }

  // CSS classes
  let winner_class = "";
  let loser_class = "";
  let predicted_class = "";

  if (side.isWinner || match.result === team.id) {
    winner_class = "winner";
  }
  if (other && (other.isWinner || match.result === other.team?.id)) {
    loser_class = "looser";
  }
  if (match.prediction === team.id) {
    if (match.result) {
      predicted_class =
        match.result === team.id
          ? "predicted predicted-correct"
          : "predicted predicted-incorrect";
    } else {
      predicted_class = "predicted";
    }
  }

  // Simple logo + title markup
  const logo = team.logoUrl
    ? `<img src="${team.logoUrl}" alt="${team.name} logo"/>`
    : "";

  const title = `${team.seed} ${team.name}`;
  const score = side.score ?? "";

  return `
    <div class="side-wrapper ${winner_class} ${loser_class} ${predicted_class}">
      <div class="side-info-item players-info">
        <div class="player-wrapper">
          <div class="logo">${logo}</div>
          <div class="player-title">${title}</div>
        </div>
      </div>
      <div class="side-info-item winner-mark">${checkmark_svg}</div>
      <div class="side-info-item side-scores">${score}</div>
    </div>
  `;
};

/**
 * Render the inner content of a match (the "body")
 */
export const get_match_content = (
  maybe_match_data,
  all_data,
  round_index,
  match_order,
  get_option,
) => {
  const custom_match_element = try_get_custom_element(
    get_option("getMatchElement"),
    [round_index, match_order],
    "getMatchElement",
  );
  if (custom_match_element === null) return null;

  const match_body = create_element_from_Html(`<div class="match-body"></div>`);

  if (custom_match_element instanceof Element) {
    match_body.append(custom_match_element);
    return match_body;
  }

  if (!maybe_match_data) {
    return null;
  }

  // Add sides
  if (Array.isArray(maybe_match_data.sides)) {
    match_body.innerHTML += `
      <div class="sides">
        ${get_side_html(maybe_match_data, 0, all_data, get_option)}
        ${get_side_html(maybe_match_data, 1, all_data, get_option)}
      </div>
    `;
  }

  // Live flag
  if (maybe_match_data.isLive) {
    match_body.classList.add("live");
  }

  // Match status display
  if (maybe_match_data.matchStatus) {
    match_body.innerHTML += `<div class="match-status">${maybe_match_data.matchStatus}</div>`;
  }

  return match_body;
};

/**
 * Main entry: render one whole match wrapper + body
 */
export const get_match_element = (
  round_index,
  match_order,
  all_data,
  get_option,
) => {
  const maybe_match_data = all_data.matches?.find(
    (m) => m.roundIndex === round_index && m.order === match_order,
  );

  const is_even = match_order % 2 === 0;

  const wrapper = create_element_from_Html(`
    <div
      class="match-wrapper ${is_even ? "even" : "odd"}"
      match-order="${match_order}"
    >
      <div class="match-lines-area">
        <div class="line-wrapper upper"></div>
        <div class="line-wrapper lower"></div>
      </div>
    </div>
  `);

  const body = get_match_content(
    maybe_match_data,
    all_data,
    round_index,
    match_order,
    get_option,
  );
  if (body) wrapper.prepend(body);

  // result correctness
  if (maybe_match_data?.prediction && maybe_match_data?.result) {
    if (maybe_match_data.prediction === maybe_match_data.result) {
      wrapper.classList.add("result-correct");
    } else {
      wrapper.classList.add("result-incorrect");
    }
  }

  return wrapper;
};
