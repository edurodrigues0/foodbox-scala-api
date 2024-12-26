import dayjs from 'dayjs';

import { z } from 'zod';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

import { db } from '../../database/connection';
import { addConnection } from '../../utils/add-connection';
import { removeConnection } from '../../utils/remove-connection';
import { colaborators, orders, sectors, unitys } from '../../database/schema';

export async function restaurantConnection(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/ws/restaurants/:restaurantId',
    {
      websocket: true,
      schema: {
        params: z.object({
          restaurantId: z.string(),
        }),
      },
    },
    async (socket, request) => {
      const { restaurantId } = request.params;
      const startDate = dayjs().startOf('day');
      const endDate = dayjs().endOf('day')

      try {
        const result = await db
          .select({
            sector_name: sectors.name,
            unity: unitys.name,
            orders_count: sql`COUNT(${orders.id})`.as('orders_count'),
          })
          .from(orders)
          .innerJoin(colaborators, eq(orders.colaboratorId, colaborators.id)) 
          .innerJoin(sectors, eq(colaborators.sectorId, sectors.id)) 
          .innerJoin(unitys, eq(sectors.unityId, unitys.id)) 
          .where(
            and(
              gte(
                orders.orderDate,
                startDate.startOf('day')
                  .add(startDate.utcOffset(), 'millisecond')
                  .toDate(),
              ),
              lt(orders.orderDate, endDate.toDate())
            ),
          )
          .groupBy(sectors.name, unitys.name);

          console.log('pedidos do dia:', result)

        
        socket.send(JSON.stringify(result));

        addConnection(restaurantId, socket);

        
        socket.on('close', () => {
          removeConnection(restaurantId, socket);
        });
      } catch (error) {
        console.error('Database Error:', error);
        socket.close(1011, 'Internal Server Error');
      }
    },
  );
}
