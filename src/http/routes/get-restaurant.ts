import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { ResourceNotFoundError } from '../../errors/resource-not-found'

export async function getRestaurant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/restaurants/:restaurantId',
    {
      schema: {
        summary: 'Get Restaurant',
        tags: ['restaurants'],
        params: z.object({
          restaurantId: z.string().cuid2(),
        }),
        response: {
          200: z.object({
            restaurant: z.object({
              id: z.string().cuid2(),
              name: z.string(),
              manager: z
                .object({
                  name: z.string(),
                  email: z.string().email(),
                })
                .nullable(),
            }),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { restaurantId } = request.params

        const restaurant = await db.query.restaurants.findFirst({
          columns: {
            id: true,
            name: true,
          },
          with: {
            manager: {
              columns: {
                name: true,
                email: true,
              },
            },
          },
          where(fields, { eq }) {
            return eq(fields.id, restaurantId)
          },
        })

        if (!restaurant) {
          throw new ResourceNotFoundError()
        }

        return reply.status(200).send({ restaurant })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }

        throw error
      }
    },
  )
}
