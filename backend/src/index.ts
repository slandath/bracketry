import process from 'node:process'
import { drizzle } from 'drizzle-orm/node-postgres'
import 'dotenv/config'

const database_url = process.env.NODE_ENV === 'production'
  ? process.env.DATABASE_URL_PROD
  : process.env.DATABASE_URL_DEV

if (!database_url) {
  throw new Error('Database URL not configured.  Please check your .env file')
}

console.warn(`Connecting to ${process.env.NODE_ENV} database...`)

export const db = drizzle(database_url)
