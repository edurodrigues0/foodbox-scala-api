import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../database/connection'
import { unitys } from '../../database/schema'
import { DataAlreadyExistsError } from '../../errors/data-already-existis'

export async function createUnit(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/units',
    {
      schema: {
        summary: 'Create Unit',
        tags: ['units'],
        body: z.object({
          name: z.string(),
          unity: z.coerce.number(),
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

        const unitWithSameCode = await db.query.unitys.findFirst({
          columns: {
            unity: true,
          },
          where(fields, { eq }) {
            return eq(fields.unity, unity)
          },
        })

        if (unitWithSameCode) {
          throw new DataAlreadyExistsError()
        }

        const [unityCreated] = await db
          .insert(unitys)
          .values({
            name,
            unity,
          })
          .returning()

        return reply.status(201).send({ unity_name: unityCreated.name })
      } catch (error) {
        if (error instanceof DataAlreadyExistsError) {
          return reply.status(409).send({ message: error.message })
        }
      }
    },
  )
}
