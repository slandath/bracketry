/**
 * @jest-environment jsdom
 */

import { jest, test, expect } from "@jest/globals";
import { init } from "./utils.js";
import finished_ucl from "./data/ucl-finished.js";
import ResizeObserver from "resize-observer-polyfill";
global.ResizeObserver = ResizeObserver;

test("calls onMatchClick when .match-body is clicked", () => {
  const onMatchClick = jest.fn();
  const { wrapper } = init(finished_ucl, { onMatchClick });

  wrapper
    .querySelector(
      '.round-wrapper[round-index="0"] .match-wrapper[match-order="1"] .match-body',
    )
    .dispatchEvent(new MouseEvent("click", { bubbles: true }));

  expect(onMatchClick).toBeCalledWith(
    expect.objectContaining(finished_ucl.matches[1]),
  );
});

test("does not call onMatchClick when clicked outside match-body", () => {
  const onMatchClick = jest.fn();
  const { wrapper } = init(finished_ucl, { onMatchClick });

  wrapper
    .querySelector(".round-wrapper")
    .dispatchEvent(new MouseEvent("click", { bubbles: true }));

  expect(onMatchClick).not.toBeCalled();
});

// test(`pointer-events of a .side_wrapper are disabled when onMatchClick is provided
//     (clicks must be registered only on .match-body and not on its descendants)`, () => {
//   const { wrapper } = init(finished_ucl, { onMatchClick: () => {} });
//   const sideWrapper = wrapper.querySelector('.side-wrapper');
//   const matchBody = wrapper.querySelector('.match-body');

//   // Jest checks DOM state (class, attribute, etc.)
//   expect(sideWrapper.classList.contains('click-disabled')).toBe(true);
//   expect(matchBody.classList.contains('click-disabled')).toBe(false);
// });

test(`contestant's match history isn't highlighted on click when onMatchClick is provided`, () => {
  const { wrapper } = init(finished_ucl, { onMatchClick: () => {} });

  wrapper
    .querySelector(".match-body")
    .dispatchEvent(new MouseEvent("click", { bubbles: true }));

  expect(wrapper.querySelectorAll(".match-wrapper.highlighted").length).toBe(0);

  wrapper
    .querySelector(`.side-wrapper[contestant-id='benfica']`)
    .dispatchEvent(new MouseEvent("click", { bubbles: true }));

  expect(wrapper.querySelectorAll(".match-wrapper.highlighted").length).toBe(0);
});

test(`if no data for a match in such position, then there's no match body and clickin on match-wrapper doesn't call onMatchClick`, () => {
  const onMatchClick = jest.fn();

  const { wrapper } = init({ rounds: [{}] }, { onMatchClick });

  expect(wrapper.querySelector(".match-body")).toBe(null);

  wrapper
    .querySelector(`.match-wrapper`)
    .dispatchEvent(new MouseEvent("click", { bubbles: true }));

  expect(onMatchClick).not.toHaveBeenCalled();
});
