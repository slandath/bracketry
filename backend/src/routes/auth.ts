import type { FastifyInstance } from 'fastify'
import process from 'node:process'
import { auth } from '../utils/auth.js'

const required = ['AUTH_POST_LOGIN_URL', 'AUTH_ERROR_URL']
for (const key of required) {
  if (!process.env[key])
    throw new Error(`Missing ${key}`)
}

export default async function authRoutes(app: FastifyInstance) {
  // GitHub OAuth Sign In
  app.get('/signin/github', async (request, reply) => {
    try {
      const response = await auth.api.signInSocial({
        body: {
          provider: 'github',
          callbackURL: process.env.AUTH_POST_LOGIN_URL as string,
          errorCallbackURL: process.env.AUTH_ERROR_URL as string,
        },
        headers: request.headers,
      })

      // Handle redirect
      if (response.redirect && response.url) {
        return reply.redirect(response.url)
      }

      return reply.send(response)
    }
    catch (error) {
      console.error('OAuth sign-in error:', error)
      return reply.status(500).send({ error: 'OAuth sign-in failed' })
    }
  })

  // GitHub OAuth Callback
  app.get('/callback/github', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const url = new URL(request.url, `http://${request.headers.host}`)

    try {
      const queryParams: Record<string, string> = {}
      url.searchParams.forEach((value, key) => {
        queryParams[key] = value
      })

      const response = await auth.api.callbackOAuth({
        params: { id: 'github' },
        query: queryParams,
        headers: request.headers,
      })

      return reply.send(response)
    }
    catch (error) {
      console.error('OAuth callback error:', error)
      return reply.status(500).send({ error: 'OAuth callback failed' })
    }
  })

  // Get Session
  app.get('/session', async (request, reply) => {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      })
      if (!session)
        return reply.status(401).send({ error: 'Unauthenticated' })
      return reply.send(session)
    }
    catch (error) {
      console.error('Session error:', error)
      return reply.status(500).send({ error: 'Session lookup failed' })
    }
  })

  // Sign Out
  app.post('/signout', async (request, reply) => {
    try {
      await auth.api.signOut({
        headers: request.headers,
      })

      return reply.send({ success: true })
    }
    catch (error) {
      console.error('Sign out error:', error)
      return reply.status(500).send({ success: false, error: 'Sign out failed' })
    }
  })
}
