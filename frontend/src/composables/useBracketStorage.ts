import type { Data } from '../lib/data/types'
import defaultTemplateData from '../2025-tournament-blank.json'

export const STORAGE_KEY = 'bballBracket:tournament:v1'

export function loadFromStorage(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : defaultTemplateData as Data
  }
  catch {
    console.warn('Corrupted bracket data, using default')
    return defaultTemplateData as Data
  }
}

export function saveToStorage(data: Data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
  catch (e) {
    console.error('Failed to save bracket data', e)
  }
}
