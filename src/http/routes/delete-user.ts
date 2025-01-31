import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { ResourceNotFoundError } from '../../errors/resource-not-found'
import { UnauthorizedError } from '../../errors/unauthorized'
import { eq } from 'drizzle-orm'
import { users } from '../../database/schema'

export async function deleteUser(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    '/users/:userId',
    {
      schema: {
        summary: 'Delete User',
        tags: ['users'],
        params: z.object({
          userId: z.string().cuid2(),
        }),
        response: {
          200: z.null(),
          401: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      request.jwtVerify({ onlyCookie: true })
      const { sub } = request.user
      try {
        const { userId } = request.params

        const user = await db.query.users.findFirst({
          where(fields, { eq }) {
            return eq(fields.id, userId)
          },
        })

        if (!user) {
          throw new ResourceNotFoundError()
        }

        if (user.role === 'restaurant' || user.role !== 'supervisor') {
          throw new UnauthorizedError()
        }

        if (user.id === sub) {
          throw new UnauthorizedError()
        }

        await db.delete(users).where(eq(users.id, userId))

        return reply.status(200).send()
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }

        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({
            message: error.message,
          })
        }

        throw error
      }
    },
  )
}
