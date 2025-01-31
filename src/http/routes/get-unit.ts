import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { z } from 'zod'
import { ResourceNotFoundError } from '../../errors/resource-not-found'

export async function getUnit(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/units/:unitId',
    {
      schema: {
        summary: 'Get Units',
        tags: ['units'],
        params: z.object({
          unitId: z.string().cuid2(),
        }),
        response: {
          200: z.object({
            unit: z.object({
              id: z.string().cuid2(),
              name: z.string(),
              unity: z.number().nullish(),
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
        const { unitId } = request.params

        const unit = await db.query.unitys.findFirst({
          columns: {
            id: true,
            name: true,
            unity: true,
          },
          where(fields, { eq }) {
            return eq(fields.id, unitId)
          },
        })

        if (!unit) {
          throw new ResourceNotFoundError()
        }

        return reply.status(200).send({
          unit,
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({
            message: 'Unit not found.',
          })
        }
      }
    },
  )
}
