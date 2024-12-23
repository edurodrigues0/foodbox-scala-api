import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { count, desc } from 'drizzle-orm'
import { menus } from '../../database/schema'
import { getMenusPresenters } from '../presenters/get-menus-presenters'

export async function getMenus(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/menus',
    {
      schema: {
        summary: 'Get Menus',
        tags: ['menus'],
        querystring: z.object({
          pageIndex: z.coerce.number().default(0),
        }),
        response: {
          200: z.object({
            menus: z.array(
              z.object({
                id: z.string().cuid2(),
                name: z.string(),
                created_at: z.coerce.string(),
                service_date: z.coerce.string(),
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
      const { pageIndex } = request.query

      const baseQuery = db
        .select({
          id: menus.id,
          name: menus.name,
          created_at: menus.createdAt,
          service_date: menus.serviceDate,
        })
        .from(menus)

      const [amountOfMenusQuery, allMenus] = await Promise.all([
        db.select({ count: count() }).from(baseQuery.as('baseQuery')),
        db
          .select()
          .from(baseQuery.as('baseQuery'))
          .offset(pageIndex * 10)
          .limit(10)
          .orderBy((fields) => {
            return [desc(fields.service_date)]
          }),
      ])

      const amountOfMenus = amountOfMenusQuery[0].count

      return reply.status(200).send({
        menus: getMenusPresenters(allMenus),
        meta: {
          page_index: pageIndex,
          per_page: 10,
          total_count: amountOfMenus,
        },
      })
    },
  )
}
