import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { and, count, eq, gte, lte, sql } from 'drizzle-orm'
import { colaborators, orders, sectors, unitys } from '../../database/schema'
import { ResourceNotFoundError } from '../../errors/resource-not-found'
import dayjs from 'dayjs'

export async function getColaboratorsOrderSummary(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/colaborators/orders/summary',
    {
      schema: {
        summary: 'Get Colaborators Orders Summary',
        tags: ['colaborators', 'orders', 'summary'],
        querystring: z.object({
          pageIndex: z.coerce.number().default(0),
          from: z.coerce.date().optional(),
          to: z.coerce.date().optional(),
        }),
        response: {
          // 200: z.object({
          //   colaborators: z.array(
          //     z.object({
          //       id: z.string().cuid2(),
          //       name: z.string(),
          //     }),
          //   ),
          //   meta: z.object({
          //     page_index: z.number(),
          //     per_page: z.number(),
          //     total_count: z.number(),
          //   }),
          // }),
        },
      },
    },
    async (request, reply) => {
      const { pageIndex, from, to } = request.query

      try {
        const startDate = from ? dayjs(from) : dayjs().subtract(30, 'days')
        const endDate = to
          ? dayjs(to)
          : from
            ? startDate.add(30, 'days')
            : dayjs()

        if (endDate.diff(startDate, 'days') > 30) {
          throw new Error()
        }

        const baseQuery = db
          .select({
            colaborator_id: colaborators.id,
            colaborator_name: colaborators.name,
            colaborator_unit: unitys.unity,
            total_spent: sql`SUM(orders.price)`.as('total_spent'),
          })
          .from(orders)
          .innerJoin(colaborators, eq(colaborators.id, orders.colaboratorId))
          .innerJoin(sectors, eq(sectors.id, colaborators.sectorId))
          .innerJoin(unitys, eq(unitys.id, sectors.unityId))
          .where(
            and(
              gte(orders.orderDate, startDate.toDate()),
              lte(orders.orderDate, endDate.toDate()),
            ),
          )
          .groupBy(colaborators.id, colaborators.name, unitys.unity)

        const [amountOfColaboratorsRevenueQuery, colaboratorsSpent] =
          await Promise.all([
            await db.select({ count: count() }).from(baseQuery.as('baseQuery')),
            db
              .select()
              .from(baseQuery.as('baseQuery'))
              .offset(pageIndex * 10)
              .limit(10),
          ])

        const amountOfColaboratorsRevenue =
          amountOfColaboratorsRevenueQuery[0].count

        return reply.status(200).send({
          colaborators_spent: colaboratorsSpent,
          meta: {
            page_index: pageIndex,
            per_page: 10,
            total_count: amountOfColaboratorsRevenue,
          },
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    },
  )
}
