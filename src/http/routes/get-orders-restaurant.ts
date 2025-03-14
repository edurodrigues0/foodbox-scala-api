import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { ResourceNotFoundError } from '../../errors/resource-not-found'
import { collaborators, orders, sectors, unitys } from '../../database/schema'
import { and, eq, gte, lte, sql } from 'drizzle-orm'
import dayjs from 'dayjs'
import { getCurrentOrders } from '../presenters/get-current-orders-presenters'

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
          //   current_orders: z.array(
          //     z.object({
          //       unit: z.string(),
          //       sector: z.string(),
          //       total_orders: z.number(),
          //     }),
          //   ),
          // }),
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
            sector: sectors.name,
            total_orders: sql<number>`CAST(COUNT(${orders.id}) AS INTEGER)`.as(
              'total_orders',
            ),
          })
          .from(orders)
          .innerJoin(collaborators, eq(orders.colaboratorId, collaborators.id))
          .innerJoin(sectors, eq(collaborators.sectorId, sectors.id))
          .innerJoin(unitys, eq(sectors.unityId, unitys.id))
          .where(
            and(
              gte(orders.orderDate, startDate.toDate()),
              lte(orders.orderDate, endTomorrowDate.toDate()),
              eq(unitys.restaurantId, restaurantId),
            ),
          )
          .groupBy(unitys.name, sectors.name)

        return reply
          .status(200)
          .send({ current_orders: getCurrentOrders(currentOrders) })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }

        throw error
      }
    },
  )
}
