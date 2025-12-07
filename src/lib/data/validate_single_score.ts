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
    // if (score.mainScore === undefined) {
    //   errors.push({
    //     is_critical: false,
    //     message: 'Score must contain a "mainScore" property',
    //     data: side,
    //   });
    // }
    // if (
    //   !is_valid_number(score.mainScore) &&
    //   typeof score.mainScore !== "string"
    // ) {
    //   errors.push({
    //     is_critical: false,
    //     message: "mainScore must be a number or a string",
    //     data: side,
    //   });
    // }
    // if (
    //   score.subscore !== undefined &&
    //   !is_valid_number(score.subscore) &&
    //   typeof score.subscore !== "string"
    // ) {
    //   errors.push({
    //     is_critical: false,
    //     message: 'If you provide "subscore", it must be a number or a string',
    //     data: side,
    //   });
    // }
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
