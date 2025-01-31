import { z } from 'zod'

import { eq } from 'drizzle-orm'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { unitys } from '../../database/schema'
import { ResourceNotFoundError } from '../../errors/resource-not-found'

export async function updateUnit(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    '/units/:unitId',
    {
      schema: {
        summary: 'Update Units',
        tags: ['units'],
        params: z.object({
          unitId: z.string().cuid2(),
        }),
        body: z.object({
          name: z.string().optional(),
          unity: z.coerce.number().optional(),
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
        const { name, unity } = request.body
        const { unitId } = request.params

        const unit = db.query.unitys.findFirst({
          where(fields, { eq }) {
            return eq(fields.id, unitId)
          },
        })

        if (!unit) {
          throw new ResourceNotFoundError()
        }

        await db
          .update(unitys)
          .set({
            name,
            unity,
          })
          .where(eq(unitys.id, unitId))

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
