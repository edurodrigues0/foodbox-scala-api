import { z } from 'zod'

import { eq } from 'drizzle-orm'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { sectors } from '../../database/schema'
import { ResourceNotFoundError } from '../../errors/resource-not-found'

export async function updateSector(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    '/sectors/:sectorId',
    {
      schema: {
        summary: 'Update Sectors',
        tags: ['sectors'],
        params: z.object({
          sectorId: z.string().cuid2(),
        }),
        body: z.object({
          name: z.string().optional(),
          supervisorEmail: z.string().email().optional(),
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
        const { name, supervisorEmail } = request.body
        const { sectorId } = request.params

        const sector = db.query.sectors.findFirst({
          where(fields, { eq }) {
            return eq(fields.id, sectorId)
          },
        })

        let supervisor

        if (supervisorEmail) {
          supervisor = db.query.users.findFirst({
            where(fields, { and, eq }) {
              return and(
                eq(fields.role, 'supervisor'),
                eq(fields.email, supervisorEmail),
              )
            },
          })
        }

        if (!sector || !supervisor) {
          throw new ResourceNotFoundError()
        }

        await db
          .update(sectors)
          .set({
            name: name?.toLocaleLowerCase(),
          })
          .where(eq(sectors.id, sectorId))

        return reply.status(204).send()
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({
            message: error.message,
          })
        }
      }
    },
  )
}
