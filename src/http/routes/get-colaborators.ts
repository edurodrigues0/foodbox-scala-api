import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { and, count, desc, ilike } from 'drizzle-orm'
import { colaborators } from '../../database/schema'

export async function getColaborators(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/colaborators',
    {
      schema: {
        summary: 'Get Colaborators',
        tags: ['colaborators'],
        querystring: z.object({
          pageIndex: z.coerce.number().default(0),
          colaboratorName: z.string().optional(),
        }),
      },
    },
    async (request, reply) => {
      const { pageIndex, colaboratorName } = request.query

      const baseQuery = db
        .select({
          id: colaborators.id,
          name: colaborators.name,
        })
        .from(colaborators)
        .where(
          and(
            colaboratorName
              ? ilike(colaborators.name, `%${colaboratorName}%`)
              : undefined,
          ),
        )

      const [amountOfColaboratorsQuery, allColaborators] = await Promise.all([
        db.select({ count: count() }).from(baseQuery.as('baseQuery')),
        db
          .select()
          .from(baseQuery.as('baseQuery'))
          .offset(pageIndex * 10)
          .limit(10)
          .orderBy((fields) => {
            return [desc(fields.name)]
          }),
      ])

      const amountOfColaborators = amountOfColaboratorsQuery[0].count

      return reply.status(200).send({
        colaborators: allColaborators,
        meta: {
          page_index: pageIndex,
          per_page: 10,
          total_count: amountOfColaborators,
        },
      })
    },
  )
}
