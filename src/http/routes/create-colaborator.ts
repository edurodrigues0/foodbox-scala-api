import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { colaborators } from '../../database/schema'
import { hmacCPF as hmacCPFFn } from '../../utils/hmac-cpf'
import { encryptCPF } from '../../utils/encrypt-cpf'

export async function createColaborator(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/colaborators',
    {
      schema: {
        summary: 'Create Colaborator',
        tags: ['colaborators'],
        body: z.object({
          name: z.string().min(3).max(100),
          // registration: z.number(),
          cpf: z.string(),
        }),
      },
    },
    async (request, reply) => {
      const { name, cpf } = request.body

      const hmacCPF = hmacCPFFn(cpf)
      const hashedCPF = encryptCPF(cpf)

      const colaboratorAlreadyExist = await db.query.colaborators.findFirst({
        where(fields, { eq }) {
          return eq(fields.hmac_cpf, hmacCPF)
        },
      })

      if (colaboratorAlreadyExist) {
        return reply.status(400).send({ message: 'Colaborador já existe.' })
      }

      const [colaborator] = await db
        .insert(colaborators)
        .values({
          name,
          cpf: hashedCPF,
          hmac_cpf: hmacCPF,
        })
        .returning({
          name: colaborators.name,
        })

      return reply.status(201).send({ colaborator_name: colaborator.name })
    },
  )
}
