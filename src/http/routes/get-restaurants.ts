import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { count, ilike } from 'drizzle-orm'
import { restaurants } from '../../database/schema'
import { getRestaurantsPresenters } from '../presenters/get-restaurants-presenters'

export async function getRestaurants(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/restaurants',
    {
      schema: {
        summary: 'Get Restaurants',
        tags: ['restaurants'],
        querystring: z.object({
          pageIndex: z.coerce.number().default(0),
          restaurantName: z.string().optional(),
        }),
        response: {
          200: z.object({
            restaurants: z.array(
              z.object({
                id: z.string().cuid2(),
                name: z.string(),
                manager_name: z.string().nullable(),
                units: z.array(z.string()),
              }),
            ),
            meta: z.object({
              page_index: z.number(),
              per_page: z.number(),
              total_count: z.number(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { pageIndex, restaurantName } = request.query

      const [totalCountQuery, allRestaurants] = await Promise.all([
        db
          .select({ count: count() })
          .from(restaurants)
          .where(
            restaurantName
              ? ilike(restaurants.name, `%${restaurantName}%`)
              : undefined,
          ),
        db.query.restaurants.findMany({
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
            units: {
              columns: {
                name: true,
              },
            },
          },
          orderBy: restaurants.name,
          limit: 10,
          offset: pageIndex * 10,
        }),
      ])

      const amountOfRestaurants = totalCountQuery[0].count

      return reply.status(200).send({
        restaurants: getRestaurantsPresenters(allRestaurants),
        meta: {
          page_index: pageIndex,
          per_page: 10,
          total_count: amountOfRestaurants,
        },
      })
    },
  )
}
