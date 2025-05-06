import dayjs from 'dayjs'

import { z } from 'zod'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { menus } from '../../database/schema'
import { DataAlreadyExistsError } from '../../errors/data-already-existis'
import { UnauthorizedError } from '../../errors/unauthorized'
import { ResourceNotFoundError } from '../../errors/resource-not-found'
import { ForbiddenError } from '../../errors/forbidden'

export async function createMenu(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/menus',
    {
      schema: {
        summary: 'Create menu',
        tags: ['menus'],
        body: z.object({
          name: z.string(),
          serviceDate: z.string(),
          description: z.array(z.string()),
          allergens: z.string().nullish(),
        }),
        response: {
          201: z.object({
            menu_name: z.string(),
          }),
          401: z.object({
            message: z.string(),
          }),
          404: z.object({
            message: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      await request.jwtVerify()

      try {
        const { role, sub } = request.user

        if (role !== 'restaurant') {
          throw new ForbiddenError()
        }

        const { name, description, serviceDate, allergens } = request.body
        const serviceDateFormatted = dayjs(serviceDate).startOf('day')

        const restaurant = await db.query.restaurants.findFirst({
          columns: {
            id: true,
          },
          where(fields, { eq }) {
            return eq(fields.managerId, sub)
          },
        })

        if (!restaurant) {
          throw new ResourceNotFoundError()
        }

        const menuWithSameDate = await db.query.menus.findFirst({
          where(fields, { and, eq }) {
            return and(
              eq(fields.restaurantId, restaurant.id),
              eq(fields.serviceDate, serviceDateFormatted.toDate()),
            )
          },
        })

        if (menuWithSameDate) {
          throw new DataAlreadyExistsError()
        }

        const [menu] = await db
          .insert(menus)
          .values({
            name,
            description,
            serviceDate: serviceDateFormatted.toDate(),
            allergens,
            restaurantId: restaurant.id,
          })
          .returning()

        return reply.status(201).send({ menu_name: menu.name })
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({ message: error.message })
        }

        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message })
        }

        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }

        if (error instanceof DataAlreadyExistsError) {
          return reply.status(409).send({ message: error.message })
        }

        console.log('Unhandled error on POST /menus:', error)
        return reply.status(500).send({ message: 'Internal server error' })
      }
    },
  )
}
