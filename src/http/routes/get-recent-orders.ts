import dayjs from 'dayjs'
import { z } from 'zod'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { db } from '../../database/connection'
import { orders, collaborators } from '../../database/schema'
import { and, gte, lte, sum, eq, count } from 'drizzle-orm'
import { getRecentOrdersPresenters } from '../presenters/get-recent-orders-presenters'

export async function getRecentOrders(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/orders/recent',
    {
      schema: {
        summary: 'Get Recent Orders',
        tags: ['orders'],
        querystring: z.object({
          pageIndex: z.coerce.number().default(0),
          referenceMonth: z.string().optional(),
        }),
        response: {
          200: z.object({
            orders: z.array(
              z.object({
                id: z.string().cuid2().nullable(),
                cpf: z.string().nullable(),
                registration: z.number().nullable(),
                colaborator: z.string().nullable(),
                total_spent_in_cents: z.number().nullable(),
                total_orders: z.number().nullable(),
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
      const { referenceMonth, pageIndex } = request.query

      const today = dayjs(referenceMonth).endOf('day').toDate()
      const lastMonth = dayjs()
        .subtract(1, 'month')
        .date(20)
        .startOf('day')
        .toDate()

      const baseQuery = db
        .select({
          id: collaborators.id,
          name: collaborators.name,
          cpf: collaborators.cpf,
          registration: collaborators.registration,
          totalSpent: sum(orders.price).as('totalSpent'),
          totalOrders: count(orders.id).as('totalOrders'),
        })
        .from(orders)
        .leftJoin(collaborators, eq(orders.colaboratorId, collaborators.id))
        .where(
          and(gte(orders.orderDate, lastMonth), lte(orders.orderDate, today)),
        )
        .groupBy(collaborators.id, collaborators.name)

      const [totalCountQuery, recentOrders] = await Promise.all([
        db.select({ count: count() }).from(baseQuery.as('baseQuery')),
        baseQuery.offset(pageIndex * 10).limit(10),
      ])

      const totalOfAllOrders = totalCountQuery[0].count

      return reply.status(200).send({
        orders: getRecentOrdersPresenters(recentOrders),
        meta: {
          page_index: pageIndex,
          per_page: 10,
          total_count: totalOfAllOrders,
        },
      })
    },
  )
}
