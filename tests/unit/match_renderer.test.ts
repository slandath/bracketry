import { beforeEach, describe, expect, it, vi } from "vitest";

// Test-scope mocks we control directly
const mockCreateElementFromHtml = vi.fn();
const mockTryGetCustomElement = vi.fn();

// Mock helper modules the target imports (must be before importing the module
// under test). Use the exact paths the source uses.
vi.mock("../../../src/lib/utils.mjs", () => ({
  create_element_from_Html: mockCreateElementFromHtml,
}));
vi.mock("../../../src/lib/draw/try_get_custom_element.mjs", () => ({
  try_get_custom_element: mockTryGetCustomElement,
}));

// Import the module-under-test AFTER the vi.mock calls.
// Updated import path as you requested.
import {
    get_match_content,
    get_match_element,
} from "../../src/lib/draw/get_match_element.mjs";

// helper to create a real DOM element from HTML
function makeElementFromHtml(html: string): Element {
  const container = document.createElement("div");
  container.innerHTML = html.trim();
  return container.firstElementChild as Element;
}

beforeEach(() => {
  vi.resetAllMocks();
  document.body.innerHTML = "";

  // Provide default behavior for create_element_from_Html mock
  mockCreateElementFromHtml.mockImplementation((html: string) =>
    makeElementFromHtml(html),
  );
});

describe("get_match_content", () => {
  it("returns null if try_get_custom_element returns null", () => {
    mockTryGetCustomElement.mockReturnValueOnce(null);
    const result = get_match_content(null, {}, 0, 0, () => undefined);
    expect(result).toBeNull();
  });

it("wraps and returns custom element when provided", () => {
  const custom = document.createElement("div");
  custom.className = "custom-match";

  mockTryGetCustomElement.mockReturnValueOnce(custom);

  // Provide an actual getMatchElement function
  const getOption = (key: string) => {
    if (key === "getMatchElement") {
      return () => custom;
    }
    return undefined;
  };

  const result = get_match_content(null, {}, 0, 0, getOption);

  expect(result).toBeInstanceOf(Element);
  expect(result?.classList.contains("match-body")).toBe(true);
  expect(result?.querySelector(".custom-match")).toBe(custom);
});

  it("renders TBD when sides missing or team not found", () => {
    mockTryGetCustomElement.mockReturnValueOnce({}); // truthy non-Element -> proceed
    const all_data = { teams: {} };
    const match = { sides: [{ teamId: "t1" }, { teamId: undefined }] };

    const content = get_match_content(match, all_data, 0, 0, () => undefined);
    expect(content).toBeInstanceOf(Element);

    const tbdElems = Array.from(
      (content as Element).querySelectorAll(".side-wrapper .placeholder"),
    );
    expect(tbdElems.length).toBeGreaterThanOrEqual(1);
    expect(tbdElems[0].textContent).toBe("TBD");
  });

  it("applies winner/loser/predicted classes and shows scores/logo/title", () => {
    mockTryGetCustomElement.mockReturnValueOnce({});
    const all_data = {
      teams: {
        t1: { id: "t1", seed: 1, name: "Alpha", logoUrl: "logo1.png" },
        t2: { id: "t2", seed: 2, name: "Beta" },
      },
    };
    const match = {
      sides: [
        { teamId: "t1", isWinner: true, score: 83 },
        { teamId: "t2", isWinner: false, score: 79 },
      ],
      result: "t1",
      prediction: "t2",
    };

    const content = get_match_content(match, all_data, 0, 0, () => undefined);
    expect(content).toBeInstanceOf(Element);

    const sideWrappers = (content as Element).querySelectorAll(".side-wrapper");
    expect(sideWrappers.length).toBe(2);

    const [side1, side2] = Array.from(sideWrappers);
    expect(side1.classList.contains("winner")).toBe(true);
    expect(side2.classList.contains("looser")).toBe(true);
    expect(side2.classList.contains("predicted")).toBe(true);
    expect(side2.classList.contains("predicted-incorrect")).toBe(true);

    expect(side1.querySelector(".side-scores")?.textContent?.trim()).toBe("83");
    expect(side2.querySelector(".side-scores")?.textContent?.trim()).toBe("79");
    expect(side1.querySelector(".logo img")?.getAttribute("src")).toBe("logo1.png");
    expect(
      side1.querySelector(".player-title")?.textContent?.includes("1 Alpha"),
    ).toBe(true);
  });

  it("adds live class and match status markup", () => {
    mockTryGetCustomElement.mockReturnValueOnce({});
    const all_data = {
      teams: {
        t1: { id: "t1", seed: 1, name: "Alpha" },
        t2: { id: "t2", seed: 2, name: "Beta" },
      },
    };
    const match = { sides: [{ teamId: "t1" }, { teamId: "t2" }], isLive: true, matchStatus: "OT" };

    const content = get_match_content(match, all_data, 0, 0, () => undefined);
    expect((content as Element).classList.contains("live")).toBe(true);
    expect((content as Element).querySelector(".match-status")?.textContent).toBe("OT");
  });
});

describe("get_match_element", () => {
  it("prepends body and marks result-correct when prediction matches result", () => {
    mockTryGetCustomElement.mockReturnValueOnce({});
    const all_data = {
      matches: [
        {
          roundIndex: 1,
          order: 3,
          sides: [{ teamId: "t1", score: 10 }, { teamId: "t2", score: 8 }],
          result: "t1",
          prediction: "t1",
        },
      ],
      teams: {
        t1: { id: "t1", seed: 1, name: "Alpha" },
        t2: { id: "t2", seed: 2, name: "Beta" },
      },
    };

    const wrapper = get_match_element(1, 3, all_data, () => undefined);
    expect(wrapper).toBeInstanceOf(Element);
    expect(wrapper.querySelector(".match-body")).toBeTruthy();
    expect(wrapper.classList.contains("result-correct")).toBe(true);
    expect(wrapper.classList.contains("result-incorrect")).toBe(false);
  });

  it("marks result-incorrect when prediction does not match result", () => {
    mockTryGetCustomElement.mockReturnValueOnce({});
    const all_data = {
      matches: [
        {
          roundIndex: 2,
          order: 4,
          sides: [{ teamId: "t1", score: 10 }, { teamId: "t2", score: 8 }],
          result: "t1",
          prediction: "t2",
        },
      ],
      teams: {
        t1: { id: "t1", seed: 1, name: "Alpha" },
        t2: { id: "t2", seed: 2, name: "Beta" },
      },
    };

    const wrapper = get_match_element(2, 4, all_data, () => undefined);
    expect(wrapper.classList.contains("result-incorrect")).toBe(true);
    expect(wrapper.classList.contains("result-correct")).toBe(false);
  });

  it("assigns even/odd class based on match_order parity", () => {
    mockTryGetCustomElement.mockReturnValueOnce(null);

    const wrapperEven = get_match_element(0, 2, {}, () => undefined);
    expect(wrapperEven.classList.contains("even")).toBe(true);

    mockTryGetCustomElement.mockReturnValueOnce(null);
    const wrapperOdd = get_match_element(0, 3, {}, () => undefined);
    expect(wrapperOdd.classList.contains("odd")).toBe(true);
  });
});
