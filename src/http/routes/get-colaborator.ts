import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { ResourceNotFoundError } from '../../errors/resource-not-found'

export async function getColaborator(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/colaborators/:colaboratorId',
    {
      schema: {
        summary: 'Get Colaborator',
        tags: ['colaborators'],
        params: z.object({
          colaboratorId: z.string().cuid2(),
        }),
        response: {
          200: z.object({
            colaborator: z.object({
              id: z.string().cuid2(),
              name: z.string(),
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
        const { colaboratorId } = request.params

        const colaborator = await db.query.colaborators.findFirst({
          columns: {
            id: true,
            name: true,
          },
          where(fields, { eq }) {
            return eq(fields.id, colaboratorId)
          },
        })

        if (!colaborator) {
          throw new ResourceNotFoundError()
        }

        return reply.status(200).send({ colaborator })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }

        throw error
      }
    },
  )
}
