/// <reference types="node" />
import * as process from 'node:process'
import { defineConfig } from 'drizzle-kit'
import 'dotenv/config'

const database_url
  = process.env.NODE_ENV === 'production'
    ? process.env.DATABASE_URL_PROD
    : process.env.DATABASE_URL_DEV

if (!database_url) {
  throw new Error('DATABASE_URL is not set')
}

export default defineConfig({
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: database_url,
  },
})
