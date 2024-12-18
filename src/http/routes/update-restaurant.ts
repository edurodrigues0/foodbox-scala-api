import { z } from 'zod'

import { eq } from 'drizzle-orm'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { restaurants } from '../../database/schema'

export async function updateRestaurant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    '/restaurants/:restaurantId',
    {
      schema: {
        summary: 'Update Restaurants',
        tags: ['restaurants'],
        params: z.object({
          restaurantId: z.string().cuid2(),
        }),
        body: z.object({
          name: z.string().optional(),
        }),
        response: {
          204: z.null(),
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name } = request.body
      const { restaurantId } = request.params

      await db
        .update(restaurants)
        .set({
          name,
        })
        .where(eq(restaurants.id, restaurantId))

      return reply.status(204).send()
    },
  )
}
