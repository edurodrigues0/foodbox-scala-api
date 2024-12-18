import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { and, count, desc, ilike } from 'drizzle-orm'
import { restaurants } from '../../database/schema'

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
        // response: {
        //   200: z.object({
        //     restaurants: z.array(
        //       z.object({
        //         id: z.string().cuid2(),
        //         name: z.string(),
        //       }),
        //     ),
        //     meta: z.object({
        //       page_index: z.number(),
        //       per_page: z.number(),
        //       total_count: z.number(),
        //     }),
        //   }),
        // },
      },
    },
    async (request, reply) => {
      const { pageIndex, restaurantName } = request.query

      const baseQuery = db
        .select({
          id: restaurants.id,
          name: restaurants.name,
          created_at: restaurants.createdAt,
        })
        .from(restaurants)
        .where(
          and(
            restaurantName
              ? ilike(restaurants.name, `%${restaurantName}%`)
              : undefined,
          ),
        )

      const [amountOfRestaurantsQuery, allRestaurants] = await Promise.all([
        db.select({ count: count() }).from(baseQuery.as('baseQuery')),
        db
          .select()
          .from(baseQuery.as('baseQuery'))
          .offset(pageIndex * 10)
          .limit(10)
          .orderBy((fields) => {
            return [desc(fields.name)]
          }),
      ])

      const amountOfRestaurants = amountOfRestaurantsQuery[0].count

      return reply.status(200).send({
        restaurants: allRestaurants,
        meta: {
          page_index: pageIndex,
          per_page: 10,
          total_count: amountOfRestaurants,
        },
      })
    },
  )
}
