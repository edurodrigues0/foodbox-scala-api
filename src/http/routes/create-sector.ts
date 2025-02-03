import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { db } from '../../database/connection'
import { sectors } from '../../database/schema'
import { z } from 'zod'
import { DataAlreadyExistsError } from '../../errors/data-already-existis'
import { and, eq } from 'drizzle-orm'

export async function createSector(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sectors',
    {
      schema: {
        summary: 'Create Sector',
        tags: ['sectors'],
        body: z.object({
          name: z.string(),
          unitId: z.string().cuid2(),
        }),
        response: {
          201: z.object({
            sector_name: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, unitId } = request.body

      try {
        const sectorWithSameName = await db.query.sectors.findFirst({
          where(fields, { like }) {
            return and(
              like(fields.name, name.toLowerCase()),
              eq(fields.unityId, unitId),
            )
          },
        })

        if (sectorWithSameName && sectorWithSameName.unityId === unitId) {
          throw new DataAlreadyExistsError()
        }

        const [sector] = await db
          .insert(sectors)
          .values({
            name,
            unityId: unitId,
          })
          .returning()

        return reply.status(201).send({
          sector_name: sector.name,
        })
      } catch (error) {
        if (error instanceof DataAlreadyExistsError) {
          return reply.status(409).send({
            message: error.message,
          })
        }

        throw error
      }
    },
  )
}
