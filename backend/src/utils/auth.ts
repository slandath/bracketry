import process from 'node:process'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import * as schema from '../db/schema.js'
import { db } from '../index.js'

const required = ['BETTER_AUTH_URL', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET']
for (const key of required) {
  if (!process.env[key])
    throw new Error(`Missing ${key}`)
}

export const auth = betterAuth({
  baseURL: `${process.env.BETTER_AUTH_URL}/api/auth`,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
})
