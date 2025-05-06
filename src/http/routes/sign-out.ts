import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

export async function signOut(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/sign-out',
    {
      schema: {
        summary: 'Sign out',
        tags: ['auth'],
        response: {
          200: z.null(),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (_, reply) => {
      try {
        reply.clearCookie('token', {
          path: '/',
        })

        reply.status(200).send()
      } catch (error) {
        reply.status(500).send({
          message: 'Failed to sign out',
        })
      }
    },
  )
}
