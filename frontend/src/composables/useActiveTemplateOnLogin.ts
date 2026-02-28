import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { getActiveTemplate } from '../api'
import { authClient } from '../auth-client'

/**
 * Fetches the active tournament template when a user logs in.
 * Only executes the query when the user has an active session.
 * @returns Query result containing the active tournament template data
 */
export function useActiveTemplateOnLogin() {
  const session = authClient.useSession()

  const enabled = computed(() => !!session.value.data)

  return useQuery({
    queryKey: ['templates', 'active'],
    queryFn: getActiveTemplate,
    enabled,
  })
}
