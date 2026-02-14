import process from 'node:process'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import * as schema from '../db/schema.js'
import { db } from '../index.js'

const required = ['BETTER_AUTH_URL', 'FRONTEND_URL', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'AUTH_POST_LOGIN_URL', 'AUTH_ERROR_URL']
for (const key of required) {
  if (!process.env[key])
    throw new Error(`Missing ${key}`)
}

const frontend_url = process.env.FRONTEND_URL

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  trustedOrigins: frontend_url ? [frontend_url] : [],
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
  advanced: {
    cookiePrefix: 'bracketry',
    useSecureCookies: false,
    cookie: {
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    },
  },
})
