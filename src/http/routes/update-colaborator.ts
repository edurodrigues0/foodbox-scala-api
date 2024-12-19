import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { eq } from 'drizzle-orm'
import { colaborators } from '../../database/schema'
import { hmacCPF as hmacCPFFn } from '../../utils/hmac-cpf'
import { encryptCPF } from '../../utils/encrypt-cpf'
import { DataAlreadyExistsError } from '../../errors/data-already-existis'

export async function updateColaborator(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    '/colaborators/:colaboratorId',
    {
      schema: {
        summary: 'Update Colaborators',
        tags: ['colaborators'],
        params: z.object({
          colaboratorId: z.string().cuid2(),
        }),
        body: z.object({
          name: z.string().optional(),
          cpf: z.string().optional(),
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
        const { name, cpf } = request.body
        const { colaboratorId } = request.params

        if (cpf) {
          const hmacCPF = hmacCPFFn(cpf)

          const colaboratorWithSameCPF = await db.query.colaborators.findFirst({
            where(fields, { eq }) {
              return eq(fields.hmac_cpf, hmacCPF)
            },
          })

          if (colaboratorWithSameCPF?.id !== colaboratorId) {
            throw new DataAlreadyExistsError()
          }
        }

        await db
          .update(colaborators)
          .set({
            name,
            cpf: cpf ? encryptCPF(cpf) : undefined,
            hmac_cpf: cpf ? hmacCPFFn(cpf) : undefined,
          })
          .where(eq(colaborators.id, colaboratorId))

        return reply.status(204).send()
      } catch (error) {
        if (error instanceof DataAlreadyExistsError) {
          return reply.status(409).send({ message: error.message })
        }
      }
    },
  )
}
