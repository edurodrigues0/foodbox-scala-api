import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { ResourceNotFoundError } from '../../errors/resource-not-found'
import { colaborators, sectors, unitys } from '../../database/schema'
import { eq } from 'drizzle-orm'

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
              colaborator_id: z.string().cuid2(),
              colaborator_name: z.string(),
              colaborator_cpf: z.string(),
              colaborator_registration: z.number(),
              sector_name: z.string(),
              unit_name: z.string(),
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

        await db.query.colaborators.findFirst({})

        const colaborator = await db
          .select({
            colaborator_id: colaborators.id,
            colaborator_name: colaborators.name,
            colaborator_registration: colaborators.registration,
            colaborator_cpf: colaborators.cpf,
            sector_name: sectors.name,
            unit_name: unitys.name,
          })
          .from(colaborators)
          .innerJoin(sectors, eq(sectors.id, colaborators.sectorId))
          .innerJoin(unitys, eq(unitys.id, sectors.unityId))
          .where(eq(colaborators.id, colaboratorId))
          .limit(1)
          .then((res) => res[0])

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
