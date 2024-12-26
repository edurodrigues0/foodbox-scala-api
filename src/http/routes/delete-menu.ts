import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { ResourceNotFoundError } from '../../errors/resource-not-found'
import { menus } from '../../database/schema'
import { eq } from 'drizzle-orm'
import dayjs from 'dayjs'
import { UnauthorizedError } from '../../errors/unauthorized'

export async function deleteMenu(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    '/menus/:menuId',
    {
      schema: {
        summary: 'Delete Menu',
        tags: ['menus'],
        params: z.object({
          menuId: z.string().cuid2(),
        }),
        response: {
          200: z.null(),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { menuId } = request.params

        const menu = await db.query.menus.findFirst({
          where(fields, { eq }) {
            return eq(fields.id, menuId)
          },
        })

        if (!menu) {
          throw new ResourceNotFoundError()
        }

        const currentDate = new Date()
        const deleteLimitTime = dayjs(menu.serviceDate).diff(
          currentDate,
          'day',
          true,
        )

        if (deleteLimitTime >= 2) {
          await db.delete(menus).where(eq(menus.id, menuId))
        } else {
          throw new UnauthorizedError()
        }

        return reply.status(200).send()
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }

        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({
            message: error.message,
          })
        }

        throw error
      }
    },
  )
}
