import type { Bracket, BracketResponse, BracketsResponse, Data, Template, TemplatesResponse } from './lib/data/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function fetchFromAPI(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint}`
  const hasBody = options?.body !== undefined
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message = body.message || response.statusText
    throw new Error(`API error: ${response.status} ${message}`)
  }
  if (response.status === 204) {
    return
  }

  return response.json()
}

/**
 * GET /health - Check API health status
 */
export async function checkHealth() {
  return fetchFromAPI('/health')
}

/**
 * GET /api/brackets - List all brackets for the current user
 */
export async function getBrackets(): Promise<BracketsResponse> {
  return await fetchFromAPI('/api/brackets')
}

/**
 * GET /api/brackets/:id - Get a specific bracket by ID
 */
export async function getBracket(id: string): Promise<BracketResponse> {
  return fetchFromAPI(`/api/brackets/${encodeURIComponent(id)}`)
}

/**
 * GET /api/brackets/current - Get the current user's active bracket
 * Returns null if no bracket exists
 */
export async function getCurrentBracket(): Promise<BracketResponse | null> {
  try {
    return await fetchFromAPI('/api/brackets/current')
  }
  catch (err) {
    if (err instanceof Error && err.message.includes('404')) {
      return null
    }
    throw err
  }
}

/**
 * POST /api/brackets - Create a new bracket
 */
export async function createBracket(params: { template_id: string, data: Data, is_public?: boolean }): Promise<Bracket> {
  return fetchFromAPI('/api/brackets', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * PUT /api/brackets/:id - Update an existing bracket
 */
export async function updateBracket(id: string, data: { data?: Data, is_public?: boolean }): Promise<Bracket> {
  return fetchFromAPI(`/api/brackets/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * GET /api/templates - List all tournament templates
 */
export async function getTemplates(): Promise<TemplatesResponse> {
  return fetchFromAPI('/api/templates')
}

/**
 * GET /api/templates/active - Get the currently active tournament template
 */
export async function getActiveTemplate(): Promise<{ template: Template }> {
  return fetchFromAPI('/api/templates/active')
}

/**
 * PATCH /api/templates/:id/activate - Set a template as active
 * Deactivates all other templates for the same year
 */
export async function activateTemplate(id: string): Promise<{ message: string }> {
  return fetchFromAPI(`/api/templates/${encodeURIComponent(id)}/activate`, {
    method: 'PATCH',
  })
}

/**
 * POST /api/templates - Create a new tournament template
 * Requires admin role
 */
export async function createTemplate(params: { year: number, name: string, data: Data, is_active?: boolean }): Promise<Template> {
  return fetchFromAPI('/api/templates', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * PUT /api/templates/:id/results - Update tournament results
 * Requires admin role
 */
export async function updateTemplateResults(id: string, matches: unknown[]): Promise<{ message: string, results: unknown[] }> {
  return fetchFromAPI(`/api/templates/${encodeURIComponent(id)}/results`, {
    method: 'PUT',
    body: JSON.stringify({ matches }),
  })
}

/**
 * GET /api/templates/:id/results - Get tournament results
 */
export async function getTemplateResults(id: string): Promise<{ results: unknown[] }> {
  return fetchFromAPI(`/api/templates/${encodeURIComponent(id)}/results`)
}

export async function deleteTemplate(id: string): Promise<void> {
  return fetchFromAPI(`/api/templates/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
