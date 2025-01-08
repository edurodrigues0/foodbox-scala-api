import { z } from 'zod'

import { eq } from 'drizzle-orm'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { menus } from '../../database/schema'
import { ResourceNotFoundError } from '../../errors/resource-not-found'
import { DataAlreadyExistsError } from '../../errors/data-already-existis'

export async function updateMenu(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    '/menus/:menuId',
    {
      schema: {
        summary: 'Update Menu',
        tags: ['menus'],
        params: z.object({
          menuId: z.string().cuid2(),
        }),
        body: z.object({
          name: z.string().optional(),
          description: z.array(z.string()).optional(),
          allergens: z.string().optional(),
          serviceDate: z.string().optional(),
        }),
        response: {
          204: z.null(),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { name, description, serviceDate, allergens } = request.body
        const { menuId } = request.params

        const menu = db.query.menus.findFirst({
          where(fields, { eq }) {
            return eq(fields.id, menuId)
          },
        })

        if (!menu) {
          throw new ResourceNotFoundError()
        }

        const serviceDateFormatted = serviceDate
          ? new Date(serviceDate)
          : undefined

        if (serviceDateFormatted) {
          const menuWithSameDayInMonth = await db.query.menus.findFirst({
            where(fields, { gte }) {
              return gte(fields.serviceDate, serviceDateFormatted)
            },
          })

          if (menuWithSameDayInMonth?.id !== menuId) {
            throw new DataAlreadyExistsError()
          }
        }

        await db
          .update(menus)
          .set({
            name,
            description,
            allergens,
            serviceDate: serviceDateFormatted,
          })
          .where(eq(menus.id, menuId))

        return reply.status(204).send()
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({
            message: error.message,
          })
        }

        if (error instanceof DataAlreadyExistsError) {
          return reply.status(409).send({
            message: error.message,
          })
        }

        throw error
      }
    },
  )
}
