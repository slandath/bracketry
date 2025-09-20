export type Data = {
  rounds: Round[]; // you must provide objects for each round, including upcoming rounds
  skippedLastRoundsCount?: number; // useful for folding hidden back-rounds
  matches?: Match[]; // optional: can show rounds alone
  teams?: { [id: string]: Team }; // centralized team registry
};

export type Round = {
  name?: string; // could also be required if you always want labels
};

export type Match = {
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
  teamId?: string;   // undefined = slot not filled yet
  score?: number;
  isWinner?: boolean;
};

export type Team = {
  id: string;
  name: string;
  seed: number;
  logoUrl?: string;
};