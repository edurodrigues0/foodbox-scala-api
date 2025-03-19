import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { db } from '../../database/connection'
import { orders } from '../../database/schema'
import { ResourceNotFoundError } from '../../errors/resource-not-found'
import { z } from 'zod'
import dayjs from 'dayjs'
import { DataAlreadyExistsError } from '../../errors/data-already-existis'

export async function createOrders(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/orders',
    {
      schema: {
        summary: 'Create Order',
        tags: ['orders'],
        body: z.object({
          cpf: z.string(),
          restaurantId: z.string().cuid2(),
          menuId: z.string().cuid2(),
          orderDate: z.string(),
        }),
        response: {
          201: z.object({
            name: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { cpf, orderDate, menuId } = request.body

      try {
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

        const order = await db.query.orders.findFirst({
          where(fields, { eq, and }) {
            return and(
              eq(fields.colaboratorId, colaborator.id),
              eq(fields.orderDate, new Date(orderDate)),
            )
          },
        })

        if (order) {
          if (dayjs(order.orderDate).isSame(dayjs(orderDate))) {
            throw new DataAlreadyExistsError()
          }
        }

        await db
          .insert(orders)
          .values({
            colaboratorId: colaborator.id,
            price: 215,
            orderDate: new Date(orderDate),
            menuId,
          })
          .returning()

        return reply.status(201).send({
          name: colaborator.name,
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({
            message: error.message,
          })
        }

        throw error
      }
    },
  )
}
