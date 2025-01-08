import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

export async function signOut(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
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
    async (request, reply) => {
      try {
        reply.clearCookie('refreshToken', {
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
