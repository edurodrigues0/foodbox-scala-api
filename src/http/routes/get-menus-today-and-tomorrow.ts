import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { ResourceNotFoundError } from '../../errors/resource-not-found'
import { menus, restaurants, unitys } from '../../database/schema'
import { and, eq, gte, lte } from 'drizzle-orm'
import dayjs from 'dayjs'

export async function getMenuTodayAndTomorrow(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/menus/:unitId/today-and-tomorrow',
    {
      schema: {
        summary: 'Get Menus Today and Tomorrow',
        tags: ['menus'],
        params: z.object({
          unitId: z.string().cuid2(),
        }),
        response: {
          200: z.object({
            menus: z.array(
              z.object({
                menu_id: z.string(),
                menu_name: z.string(),
                menu_description: z.array(z.string()),
                menu_allergens: z.string().nullable(),
                service_date: z.date(),
              }),
            ),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { unitId } = request.params

        const startDate = dayjs().startOf('day')
        const endTomorrowDate = dayjs().add(0, 'day').endOf('day')

        const menusTodayAndTomorrow = await db
          .select({
            menu_id: menus.id,
            menu_name: menus.name,
            menu_description: menus.description,
            service_date: menus.serviceDate,
            menu_allergens: menus.allergens,
          })
          .from(menus)
          .innerJoin(unitys, eq(unitys.id, unitId))
          .innerJoin(restaurants, eq(restaurants.id, unitys.restaurantId))
          .where(
            and(
              gte(menus.serviceDate, startDate.toDate()),
              lte(menus.serviceDate, endTomorrowDate.toDate()),
              eq(menus.restaurantId, unitys.restaurantId),
            ),
          )

        return reply.status(200).send({
          menus: menusTodayAndTomorrow,
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
