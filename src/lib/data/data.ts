export type BracketInstance = {
  moveToPreviousRound: () => void;
  moveToNextRound: () => void;
  moveToLastRound: () => void;
  setBaseRoundIndex: (i: number) => void;
  getNavigationState: () => unknown;
  applyNewOptions: (options: Record<string, unknown>) => void;
  replaceData: (data: Record<string, unknown>) => void;
  applyMatchesUpdates: (updates: Record<string, unknown>) => void;
  getAllData: () => unknown;
  getUserOptions: () => unknown;
  highlightContestantHistory: (contestantId: string) => void;
  uninstall: () => void;
  user_wrapper_el: HTMLElement | null;
}

export type Data = {
  rounds: Round[]; // you must provide objects for each round, including upcoming rounds
  skippedLastRoundsCount?: number; // useful for folding hidden back-rounds
  matches?: Match[]; // optional: can show rounds alone
  teams?: { [id: string]: Team }; // centralized team registry
  [key: string]: unknown;
};

export type Round = {
  name?: string; // could also be required if you always want labels
};

export type Match = {
  id?: string;
  roundIndex: number;
  order: number; // 0-based index inside its round
  sides?: Side[];
  matchStatus?: string; // flexible: "Cancelled" | "Scheduled" | "2025-05-19 18:30"
  isLive?: boolean;
  prediction?: string; // teamId predicted to win
  result?: string; // teamId of actual winner
};

// Match-specific team context (score, winner flag, etc.)
export type Side = {
  teamId?: string; // undefined = slot not filled yet
  score?: Score[];
  isWinner?: boolean;
};

export type Score = {
  mainScore: number | string,
  subscore?: number | string,
  isWinner?: boolean
}

export type Team = {
  id: string;
  name: string;
  seed: number;
  logoUrl?: string;
};

export type Shell = {
  the_root_element: HTMLElement;
  scrollbar: HTMLElement | null;
  round_titles_wrapper: HTMLElement | null;
  matches_scroller: HTMLElement | null;
  matches_positioner: HTMLElement;
  uninstall: () => void;
};

export type DataError = { is_critical: boolean; message: string; data?: unknown };

export type GetOption = (key: string) => unknown;

export type ScrolllaShell = Shell & {
  the_root_element: HTMLElement;
};

export type ScrolllaApi = {
  get_scrollY_ratio: () => number;
  adjust_offset: (scrollY_middle_ratio: number) => void;
  uninstall: () => void;
}

export type BaseIndex = {
  set: (i: number) => void;
  try_decrement: () => void;
  try_increment: () => void;
  get: () => number;
}

export type OptionsDealer = {
  get_final_value: GetOption;
  try_merge_options: (options: Record<string, unknown>) => void;
  get_all_final_options: () => Record<string, unknown>
}

export type OptionMeta = {
  type: string;
  default_value: unknown;
  min_value?: number;
  options?: unknown[];
}

export type FlattenedMeta = Record<string, OptionMeta>
