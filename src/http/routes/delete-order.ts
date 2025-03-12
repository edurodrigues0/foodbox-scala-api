import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { ResourceNotFoundError } from '../../errors/resource-not-found'
import { UnauthorizedError } from '../../errors/unauthorized'
import { eq } from 'drizzle-orm'
import { orders } from '../../database/schema'

export async function deleteOrder(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    '/orders/:orderId',
    {
      schema: {
        summary: 'Delete Order',
        tags: ['orders'],
        params: z.object({
          orderId: z.string().cuid2(),
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
      try {
        const { orderId } = request.params

        const order = await db.query.orders.findFirst({
          where(fields, { eq, and, gte }) {
            return and(
              eq(fields.id, orderId),
              gte(fields.orderDate, new Date()),
            )
          },
        })

        if (!order) {
          throw new ResourceNotFoundError()
        }

        await db.delete(orders).where(eq(orders.id, orderId))

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
