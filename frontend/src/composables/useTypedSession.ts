import type { SessionData, TypedSession, UserRole } from '../lib/data/types'
import { computed } from 'vue'
import { authClient } from '../auth-client'

/**
 * Typed session wrapper for better-auth.
 * Provides type-safe access to session data including user role.
 * Wraps the better-auth useSession hook with explicit TypeScript types.
 *
 * @returns TypedSession object with:
 *   - data: The session data (user and session info)
 *   - isPending: Whether the session is still loading
 *   - isLoggedIn: Whether a user is authenticated
 *   - role: The user's role ('admin' | 'user' | null)
 *   - user: The user object from the session
 */
export function useTypedSession(): TypedSession {
  const sessionStore = authClient.useSession()

  const data = computed(() => sessionStore.value?.data as SessionData | null)
  const isPending = computed(() => sessionStore.value?.isPending ?? false)
  const isLoggedIn = computed(() => !!data.value?.user)
  const role = computed((): UserRole | null => data.value?.user?.role ?? null)
  const user = computed(() => data.value?.user ?? null)

  return {
    data,
    isPending,
    isLoggedIn,
    role,
    user,
  }
}
