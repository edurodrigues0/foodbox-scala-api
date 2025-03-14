import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../database/connection'
import { menus, orders, restaurants } from '../../database/schema'
import { eq } from 'drizzle-orm'
import { restaurantConnections } from '../../utils/connection-manager'
import { ResourceNotFoundError } from '../../errors/resource-not-found'

export async function restaurantConnection(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/ws/restaurants/:restaurantId',
    {
      websocket: true,
      schema: {
        params: z.object({
          restaurantId: z.string().cuid2(),
        }),
      },
    },
    async (socket, request) => {
      const { restaurantId } = request.params

      const restaurant = await db.query.restaurants.findFirst({
        where(fields, { eq }) {
          return eq(fields.id, restaurantId)
        },
      })

      if (!restaurant) {
        throw new ResourceNotFoundError()
      }

      restaurantConnections.set(restaurantId, socket)

      socket.on('message', async (message) => {
        const messageStr = message.toString()
        if (messageStr === 'new_order') {
          const currentOrders = await db
            .select({
              orderId: orders.id,
            })
            .from(orders)
            .innerJoin(menus, eq(orders.menuId, menus.id))
            .innerJoin(restaurants, eq(menus.restaurantId, restaurants.id))
            .where(eq(restaurants.id, restaurantId))

          socket.send(JSON.stringify(currentOrders))
        }
      })

      socket.on('close', () => {
        restaurantConnections.delete(restaurantId)
        console.log('Cliente desconectado com id', restaurantId)
      })
    },
  )
}
