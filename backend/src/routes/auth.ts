import type { FastifyInstance } from 'fastify'
import { auth } from '../utils/auth.js'

export default async function authRoutes(app: FastifyInstance) {
  // GitHub OAuth Sign In
  app.get('/signin/github', async (request, reply) => {
    const response = await auth.api.signInSocial({
      body: {
        provider: 'github',
        callbackURL: 'http://localhost:5173/',
        errorCallbackURL: 'http://localhost:5173/error',
      },
      headers: request.headers,
    })

    // Handle redirect
    if (response.redirect && response.url) {
      return reply.redirect(response.url)
    }

    return reply.send(response)
  })

  // GitHub OAuth Callback
  app.get('/callback/github', async (request, reply) => {
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
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    return reply.send(session)
  })

  // Sign Out
  app.post('/signout', async (request, reply) => {
    await auth.api.signOut({
      headers: request.headers,
    })

    return reply.send({ success: true })
  })
}
