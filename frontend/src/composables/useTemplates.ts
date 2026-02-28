import { useQuery } from '@tanstack/vue-query'
import { getActiveTemplate, getTemplates } from '../api'

/**
 * Fetches all tournament templates.
 * @returns Query result containing the list of all tournament templates
 */
export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates,
  })
}

/**
 * Fetches the currently active tournament template.
 * Cached for 1 hour to reduce API calls.
 * @returns Query result containing the active tournament template
 */
export function useActiveTemplate() {
  return useQuery({
    queryKey: ['templates', 'active'],
    queryFn: getActiveTemplate,
    staleTime: 1000 * 60 * 60,
  })
}
