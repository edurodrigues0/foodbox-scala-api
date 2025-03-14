import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { eq } from 'drizzle-orm'
import { collaborators } from '../../database/schema'
import { DataAlreadyExistsError } from '../../errors/data-already-existis'

export async function updateColaborator(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    '/collaborators/:colaboratorId',
    {
      schema: {
        summary: 'Update Collaborators',
        tags: ['collaborators'],
        params: z.object({
          colaboratorId: z.string().cuid2(),
        }),
        body: z.object({
          registration: z.number().optional(),
          name: z.string().optional(),
          cpf: z.string().optional(),
          sectorId: z.string().cuid2().optional(),
        }),
        response: {
          204: z.null(),
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { name, cpf, registration, sectorId } = request.body
        const { colaboratorId } = request.params

        await db
          .update(collaborators)
          .set({
            name,
            cpf,
            sectorId,
            registration,
          })
          .where(eq(collaborators.id, colaboratorId))

        return reply.status(204).send()
      } catch (error) {
        if (error instanceof DataAlreadyExistsError) {
          return reply.status(409).send({ message: error.message })
        }
      }
    },
  )
}
