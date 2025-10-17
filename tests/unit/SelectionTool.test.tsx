// src/SelectionTool.test.tsx
import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SelectionTool from "../../src/SelectionTool";
import { Data, Match, Round, Team } from "../../src/lib/data/data";

const mockRounds: Round[] = [
  { name: "Round of 64" },
  { name: "Round of 32" },
  { name: "Sweet 16" },
  { name: "Elite 8" },
  { name: "Final 4" },
  { name: "Championship" },
];

const mockTeams: Record<string, Team> = {
  "1": { id: "1", name: "Duke", seed: 1, logoUrl: "" },
  "16": { id: "16", name: "FGCU", seed: 16, logoUrl: "" },
  "8": { id: "8", name: "Xavier", seed: 8, logoUrl: "" },
  "9": { id: "9", name: "FSU", seed: 9, logoUrl: "" },
};

const mockMatches: Match[] = [
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
    sides: [{ teamId: "1" }, { teamId: "8" }],
  },
];

const mockData: Data = {
  rounds: mockRounds,
  matches: mockMatches,
  teams: mockTeams,
};

describe("SelectionTool", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders the first match by default", () => {
    render(<SelectionTool data={mockData} />);
    expect(screen.getByText("Round of 64")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("Duke")).toBeInTheDocument();
    expect(screen.getByText("FGCU")).toBeInTheDocument();
  });

  it("allows selecting a team and updates pending picks", async () => {
    const user = userEvent.setup();
    render(<SelectionTool data={mockData} />);

    const dukRadio = screen.getByRole("radio", { name: /Duke/ });
    await user.click(dukRadio);

    expect(dukRadio).toBeChecked();
  });

  it("navigates between matches in a round with arrow buttons", async () => {
    const user = userEvent.setup();
    render(<SelectionTool data={mockData} />);
    expect(screen.getByText("Duke")).toBeInTheDocument();

    const nextBtn = screen.getByLabelText("Next match");
    await user.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText("2 / 2")).toBeInTheDocument();
      expect(screen.getByText("Xavier")).toBeInTheDocument();
    });

    const prevBtn = screen.getByLabelText("Previous match");
    await user.click(prevBtn);

    await waitFor(() => {
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });
  });

  it("disables Save & Continue if not all matches are picked", () => {
    render(<SelectionTool data={mockData} />);
    const saveBtn = screen.getByRole("button", { name: /Save & Continue/ });
    expect(saveBtn).toBeDisabled();
  });

  it("enables Save & Continue only when all round matches are picked", async () => {
    const user = userEvent.setup();
    render(<SelectionTool data={mockData} />);

    const dukRadio = screen.getByRole("radio", { name: /Duke/ });
    await user.click(dukRadio);

    const nextBtn = screen.getByLabelText("Next match");
    await user.click(nextBtn);

    const xavierRadio = screen.getByRole("radio", { name: /Xavier/ });
    await user.click(xavierRadio);

    const saveBtn = screen.getByRole("button", { name: /Save & Continue/ });

    await waitFor(() => {
      expect(saveBtn).not.toBeDisabled();
    });
  });

  it("calls onPick for each picked match when Save & Continue is clicked", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    const onRefresh = vi.fn();

    render(
      <SelectionTool data={mockData} onPick={onPick} onRefresh={onRefresh} />,
    );

    const dukRadio = screen.getByRole("radio", { name: /Duke/ });
    await user.click(dukRadio);

    const nextBtn = screen.getByLabelText("Next match");
    await user.click(nextBtn);

    const xavierRadio = screen.getByRole("radio", { name: /Xavier/ });
    await user.click(xavierRadio);

    const saveBtn = screen.getByRole("button", { name: /Save & Continue/ });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(onPick).toHaveBeenCalledTimes(2);
      expect(onPick).toHaveBeenCalledWith(mockMatches[0], "1");
      expect(onPick).toHaveBeenCalledWith(mockMatches[1], "8");
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  it("clears pending picks after Save & Continue", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    const onRefresh = vi.fn();

    render(
      <SelectionTool data={mockData} onPick={onPick} onRefresh={onRefresh} />,
    );

    const dukRadio = screen.getByRole("radio", { name: /Duke/ });
    await user.click(dukRadio);

    const nextBtn = screen.getByLabelText("Next match");
    await user.click(nextBtn);

    const xavierRadio = screen.getByRole("radio", { name: /Xavier/ });
    await user.click(xavierRadio);

    const saveBtn = screen.getByRole("button", { name: /Save & Continue/ });
    await user.click(saveBtn);

    await waitFor(() => {
      const resetBtn = screen.getByRole("button", { name: /Reset Round/ });
      expect(resetBtn).toBeDisabled();
    });
  });

  it("resets pending picks when Reset Round is clicked", async () => {
    const user = userEvent.setup();
    render(<SelectionTool data={mockData} />);

    const dukRadio = screen.getByRole("radio", { name: /Duke/ });
    await user.click(dukRadio);

    expect(dukRadio).toBeChecked();

    const resetBtn = screen.getByRole("button", { name: /Reset Round/ });
    await user.click(resetBtn);

    await waitFor(() => {
      expect(dukRadio).not.toBeChecked();
    });
  });

  it("persists round and match index to localStorage", async () => {
    const user = userEvent.setup();
    render(<SelectionTool data={mockData} />);

    const nextBtn = screen.getByLabelText("Next match");
    await user.click(nextBtn);

    await waitFor(() => {
      const saved = JSON.parse(
        localStorage.getItem("bracketry:selection:state") || "{}",
      );
      expect(saved.round).toBe(0);
      expect(saved.matchIndex).toBe(1);
    });
  });

  it("restores round and match index from localStorage", () => {
    localStorage.setItem(
      "bracketry:selection:state",
      JSON.stringify({ round: 0, matchIndex: 1 }),
    );

    render(<SelectionTool data={mockData} />);
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByText("Xavier")).toBeInTheDocument();
  });

it("changes button text to Save Final Picks on last round", () => {
  const dataLastRound: Data = {
    rounds: mockRounds,
    matches: [
      ...mockMatches,
      {
        id: "m4",
        roundIndex: 5,
        order: 0,
        sides: [{ teamId: "1" }, { teamId: "8" }],
      },
    ],
    teams: mockTeams,
  };

  localStorage.setItem(
    "bracketry:selection:state",
    JSON.stringify({ round: 5, matchIndex: 0 }),
  );

  render(<SelectionTool data={dataLastRound} />);
  expect(
    screen.getByRole("button", { name: /Save Final Picks/ }),
  ).toBeInTheDocument();
});

it("advances to next round after Save & Continue", async () => {
  const user = userEvent.setup();
  const onPick = vi.fn();
  const onRefresh = vi.fn();

  render(
    <SelectionTool data={mockData} onPick={onPick} onRefresh={onRefresh} />,
  );

  const dukRadio = screen.getByRole("radio", { name: /Duke/ });
  await user.click(dukRadio);

  const nextBtn = screen.getByLabelText("Next match");
  await user.click(nextBtn);

  const xavierRadio = screen.getByRole("radio", { name: /Xavier/ });
  await user.click(xavierRadio);

  const saveBtn = screen.getByRole("button", { name: /Save & Continue/ });
  await user.click(saveBtn);

  await waitFor(() => {
    // Check that we're now showing round 1 match (Xavier vs someone)
    expect(screen.getByText("Round of 32")).toBeInTheDocument();
  });
});

  it("respects locked predictions and disables team cards", () => {
    const lockedData: Data = {
        rounds: mockRounds,
      matches: [
        {
          ...mockMatches[0],
          prediction: "1",
        },
      ],
      teams: mockTeams,
    };

    const { container } = render(<SelectionTool data={lockedData} />);
    const disabledCards = container.querySelectorAll(".team-card--disabled");
    expect(disabledCards.length).toBeGreaterThan(0);
  });

  it("keyboard navigation with arrow keys", async () => {
    render(<SelectionTool data={mockData} />);
    expect(screen.getByText("1 / 2")).toBeInTheDocument();

    const arrowRightEvent = new KeyboardEvent("keydown", {
      key: "ArrowRight",
    });
    window.dispatchEvent(arrowRightEvent);

    await waitFor(() => {
      expect(screen.getByText("2 / 2")).toBeInTheDocument();
    });

    const arrowLeftEvent = new KeyboardEvent("keydown", {
      key: "ArrowLeft",
    });
    window.dispatchEvent(arrowLeftEvent);

    await waitFor(() => {
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });
  });

  it("Reset Round button is disabled when no pending picks exist", () => {
    render(<SelectionTool data={mockData} />);
    const resetBtn = screen.getByRole("button", { name: /Reset Round/ });
    expect(resetBtn).toBeDisabled();
  });

  it("Reset Round button is enabled after selecting a team", async () => {
    const user = userEvent.setup();
    render(<SelectionTool data={mockData} />);

    const dukRadio = screen.getByRole("radio", { name: /Duke/ });
    await user.click(dukRadio);

    const resetBtn = screen.getByRole("button", { name: /Reset Round/ });
    await waitFor(() => {
      expect(resetBtn).not.toBeDisabled();
    });
  });

  it("handles TBD teams gracefully", () => {
    const tbdData: Data = {
        rounds: mockRounds,
      matches: [
        {
          id: "m1",
          roundIndex: 0,
          order: 0,
          sides: [{ teamId: "1" }, {teamId: undefined}],
          prediction: undefined,
        },
      ],
      teams: mockTeams,
    };

    render(<SelectionTool data={tbdData} />);
    expect(screen.getByText("TBD")).toBeInTheDocument();
  });
});
