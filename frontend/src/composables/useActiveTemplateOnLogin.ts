import { useQuery } from '@tanstack/vue-query'
import { computed } from 'vue'
import { getActiveTemplate } from '../api'
import { authClient } from '../auth-client'

export function useActiveTemplateOnLogin() {
  const session = authClient.useSession()

  const enabled = computed(() => !!session.value.data)

  return useQuery({
    queryKey: ['templates', 'active'],
    queryFn: getActiveTemplate,
    enabled,
  })
}
