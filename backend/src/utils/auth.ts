import type { FastifyRequest } from 'fastify'
import process from 'node:process'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import * as schema from '../db/schema.js'
import { db } from '../index.js'

const required = ['BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'FRONTEND_URL', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'AUTH_POST_LOGIN_URL', 'AUTH_ERROR_URL']
for (const key of required) {
  if (!process.env[key])
    throw new Error(`Missing ${key}`)
}

const frontendUrl = process.env.FRONTEND_URL

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  trustedOrigins: frontendUrl ? [frontendUrl] : [],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
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
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookie: {
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    },
  },
  plugins: [
    admin({
      adminUserIds: process.env.ADMIN_USER_IDS?.split(',') ?? [],
    }),
  ],
})

export async function getAdminOrThrow(request: FastifyRequest): Promise<NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session)
    throw new Error('Unauthorized')
  if (session.user.role !== 'admin')
    throw new Error('Forbidden')
  return session
}

export async function getSessionOrThrow(request: FastifyRequest): Promise<NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}
