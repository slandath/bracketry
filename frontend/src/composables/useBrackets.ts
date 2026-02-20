import type { Data } from '../lib/data/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { createBracket, getBrackets, getCurrentBracket, updateBracket } from '../api'

export function useBrackets() {
  return useQuery({
    queryKey: ['brackets'],
    queryFn: getBrackets,
  })
}

export function useCurrentBracket() {
  return useQuery({
    queryKey: ['bracket', 'current'],
    queryFn: getCurrentBracket,
  })
}

export function useCreateBracket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      template_id: string
      data: Data
    }) => createBracket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brackets'] })
      queryClient.invalidateQueries({ queryKey: ['bracket'] })
    },
  })
}

export function useUpdateBracket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data}: { id: string, data: { data: Data } }) => updateBracket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brackets'] })
      queryClient.invalidateQueries({ queryKey: ['bracket'] })
    },
  })
}
