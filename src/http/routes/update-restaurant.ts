import { z } from 'zod'

import { eq } from 'drizzle-orm'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { restaurants, unitys } from '../../database/schema'
import { ResourceNotFoundError } from '../../errors/resource-not-found'

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
          unitId: z.string().optional(),
        }),
        response: {
          204: z.null(),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { name, unitId } = request.body
        const { restaurantId } = request.params

        const restaurant = await db.query.restaurants.findFirst({
          columns: {
            id: true,
          },
          where(fields, { eq }) {
            return eq(fields.id, restaurantId)
          },
        })

        if (!restaurant) {
          throw new ResourceNotFoundError()
        }

        if (name) {
          await db
            .update(restaurants)
            .set({
              name,
            })
            .where(eq(restaurants.id, restaurantId))
        }

        if (unitId) {
          const unit = await db.query.unitys.findFirst({
            where(fields, { eq }) {
              return eq(fields.id, unitId)
            },
          })

          if (!unit) {
            throw new ResourceNotFoundError()
          }

          if (unit.restaurantId !== unitId) {
            await db
              .update(unitys)
              .set({
                restaurantId: restaurant.id,
              })
              .where(eq(unitys.id, unitId))
          }
        }

        return reply.status(204).send()
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({
            message: error.message,
          })
        }
      }
    },
  )
}
