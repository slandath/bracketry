// import { is_object, is_valid_number } from "../utils.js";
import { is_object } from "../utils.js";
import { Side } from "./data.js";

export const validate_single_score = (score: unknown, side: Side) => {
  const errors = [];

  if (!is_object(score)) {
    errors.push({
      is_critical: false,
      message: "Score must be an object",
      data: side,
    });
  } else {
    if (
      typeof score.isWinner !== "boolean" &&
      typeof score.isWinner !== "undefined"
    ) {
      errors.push({
        is_critical: false,
        message: 'If you provide "isWinner", it must be a boolean',
        data: side,
      });
    }
  }

  return errors;
};
