import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { eq } from 'drizzle-orm'
import { restaurants, unitys } from '../../database/schema'
import { z } from 'zod'

export async function getUnits(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/units',
    {
      schema: {
        summary: 'Get Units',
        tags: ['units'],
        response: {
          200: z.object({
            units_and_restaurants: z.array(
              z.object({
                unit_id: z.string().cuid2(),
                unit_name: z.string(),
                unit_code: z.number().nullable(),
                restaurant_id: z.string().cuid2().nullable(),
                restaurant_name: z.string().nullable(),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const unitsAndRestaurants = await db
        .select({
          unit_id: unitys.id,
          unit_name: unitys.name,
          unit_code: unitys.unity,
          restaurant_id: restaurants.id,
          restaurant_name: restaurants.name,
        })
        .from(unitys)
        .leftJoin(restaurants, eq(restaurants.id, unitys.restaurantId))

      return reply.status(200).send({
        units_and_restaurants: unitsAndRestaurants,
      })
    },
  )
}
