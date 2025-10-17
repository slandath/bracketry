// src/App.test.tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { recomputeLaterRoundsFromPicks } from "../../src/App";
import { Data } from "../../src/lib/data/data";

const mockRounds = [
  { name: "Round of 64" },
  { name: "Round of 32" },
  { name: "Sweet 16" },
];

const mockTeams = {
  "1": { id: "1", name: "Duke", seed: 1 },
  "16": { id: "16", name: "FGCU", seed: 16 },
  "8": { id: "8", name: "Xavier", seed: 8 },
  "9": { id: "9", name: "FSU", seed: 9 },
};

const mockBracketData: Data = {
  rounds: mockRounds,
  matches: [
    {
      id: "m1",
      roundIndex: 0,
      order: 0,
      sides: [{ teamId: "1" }, { teamId: "16" }],
    },
    {
      id: "m2",
      roundIndex: 0,
      order: 1,
      sides: [{ teamId: "8" }, { teamId: "9" }],
    },
    {
      id: "m3",
      roundIndex: 1,
      order: 0,
      sides: [{ teamId: undefined }, { teamId: undefined }],
    },
    {
      id: "m4",
      roundIndex: 1,
      order: 1,
      sides: [{ teamId: undefined }, { teamId: undefined }],
    },
  ],
  teams: mockTeams,
};

describe("App - handlePick & write-lock queue", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("recomputes downstream rounds after a pick", () => {
    const data = structuredClone(mockBracketData);
    data.matches![0].prediction = "1";
    data.matches![1].prediction = "8";

    recomputeLaterRoundsFromPicks(data);

    expect(data.matches![2].sides?.[0]?.teamId).toBe("1");
    expect(data.matches![2].sides?.[1]?.teamId).toBe("8");
  });

  it("clears downstream predictions if both upstream picks aren't set", () => {
    const data = structuredClone(mockBracketData);
    data.matches![0].prediction = "1"; // Only left pick set
    data.matches![2].prediction = "1"; // Old prediction to clear

    recomputeLaterRoundsFromPicks(data);

    expect(data.matches![2].prediction).toBeUndefined();
  });

  it("marks round as Predicted when both upstream picks exist", () => {
    const data = structuredClone(mockBracketData);
    data.matches![0].prediction = "1";
    data.matches![1].prediction = "8";

    recomputeLaterRoundsFromPicks(data);

    expect(data.matches![2].matchStatus).toBe("Predicted");
  });

  it("uses result as fallback when prediction is not set", () => {
    const data = structuredClone(mockBracketData);
    data.matches![0].result = "1";
    data.matches![1].result = "8";

    recomputeLaterRoundsFromPicks(data);

    expect(data.matches![2].sides?.[0]?.teamId).toBe("1");
    expect(data.matches![2].sides?.[1]?.teamId).toBe("8");
  });

  it("prefers prediction over result", () => {
    const data = structuredClone(mockBracketData);
    data.matches![0].prediction = "1";
    data.matches![0].result = "16";
    data.matches![1].prediction = "8";
    data.matches![1].result = "9";

    recomputeLaterRoundsFromPicks(data);

    expect(data.matches![2].sides?.[0]?.teamId).toBe("1");
    expect(data.matches![2].sides?.[1]?.teamId).toBe("8");
  });

  it("reverts matchStatus from Predicted to Scheduled when picks are cleared", () => {
    const data = structuredClone(mockBracketData);
    data.matches![0].prediction = "1";
    data.matches![1].prediction = "8";
    data.matches![2].matchStatus = "Predicted";

    recomputeLaterRoundsFromPicks(data);

    data.matches![0].prediction = undefined;
    recomputeLaterRoundsFromPicks(data);

    expect(data.matches![2].matchStatus).toBe("Scheduled");
    expect(data.matches![2].prediction).toBeUndefined();
  });
});
