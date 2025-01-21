import dayjs from 'dayjs'
import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { and, count, eq, gte, ilike, lte, sql } from 'drizzle-orm'
import { colaborators, orders, sectors, unitys } from '../../database/schema'
import { InvalidCredentialsError } from '../../errors/invalid-credentials'

type Collaborator = {
  id: string
  registration: number
  colaborator_name: string
  spent: number
}

type Sector = {
  sector: string
  colaborators: Collaborator[]
}

type Unity = {
  unity: string
  sectors: Sector[]
}

export async function getColaboratorsOrderSummary(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/colaborators/orders/summary',
    {
      schema: {
        summary: 'Get Colaborators Orders Summary',
        tags: ['colaborators', 'orders', 'summary'],
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
                    colaborators: z.array(
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
            colaborator_name: colaborators.name,
            colaborator_registration: colaborators.registration,
            colaborator_id: colaborators.id,
            spent: sql`SUM(orders.price)`.as(`spent`),
          })
          .from(orders)
          .innerJoin(colaborators, eq(colaborators.id, orders.colaboratorId))
          .innerJoin(sectors, eq(sectors.id, colaborators.sectorId))
          .innerJoin(unitys, eq(unitys.id, sectors.unityId))
          .where(
            and(
              gte(orders.orderDate, startDate.toDate()),
              lte(orders.orderDate, endDate.toDate()),
              name ? ilike(colaborators.name, `%${name}%`) : undefined,
              unity ? ilike(unitys.name, `%${unity}%`) : undefined,
              sector ? ilike(sectors.name, `%${sector}%`) : undefined,
              registration
                ? eq(colaborators.registration, registration)
                : undefined,
            ),
          )
          .groupBy(
            unitys.name,
            sectors.name,
            colaborators.name,
            colaborators.id,
            colaborators.registration,
          )
          .orderBy(unitys.name, sectors.name, colaborators.name)
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
                colaborators: [
                  {
                    id: colaborator_id,
                    registration: colaborator_registration,
                    colaborator_name,
                    spent: (spent as number) || 0,
                  },
                ],
              })
            } else {
              sectorData.colaborators.push({
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
