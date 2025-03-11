import { z } from 'zod'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { and, count, eq, ilike } from 'drizzle-orm'
import { colaborators, sectors, unitys } from '../../database/schema'
import { ResourceNotFoundError } from '../../errors/resource-not-found'

export async function getColaboratorsBySector(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/colaborators/sector',
    {
      schema: {
        summary: 'Get Colaborators',
        tags: ['colaborators'],
        querystring: z.object({
          pageIndex: z.coerce.number().default(0),
          name: z.string().optional(),
          registration: z.coerce.number().optional(),
        }),
        response: {
          200: z.object({
            colaborators: z.array(
              z.object({
                colaborator_id: z.string().cuid2(),
                colaborator_name: z.string(),
                colaborator_registration: z.number(),
                sector_name: z.string().optional(),
                unit_name: z.string().optional(),
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
      await request.jwtVerify({ onlyCookie: true })
      const { sub } = request.user

      const { pageIndex, name, registration } = request.query

      const sector = await db.query.sectors.findFirst({
        where(fields, { eq }) {
          return eq(fields.userId, sub)
        },
      })

      if (!sector) {
        throw new ResourceNotFoundError()
      }

      const baseQuery = db
        .select({
          colaborator_id: colaborators.id,
          colaborator_name: colaborators.name,
          colaborator_registration: colaborators.registration,
          sector_name: sectors.name,
          unit_name: unitys.name,
        })
        .from(colaborators)
        .innerJoin(sectors, eq(sectors.id, colaborators.sectorId))
        .innerJoin(unitys, eq(unitys.id, sectors.unityId))
        .where(
          and(
            eq(sectors.id, sector.id),
            name ? ilike(colaborators.name, `%${name}%`) : undefined,
            registration
              ? eq(colaborators.registration, registration)
              : undefined,
          ),
        )
        .orderBy(unitys.name, sectors.name, colaborators.name)
        .limit(10)
        .offset(pageIndex * 10)

      const [amountOfColaboratorsQuery, allColaborators] = await Promise.all([
        db
          .select({ count: count() })
          .from(colaborators)
          .innerJoin(sectors, eq(sectors.id, colaborators.sectorId))
          .innerJoin(unitys, eq(unitys.id, sectors.unityId))
          .where(
            and(
              eq(sectors.id, sector.id),
              name ? ilike(colaborators.name, `%${name}%`) : undefined,
              registration
                ? eq(colaborators.registration, registration)
                : undefined,
            ),
          ),
        baseQuery,
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
