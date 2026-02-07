// API configuration for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function fetchFromAPI(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
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
