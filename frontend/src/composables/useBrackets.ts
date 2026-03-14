import type { Data } from '../lib/data/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { createBracket, getBrackets, getCurrentBracket, updateBracket } from '../api'
import { authClient } from '../auth-client'

/**
 * Fetches all brackets for the current user.
 * @returns Query result containing the list of user brackets
 */
export function useBrackets() {
  return useQuery({
    queryKey: ['brackets'],
    queryFn: getBrackets,
  })
}

/**
 * Fetches the current user's active bracket.
 * Cached for 5 minutes to reduce API calls.
 * @returns Query result containing the current bracket data
 */
export function useCurrentBracket() {
  return useQuery({
    queryKey: ['bracket', 'current'],
    queryFn: getCurrentBracket,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Fetches the current bracket only when the user is logged in.
 * Cached for 5 minutes to reduce API calls.
 * @returns Query result containing the current bracket data
 */
export function useCurrentBracketOnLogin() {
  const session = authClient.useSession()
  const enabled = computed(() => !!session.value.data)

  return useQuery({
    queryKey: ['bracket', 'current'],
    queryFn: getCurrentBracket,
    staleTime: 1000 * 60 * 5,
    enabled,
  })
}

/**
 * Mutation to create a new bracket.
 * Invalidates the brackets and bracket queries on success.
 * @returns Mutation result with create function
 */
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

/**
 * Mutation to update an existing bracket.
 * Invalidates the brackets and bracket queries on success.
 * @returns Mutation result with update function
 */
export function useUpdateBracket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: { data: Data } }) => updateBracket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brackets'] })
      queryClient.invalidateQueries({ queryKey: ['bracket'] })
    },
  })
}
