import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../database/connection'
import { ResourceNotFoundError } from '../../errors/resource-not-found'
import dayjs from 'dayjs'

export async function getOrdersForCurrentBillingCycle(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/current-orders/:cpf',
    {
      schema: {
        summary: 'Get Current Orders',
        tags: ['orders'],
        params: z.object({
          cpf: z.string(),
        }),
        response: {
          200: z.object({
            spent_in_cents: z.number(),
            total: z.number(),
          }),
          404: z.object({
            message: z.string(),
          }),
          500: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { cpf } = request.params

        const today = dayjs()
        const currentDay = today.date()
        const currentMonth = today.month()
        const currentYear = today.year()

        let startDate

        if (currentDay >= 20) {
          startDate = dayjs(`${currentYear}-${currentMonth + 1}-20`)
        } else {
          const lastMonth = today.subtract(1, 'month')
          startDate = dayjs(`${lastMonth.year()}-${lastMonth.month() + 1}-20`)
        }

        const endDate = today

        const colaborator = await db.query.collaborators.findFirst({
          columns: {
            id: true,
            name: true,
          },
          where(fields, { eq }) {
            return eq(fields.cpf, cpf)
          },
        })

        if (!colaborator) {
          throw new ResourceNotFoundError()
        }

        const orders = await db.query.orders.findMany({
          columns: {
            id: true,
            price: true,
          },
          where(fields, { eq, and, gte, lte }) {
            return and(
              eq(fields.colaboratorId, colaborator.id),
              gte(fields.orderDate, startDate.toDate()),
              lte(fields.orderDate, endDate.toDate()),
            )
          },
        })

        const spent = orders.reduce((acc, cur) => {
          acc = acc + cur.price

          return acc
        }, 0)

        return reply.status(200).send({
          spent_in_cents: spent,
          total: orders.length,
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
