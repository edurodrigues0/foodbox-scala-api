import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { and, count, ne, ilike, eq } from 'drizzle-orm'
import { sectors, unitys, userRoleEnum, users } from '../../database/schema'
import { z } from 'zod'
import { UnauthorizedError } from '../../errors/unauthorized'
import { ForbiddenError } from '../../errors/forbidden'

export async function getUsers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/users',
    {
      schema: {
        summary: 'Get Users',
        tags: ['users'],
        querystring: z.object({
          pageIndex: z.coerce.number().default(0),
          userName: z.string().optional(),
        }),
        response: {
          200: z.object({
            users: z.array(
              z.object({
                id: z.string().cuid2(),
                user_name: z.string(),
                role: z.enum([...userRoleEnum.enumValues]),
                unit_name: z.string().nullable(),
                sector_name: z.string().nullable(),
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
      try {
        await request.jwtVerify()

        const { sub } = request.user
        const { pageIndex, userName } = request.query


        const user = await db.query.users.findFirst({
          columns: {
            id: true,
            email: true,
            role: true,
          },
          where(fields, { eq }) {
            return eq(fields.id, sub)
          },
        })

        if (user && user.role !== 'rh') {
          throw new ForbiddenError()
        }

        const baseQuery = db
          .select({
            id: users.id,
            user_name: users.name,
            role: users.role,
            unit_name: unitys.name,
            sector_name: sectors.name,
          })
          .from(users)
          .leftJoin(sectors, eq(sectors.userId, users.id))
          .leftJoin(unitys, eq(sectors.unityId, unitys.id))
          .where(
            and(
              userName ? ilike(users.name, `%${userName}%`) : undefined,
              ne(users.role, 'restaurant'),
            ),
          )
          .orderBy(users.name)
          .groupBy(users.id, unitys.name, sectors.name)

        const [amountOfUsersQuery, allUsers] = await Promise.all([
          db.select({ count: count() }).from(baseQuery.as('baseQuery')),
          baseQuery.offset(pageIndex * 10).limit(10),
        ])

        const amountOfUsers = amountOfUsersQuery[0].count

        return reply.status(200).send({
          users: allUsers,
          meta: {
            page_index: pageIndex,
            per_page: 10,
            total_count: amountOfUsers,
          },
        })
      } catch (error) {
        console.log(error)
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({
            message: error.message,
          })
        }
        
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({
            message: error.message,
          })
        }
      }
    },
  )
}
