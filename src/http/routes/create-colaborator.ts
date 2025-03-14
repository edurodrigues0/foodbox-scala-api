import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { collaborators } from '../../database/schema'
import { DataAlreadyExistsError } from '../../errors/data-already-existis'

export async function createColaborator(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/collaborators',
    {
      schema: {
        summary: 'Create Colaborator',
        tags: ['collaborators'],
        body: z.object({
          name: z.string().min(3).max(100),
          registration: z.number(),
          cpf: z.string(),
          sectorId: z.string().cuid2(),
        }),
        response: {
          201: z.object({
            colaborator_name: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { name, cpf, registration, sectorId } = request.body

        const colaboratorAlreadyExist = await db.query.collaborators.findFirst({
          where(fields, { eq }) {
            return eq(fields.cpf, cpf)
          },
        })

        if (colaboratorAlreadyExist) {
          throw new DataAlreadyExistsError()
        }

        const [colaborator] = await db
          .insert(collaborators)
          .values({
            name,
            cpf,
            sectorId,
            registration,
          })
          .returning({
            name: collaborators.name,
          })

        return reply.status(201).send({ colaborator_name: colaborator.name })
      } catch (error) {
        if (error instanceof DataAlreadyExistsError) {
          return reply.status(409).send({ message: error.message })
        }

        throw error
      }
    },
  )
}
