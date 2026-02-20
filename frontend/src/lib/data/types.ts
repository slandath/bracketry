export interface BracketInstance {
  moveToPreviousRound: () => void
  moveToNextRound: () => void
  moveToLastRound: () => void
  setBaseRoundIndex: (i: number) => void
  getNavigationState: () => unknown
  applyNewOptions: (options: Record<string, unknown>) => void
  replaceData: (data: Record<string, unknown>) => void
  applyMatchesUpdates: (updates: Record<string, unknown>) => void
  getAllData: () => unknown
  getUserOptions: () => unknown
  highlightContestantHistory: (contestantId: string) => void
  uninstall: () => void
  user_wrapper_el: HTMLElement | null
}

export interface Data {
  rounds: Round[] // you must provide objects for each round, including upcoming rounds
  skippedLastRoundsCount?: number // useful for folding hidden back-rounds
  matches?: Match[] // optional: can show rounds alone
  teams?: { [id: string]: Team } // centralized team registry
  [key: string]: unknown
}

export interface Round {
  name?: string // could also be required if you always want labels
}

export interface Match {
  id: string
  roundIndex: number
  order: number // 0-based index inside its round
  sides: Side[]
  matchStatus: string | null // flexible: "Cancelled" | "Scheduled" | "2025-05-19 18:30"
  isLive?: boolean
  prediction: string | null // teamId predicted to win
  result: string | null // teamId of actual winner
}

// Match-specific team context (score, winner flag, etc.)
export interface Side {
  teamId?: string // undefined = slot not filled yet
  score?: number // simple score for basketball (no sets/games)
  isWinner?: boolean
}

export interface Team {
  id: string
  name: string
  seed: number
  logoUrl: string | null
}

export interface Shell {
  the_root_element: HTMLElement
  scrollbar: HTMLElement | null
  round_titles_wrapper: HTMLElement | null
  matches_scroller: HTMLElement | null
  matches_positioner: HTMLElement
  uninstall: () => void
}

export interface BracketScore {
  correctPicks: number
}

export interface DataError {
  is_critical: boolean
  message: string
  data?: unknown
}

export type GetOption = (key: string) => unknown

export type ScrolllaShell = Shell & {
  the_root_element: HTMLElement
}

export interface ScrolllaApi {
  get_scrollY_ratio: () => number
  adjust_offset: (scrollY_middle_ratio: number) => void
  uninstall: () => void
}

export interface BaseIndex {
  set: (i: number) => void
  try_decrement: () => void
  try_increment: () => void
  get: () => number
}

export interface OptionsDealer {
  get_final_value: GetOption
  try_merge_options: (options: Record<string, unknown>) => void
  get_all_final_options: () => Record<string, unknown>
}

export interface OptionMeta {
  type: string
  default_value: unknown
  min_value?: number
  options?: unknown[]
}

// API response types
export interface Bracket {
  id: string
  user_id: string
  template_id: string
  data: Data
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface Template {
  id: string
  year: number
  name: string
  data: Data
  is_active: boolean
  created_at?: string
  updated_at?: string
}

// API response wrappers
export interface BracketsResponse {
  brackets: Bracket[]
  message?: string
}

export interface BracketResponse {
  bracket: Bracket
}

export interface TemplatesResponse {
  templates: Template[]
}

export type FlattenedMeta = Record<string, OptionMeta>
