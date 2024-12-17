import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'

export async function getColaborator(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/colaborator/:colaboratorId',
    {
      schema: {
        summary: 'Create Colaborator',
        tags: ['colaborators'],
        params: z.object({
          colaboratorId: z.string().cuid2(),
        }),
      },
    },
    async (request, reply) => {
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
        return reply
          .status(404)
          .send({ message: 'Colaborador não encontrado.' })
      }

      return reply.status(200).send({ colaborator })
    },
  )
}