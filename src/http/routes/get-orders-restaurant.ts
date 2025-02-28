import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { ResourceNotFoundError } from '../../errors/resource-not-found'
import { colaborators, orders, sectors, unitys } from '../../database/schema'
import { and, eq, gte, lte, sql } from 'drizzle-orm'
import dayjs from 'dayjs'

export async function getOrdersRestaurant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/orders/:restaurantId',
    {
      schema: {
        summary: 'Get Orders Restaurant',
        tags: ['orders'],
        params: z.object({
          restaurantId: z.string().cuid2(),
        }),
        response: {
          // 200: z.object({
          //   user: z.object({
          //     id: z.string().cuid2(),
          //     email: z.string().email(),
          //     name: z.string(),
          //   }),
          // }),
          // 404: z.object({
          //   message: z.string(),
          // }),
        },
      },
    },
    async (request, reply) => {
      try {
        // await request.jwtVerify({ onlyCookie: true })

        const { restaurantId } = request.params
        const startDate = dayjs().startOf('day')
        const endTomorrowDate = dayjs().add(1, 'days').endOf('day')

        const restaurant = await db.query.restaurants.findFirst({
          where(fields, { eq }) {
            return eq(fields.id, restaurantId)
          },
        })

        if (!restaurant) {
          throw new ResourceNotFoundError()
        }
        const currentOrders = await db
          .select({
            unit: unitys.name,
            sectorId: sectors.id,
            sectorName: sectors.name,
            totalOrders: sql`COUNT(${orders.id})`.as('totalOrders'),
          })
          .from(orders)
          .innerJoin(colaborators, eq(orders.colaboratorId, colaborators.id))
          .innerJoin(sectors, eq(colaborators.sectorId, sectors.id))
          .innerJoin(unitys, eq(sectors.unityId, unitys.id))
          .where(
            and(
              gte(orders.orderDate, startDate.toDate()),
              lte(orders.orderDate, endTomorrowDate.toDate()),
              eq(unitys.restaurantId, restaurantId),
            ),
          )
          .groupBy(sectors.id, unitys.name, sectors.name)

        return reply.status(200).send({ currentOrders })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }

        throw error
      }
    },
  )
}
