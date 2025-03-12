import { z } from 'zod'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { and, count, eq, ilike } from 'drizzle-orm'
import { colaborators, menus, orders } from '../../database/schema'
import { ResourceNotFoundError } from '../../errors/resource-not-found'

export async function getOrdersBySector(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/orders/sector',
    {
      schema: {
        summary: 'Get Orders By Sector',
        tags: ['orders'],
        querystring: z.object({
          pageIndex: z.coerce.number().default(0),
          colaboratorName: z.string().optional(),
        }),
        response: {
          200: z.object({
            orders: z.array(
              z.object({
                id: z.string().cuid2(),
                colaborator: z.string(),
                menu: z.string(),
                date: z.date().transform((date) => date.toISOString()),
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
      const { pageIndex, colaboratorName } = request.query

      // Obtém o setor do usuário autenticado
      const sector = await db.query.sectors.findFirst({
        where(fields, { eq }) {
          return eq(fields.userId, sub)
        },
      })

      if (!sector) {
        throw new ResourceNotFoundError()
      }

      // Query para obter os pedidos dos colaboradores do setor do usuário autenticado
      const baseQuery = db
        .select({
          id: orders.id,
          menu: menus.name,
          colaborator: colaborators.name,
          date: orders.orderDate,
        })
        .from(orders)
        .innerJoin(menus, eq(menus.id, orders.menuId))
        .innerJoin(colaborators, eq(colaborators.id, orders.colaboratorId))
        .where(
          and(
            eq(colaborators.sectorId, sector.id), // Filtra pelo setor do colaborador
            colaboratorName
              ? ilike(colaborators.name, `%${colaboratorName}%`)
              : undefined, // Filtra pelo nome do colaborador, se fornecido
          ),
        )
        .orderBy(orders.orderDate)
        .limit(10)
        .offset(pageIndex * 10)

      // Contagem total de pedidos no setor
      const [amountOfOrdersQuery, allOrders] = await Promise.all([
        db
          .select({ count: count() })
          .from(orders)
          .innerJoin(menus, eq(menus.id, orders.menuId))
          .innerJoin(colaborators, eq(colaborators.id, orders.colaboratorId))
          .where(
            and(
              eq(colaborators.sectorId, sector.id), // Filtra pelo setor
              colaboratorName
                ? ilike(colaborators.name, `%${colaboratorName}%`)
                : undefined,
            ),
          ),
        baseQuery,
      ])

      const amountOfOrders = amountOfOrdersQuery[0].count

      return reply.status(200).send({
        orders: allOrders,
        meta: {
          page_index: pageIndex,
          per_page: 10,
          total_count: amountOfOrders,
        },
      })
    },
  )
}
