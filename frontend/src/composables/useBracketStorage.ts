import type { Data } from '../lib/data/types'
import defaultTemplateData from '../2025-tournament-blank.json'

/**
 * LocalStorage key used for persisting bracket data.
 */
export const STORAGE_KEY = 'bballBracket:tournament:v1'

/**
 * Loads bracket data from localStorage.
 * Falls back to the default tournament template if no data exists or if data is corrupted.
 * @returns The bracket Data object
 */
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

/**
 * Saves bracket data to localStorage.
 * Logs an error if the save fails (e.g., storage quota exceeded).
 * @param data - The bracket Data object to save
 */
export function saveToStorage(data: Data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
  catch (e) {
    console.error('Failed to save bracket data', e)
  }
}
