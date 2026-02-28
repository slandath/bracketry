/**
 * Fetches the active tournament template when a user logs in.
 * Only executes the query when the user has an active session.
 */
export { useActiveTemplateOnLogin } from './useActiveTemplateOnLogin'

/**
 * Handles redirecting users after successful authentication.
 * Supports both query parameter redirects and sessionStorage redirects.
 */
export { useAuthRedirect } from './useAuthRedirect'

/**
 * Provides global state for bracket selection actions.
 * Controls the visibility of the selection tool and triggers bracket evaluation.
 */
export { useBracketActions } from './useBracketActions'

/**
 * Bracket data management using TanStack Query.
 * - useBrackets: Fetches all user brackets
 * - useCurrentBracket: Fetches the current bracket
 * - useCurrentBracketOnLogin: Fetches bracket on login
 * - useCreateBracket: Mutation to create a new bracket
 * - useUpdateBracket: Mutation to update an existing bracket
 */
export {
  useBrackets,
  useCreateBracket,
  useCurrentBracket,
  useCurrentBracketOnLogin,
  useUpdateBracket,
} from './useBrackets'

/**
 * LocalStorage utilities for persisting bracket data.
 * - loadFromStorage: Loads bracket data from localStorage with fallback to default
 * - saveToStorage: Saves bracket data to localStorage
 * - STORAGE_KEY: The localStorage key used for bracket data
 */
export { loadFromStorage, saveToStorage, STORAGE_KEY } from './useBracketStorage'

export { useEvaluateBracket } from './useEvaluateBracket'

/**
 * Manages the state of the bracket selection interface.
 * Handles navigation between rounds/matches, team selection, and keyboard shortcuts.
 * - SELECTION_STATE_KEY: localStorage key for persisting selection state
 */
export { SELECTION_STATE_KEY, useSelectionState } from './useSelectionState'

/**
 * Tournament template queries using TanStack Query.
 * - useTemplates: Fetches all tournament templates
 * - useActiveTemplate: Fetches the currently active tournament template
 */
export { useActiveTemplate, useTemplates } from './useTemplates'
/**
 * Typed session wrapper for better-auth.
 * Provides type-safe access to session data including user role.
 */
export { useTypedSession } from './useTypedSession'
