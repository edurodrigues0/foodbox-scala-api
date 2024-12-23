import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../database/connection'
import { unitys } from '../../database/schema'
import { DataAlreadyExistsError } from '../../errors/data-already-existis'

export async function registerUnitys(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/unitys',
    {
      schema: {
        summary: 'Create Unity',
        tags: ['unitys'],
        body: z.object({
          name: z.string(),
          unity: z.number(),
        }),
        response: {
          201: z.object({
            unity_name: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { name, unity } = request.body

        const [unityCreated] = await db
          .insert(unitys)
          .values({
            name,
            unity,
          })
          .returning()

        return reply.status(201).send({ unity_name: unityCreated.id })
      } catch (error) {
        if (error instanceof DataAlreadyExistsError) {
          return reply.status(409).send({ message: error.message })
        }
      }
    },
  )
}
