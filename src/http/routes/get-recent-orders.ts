import dayjs from 'dayjs'
import { z } from 'zod'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { db } from '../../database/connection'
import { orders, collaborators, unitys } from '../../database/schema'
import { and, gte, lte, sum, eq, count, ilike } from 'drizzle-orm'
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
          from: z.string().optional(),
          to: z.string().optional(),
          colaboratorName: z.string().optional(),
          unit: z.string().optional(),
          registration: z.coerce.number().optional(),
          cpf: z.string().optional(),
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
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { pageIndex, from, to, colaboratorName, cpf, registration, unit } =
        request.query

      const startDate = from
        ? dayjs(from).startOf('day')
        : dayjs().subtract(2, 'months').date(20).startOf('day')

      const endDate = to
        ? dayjs(to).endOf('day')
        : dayjs().subtract(1, 'month').date(20).endOf('day')

      if (endDate.diff(startDate, 'days') > 31) {
        return reply.status(400).send({
          message: 'You cannot list orders in a larger period than 31 days.',
        })
      }

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
          and(
            ...[
              gte(orders.orderDate, startDate.toDate()),
              lte(orders.orderDate, endDate.toDate()),
              cpf ? ilike(collaborators.cpf, cpf) : undefined,
              colaboratorName
                ? ilike(collaborators.name, colaboratorName)
                : undefined,
              registration
                ? eq(collaborators.registration, registration)
                : undefined,
              unit ? ilike(unitys.name, unit) : undefined,
            ].filter(Boolean),
          ),
        )
        .groupBy(collaborators.id, collaborators.name)

      const [totalCountQuery, recentOrders] = await Promise.all([
        db.select({ count: count() }).from(baseQuery.as('baseQuery')),
        baseQuery.offset(pageIndex * 10).limit(10),
      ])

      console.log(recentOrders)

      const totalOfAllOrders = Number(totalCountQuery[0].count)

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
