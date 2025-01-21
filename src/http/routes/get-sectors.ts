import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { desc, eq } from 'drizzle-orm'
import { sectors } from '../../database/schema'

export async function getSectors(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/sectors/:unitId',
    {
      schema: {
        summary: 'Get Sectors',
        tags: ['sectors'],
        params: z.object({
          unitId: z.string().cuid2(),
        }),
        // response: {
        //   200: z.object({
        //     restaurants: z.array(
        //       z.object({
        //         id: z.string().cuid2(),
        //         name: z.string(),
        //       }),
        //     ),
        //     meta: z.object({
        //       page_index: z.number(),
        //       per_page: z.number(),
        //       total_count: z.number(),
        //     }),
        //   }),
        // },
      },
    },
    async (request, reply) => {
      const { unitId } = request.params

      const baseQuery = db
        .select({
          id: sectors.id,
          name: sectors.name,
        })
        .from(sectors)
        .where(eq(sectors.unityId, unitId))

      const [allSectors] = await Promise.all([
        db
          .select()
          .from(baseQuery.as('baseQuery'))
          .orderBy((fields) => {
            return [desc(fields.name)]
          }),
      ])

      return reply.status(200).send({
        sectors: allSectors,
      })
    },
  )
}
