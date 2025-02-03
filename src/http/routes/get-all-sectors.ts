import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { and, asc, count, eq, ilike } from 'drizzle-orm'
import { sectors, unitys } from '../../database/schema'
import { z } from 'zod'

export async function getAllSectors(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/sectors',
    {
      schema: {
        summary: 'Get Sectors',
        tags: ['sectors'],
        querystring: z.object({
          pageIndex: z.coerce.number().default(0),
          sectorName: z.string().optional(),
          unitName: z.string().optional(),
        }),
        response: {
          200: z.object({
            sectors: z.array(
              z.object({
                id: z.string().cuid2(),
                unit_name: z.string(),
                sector_name: z.string(),
              }),
            ),
            meta: z.object({
              page_index: z.number(),
              per_page: z.number(),
              total_count: z.number(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { pageIndex, sectorName, unitName } = request.query

      const baseQuery = db
        .select({
          id: sectors.id,
          sector_name: sectors.name,
          unit_name: unitys.name,
        })
        .from(sectors)
        .where(
          and(
            sectorName ? ilike(sectors.name, `%${sectorName}%`) : undefined,
            unitName ? ilike(unitys.name, `%${unitName}`) : undefined,
          ),
        )
        .innerJoin(unitys, eq(unitys.id, sectors.unityId))
        .orderBy(asc(unitys.name), asc(sectors.name))

      const [amountOfAllSectorsQuery, allSectors] = await Promise.all([
        db.select({ count: count() }).from(baseQuery.as('baseQuery')),
        baseQuery.offset(pageIndex * 10).limit(10),
      ])

      const amountOfAllSectors = amountOfAllSectorsQuery[0].count

      return reply.status(200).send({
        sectors: allSectors,
        meta: {
          page_index: pageIndex,
          per_page: 10,
          total_count: amountOfAllSectors,
        },
      })
    },
  )
}
