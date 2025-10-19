import { is_object } from "../utils";
import { Data } from "./data";
import { validate_matches } from "./validate_matches";

export const ananlyze_data = (all_data: Data) => {
  if (!is_object(all_data)) {
    return [
      {
        is_critical: true,
        message: "Data must be an object, instead got: ",
        data: all_data,
      },
    ];
  }

  if (!Array.isArray(all_data.rounds)) {
    return [
      {
        is_critical: true,
        message:
          'Data must contain "rounds" property and it must be an array: ',
        data: all_data.rounds,
      },
    ];
  }

  if (
    typeof all_data.skippedLastRoundsCount !== "undefined" &&
    typeof all_data.skippedLastRoundsCount !== "number"
  ) {
    return [
      {
        is_critical: true,
        message: "Data.skippedLastRoundsCount can only be a number",
        data: all_data.skippedLastRoundsCount,
      },
    ];
  }

  if (!all_data.rounds.length && !all_data.matches?.length) {
    return [
      {
        is_critical: true,
        message: "At least one round or one match must be provided",
      },
    ];
  }

  const all_errors = [];

  all_data.rounds.forEach((round) => {
    if (!is_object(round)) {
      all_errors.push({
        is_critical: true,
        message: "data.rounds may contain only objects: ",
        data: round,
      });
    }

    if (round.name !== undefined && typeof round.name !== "string") {
      all_errors.push({
        is_critical: false,
        message: "round.name must be a string: ",
        data: round,
      });
    }
  });

  // matches
  const matches_errors = validate_matches(
    all_data.matches ?? [],
    all_data.teams ?? {},
  );
  all_errors.push(...matches_errors);

  // teams
  if (all_data.teams !== undefined && !is_object(all_data.teams)) {
    all_errors.push({
      is_critical: true,
      message:
        "data.teams must be an object which maps ids to teams, instead got: ",
      data: all_data.teams,
    });
  }

  return all_errors;
};
