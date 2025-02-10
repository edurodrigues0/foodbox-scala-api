import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { ResourceNotFoundError } from '../../errors/resource-not-found'

export async function getSector(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/sectors/:sectorId',
    {
      schema: {
        summary: 'Get Sector',
        tags: ['sectors'],
        params: z.object({
          sectorId: z.string().cuid2(),
        }),
        response: {
          200: z.object({
            sector: z.object({
              id: z.string().cuid2(),
              name: z.string(),
              unity: z
                .object({
                  name: z.string(),
                })
                .nullable(),
              supervisor: z
                .object({
                  id: z.string(),
                  name: z.string(),
                  email: z.string(),
                })
                .nullable(),
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
        const { sectorId } = request.params

        const sector = await db.query.sectors.findFirst({
          columns: {
            id: true,
            name: true,
          },
          with: {
            unity: {
              columns: {
                name: true,
              },
            },
            supervisor: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          where(fields, { eq }) {
            return eq(fields.id, sectorId)
          },
        })

        if (!sector) {
          throw new ResourceNotFoundError()
        }

        return reply.status(200).send({ sector })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }

        throw error
      }
    },
  )
}
