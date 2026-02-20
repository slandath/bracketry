import { useQuery } from '@tanstack/vue-query'
import { getActiveTemplate, getTemplates } from '../api'

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates,
  })
}

export function useActiveTemplate() {
  return useQuery({
    queryKey: ['templates', 'active'],
    queryFn: getActiveTemplate,
    staleTime: 1000 * 60 * 60,
  })
}
