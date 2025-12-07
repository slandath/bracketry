import { is_object, is_valid_number } from "../utils.js";
import { Match, Side, Team } from "./data.js";
// import { validate_single_score } from "./validate_single_score";

export const validate_matches = (
  matches: Match[],
  teams: { [id: string]: Team },
) => {
  const errors = [];

  if (matches !== undefined && !Array.isArray(matches)) {
    errors.push({
      is_critical: true,
      message: `data.matches must be an array:`,
      data: matches,
    });
  }

  if (matches && matches.length) {
    matches.forEach((match) => {
      if (!is_object(match)) {
        errors.push({
          is_critical: true,
          message: `Match must be an object:`,
          data: match,
        });
      }

      if (!is_valid_number(match.roundIndex)) {
        errors.push({
          is_critical: false,
          message: `Match must contain a numeric "roundIndex" prop:`,
          data: match,
        });
      }
      if (!is_valid_number(match.order)) {
        errors.push({
          is_critical: false,
          message: `Match must contain a numeric "order" prop:`,
          data: match,
        });
      }

      if (match.sides !== undefined && !Array.isArray(match.sides)) {
        errors.push({
          is_critical: true,
          message: `Match.sides is required and must be an array`,
          data: match,
        });
      }

      if (Array.isArray(match.sides)) {
        match.sides.forEach((side: Side) => {
          if (!is_object(side)) {
            errors.push({
              is_critical: true,
              message: `Match's side must be an object`,
              data: match,
            });
            return;
          }

          if (side.teamId !== undefined && typeof side.teamId !== "string") {
            errors.push({
              is_critical: true,
              message: `If you provide side.teamId, it must be a string`,
              data: side,
            });
          }

          if (
            typeof side.teamId === "string" &&
            !Object.keys(teams || {}).includes(side.teamId)
          ) {
            errors.push({
              is_critical: false,
              message: "No team data found for this side.teamId:",
              data: side,
            });
          }

          if (
            side.isWinner !== undefined &&
            typeof side.isWinner !== "boolean"
          ) {
            errors.push({
              is_critical: false,
              message: "If you provide side.isWinner, it must be a boolean",
              data: side,
            });
          }

          // if (side.score !== undefined && !Array.isArray(side.score)) {
          //   errors.push({
          //     is_critical: true,
          //     message: "If side.scores is provided, it must be an array",
          //     data: side,
          //   });
          // }
          // if (Array.isArray(side.score) && !side.score.length) {
          //   errors.push({
          //     is_critical: false,
          //     message: `side.scores is provided but it's an empty array: `,
          //     data: side,
          //   });
          // }

          // if (Array.isArray(side.score)) {
          //   side.score.forEach((score) => {
          //     errors.push(...validate_single_score(score, side));
          //   });
          // }
        });
      }
    });
  }
  return errors;
};
