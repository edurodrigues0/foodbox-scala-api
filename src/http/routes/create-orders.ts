import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { db } from '../../database/connection'
import { menus, orders, restaurants } from '../../database/schema'
import { ResourceNotFoundError } from '../../errors/resource-not-found'
import { z } from 'zod'
import { restaurantConnections } from '../../utils/connection-manager'
import { eq } from 'drizzle-orm'

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
      const { cpf, restaurantId, orderDate, menuId } = request.body

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

        await db
          .insert(orders)
          .values({
            colaboratorId: colaborator.id,
            price: 215,
            orderDate: new Date(orderDate),
            menuId,
          })
          .returning()

        if (restaurantConnections.has(restaurantId)) {
          const currentOrders = await db
            .select({
              orderId: orders.id,
            })
            .from(orders)
            .innerJoin(menus, eq(orders.menuId, menus.id))
            .innerJoin(restaurants, eq(menus.restaurantId, restaurants.id))
            .where(eq(restaurants.id, restaurantId))

          restaurantConnections
            .get(restaurantId)
            ?.send(JSON.stringify(currentOrders))
        }

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
