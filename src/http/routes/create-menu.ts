import dayjs from 'dayjs'

import { z } from 'zod'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { menus } from '../../database/schema'
import { DataAlreadyExistsError } from '../../errors/data-already-existis'
import { UnauthorizedError } from '../../errors/unauthorized'
import { ResourceNotFoundError } from '../../errors/resource-not-found'

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
          allergens: z.string().optional(),
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
      await request.jwtVerify({ onlyCookie: true })
      try {
        const { role, sub } = request.user

        if (role === 'restaurant') {
          const { name, description, serviceDate, allergens } = request.body
          const serviceDateFormated = dayjs(serviceDate)

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

          const menuWithSameDayInMonth = await db.query.menus.findFirst({
            where(fields, { gte }) {
              return gte(fields.serviceDate, serviceDateFormated.toDate())
            },
          })

          if (menuWithSameDayInMonth) {
            throw new DataAlreadyExistsError()
          }

          const [menu] = await db
            .insert(menus)
            .values({
              name,
              description,
              serviceDate: serviceDateFormated.toDate(),
              allergens,
              restaurantId: restaurant.id,
            })
            .returning()

          return reply.status(201).send({ menu_name: menu.name })
        } else {
          throw new UnauthorizedError()
        }
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({ message: error.message })
        }

        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }

        if (error instanceof DataAlreadyExistsError) {
          return reply.status(409).send({ message: error.message })
        }

        throw error
      }
    },
  )
}
