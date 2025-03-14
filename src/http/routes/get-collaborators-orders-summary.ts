import dayjs from 'dayjs'
import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { and, count, eq, gte, ilike, lte, sql } from 'drizzle-orm'
import { collaborators, orders, sectors, unitys } from '../../database/schema'
import { InvalidCredentialsError } from '../../errors/invalid-credentials'

type Collaborator = {
  id: string
  registration: number
  colaborator_name: string
  spent: number
}

type Sector = {
  sector: string
  collaborators: Collaborator[]
}

type Unity = {
  unity: string
  sectors: Sector[]
}

export async function getCollaboratorsOrderSummary(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/collaborators/orders/summary',
    {
      schema: {
        summary: 'Get Collaborators Orders Summary',
        tags: ['collaborators', 'orders', 'summary'],
        querystring: z.object({
          pageIndex: z.coerce.number().default(0),
          from: z.coerce.date().optional(),
          to: z.coerce.date().optional(),
          name: z.string().optional(),
          unity: z.string().optional(),
          sector: z.string().optional(),
          registration: z.coerce.number().optional(),
        }),
        response: {
          200: z.object({
            data: z.array(
              z.object({
                unity: z.string(),
                sectors: z.array(
                  z.object({
                    sector: z.string(),
                    collaborators: z.array(
                      z.object({
                        id: z.string().cuid2(),
                        registration: z.number(),
                        colaborator_name: z.string(),
                        spent: z.number(),
                      }),
                    ),
                  }),
                ),
              }),
            ),
            meta: z.object({
              page_index: z.number(),
              per_page: z.number(),
              total_count: z.number(),
            }),
          }),
          401: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { pageIndex, from, to, name, unity, sector, registration } =
        request.query

      try {
        const startDate = from ? dayjs(from) : dayjs().subtract(30, 'days')
        const endDate = to
          ? dayjs(to)
          : from
            ? startDate.add(30, 'days')
            : dayjs()

        if (endDate.diff(startDate, 'days') > 30) {
          throw new Error('Date range cannot exceed 30 days')
        }

        const baseQuery = db
          .select({
            unity: unitys.name,
            sector: sectors.name,
            colaborator_name: collaborators.name,
            colaborator_registration: collaborators.registration,
            colaborator_id: collaborators.id,
            spent: sql`SUM(orders.price)`.as(`spent`),
          })
          .from(orders)
          .innerJoin(collaborators, eq(collaborators.id, orders.colaboratorId))
          .innerJoin(sectors, eq(sectors.id, collaborators.sectorId))
          .innerJoin(unitys, eq(unitys.id, sectors.unityId))
          .where(
            and(
              gte(orders.orderDate, startDate.toDate()),
              lte(orders.orderDate, endDate.toDate()),
              name ? ilike(collaborators.name, `%${name}%`) : undefined,
              unity ? ilike(unitys.name, `%${unity}%`) : undefined,
              sector ? ilike(sectors.name, `%${sector}%`) : undefined,
              registration
                ? eq(collaborators.registration, registration)
                : undefined,
            ),
          )
          .groupBy(
            unitys.name,
            sectors.name,
            collaborators.name,
            collaborators.id,
            collaborators.registration,
          )
          .orderBy(unitys.name, sectors.name, collaborators.name)
          .limit(10)
          .offset(pageIndex * 10)

        const totalCountQuery = await db
          .select({ count: count() })
          .from(baseQuery.as('baseQuery'))

        const [result, totalCount] = await Promise.all([
          baseQuery,
          totalCountQuery,
        ])

        const groupedResult = new Map<string, Unity>()

        result.forEach(
          ({
            unity,
            sector,
            colaborator_name,
            colaborator_id,
            colaborator_registration,
            spent,
          }) => {
            if (!groupedResult.has(unity)) {
              groupedResult.set(unity, { unity, sectors: [] })
            }

            const unityData = groupedResult.get(unity)!
            const sectorData = unityData.sectors.find(
              (s) => s.sector === sector,
            )

            if (!sectorData) {
              unityData.sectors.push({
                sector,
                collaborators: [
                  {
                    id: colaborator_id,
                    registration: colaborator_registration,
                    colaborator_name,
                    spent: (spent as number) || 0,
                  },
                ],
              })
            } else {
              sectorData.collaborators.push({
                id: colaborator_id,
                registration: colaborator_registration,
                colaborator_name,
                spent: (spent as number) || 0,
              })
            }
          },
        )

        const meta = {
          page_index: pageIndex,
          per_page: 10,
          total_count: totalCount[0].count,
        }

        return reply.status(200).send({
          data: Array.from(groupedResult.values()),
          meta,
        })
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          return reply.status(401).send({ message: error.message })
        }

        throw error
      }
    },
  )
}
