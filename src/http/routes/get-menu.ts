import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { ResourceNotFoundError } from '../../errors/resource-not-found'

export async function getMenu(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/menus/:menuId',
    {
      schema: {
        summary: 'Get Menu',
        tags: ['menus'],
        params: z.object({
          menuId: z.string().cuid2(),
        }),
        response: {
          200: z.object({
            menu: z.object({
              id: z.string().cuid2(),
              name: z.string(),
              description: z.array(z.string()),
              allergens: z.string().nullable(),
              service_date: z.string(),
              created_at: z.string(),
            }),
          }),
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
          columns: {
            id: true,
            name: true,
            description: true,
            allergens: true,
            serviceDate: true,
            createdAt: true,
          },
          where(fields, { eq }) {
            return eq(fields.id, menuId)
          },
        })

        if (!menu) {
          throw new ResourceNotFoundError()
        }

        return reply.status(200).send({
          menu: {
            ...menu,
            service_date: menu.serviceDate.toISOString(),
            created_at: menu.createdAt.toISOString(),
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
