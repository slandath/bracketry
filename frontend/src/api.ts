import type { Bracket, BracketResponse, BracketsResponse, Data, Template, TemplatesResponse } from './lib/data/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function fetchFromAPI(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Health check example
export async function checkHealth() {
  return fetchFromAPI('/health')
}

// Brackets
export async function getBrackets(): Promise<BracketsResponse> {
  return fetchFromAPI('/api/brackets')
}

export async function getBracket(id: string): Promise<BracketResponse> {
  return fetchFromAPI(`/api/brackets/${id}`)
}

export async function getCurrentBracket(): Promise<{ bracket: Bracket }> {
  return fetchFromAPI('/api/brackets/current')
}

export async function createBracket(data: { template_id: string, data: Data, is_public?: boolean }): Promise<Bracket> {
  return fetchFromAPI('/api/brackets', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateBracket(id: string, data: { data?: Data, is_public?: boolean }): Promise<Bracket> {
  return fetchFromAPI(`/api/brackets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// Templates
export async function getTemplates(): Promise<TemplatesResponse> {
  return fetchFromAPI('/api/templates')
}

export async function getActiveTemplate(): Promise<{ template: Template }> {
  return fetchFromAPI('/api/templates/active')
}
