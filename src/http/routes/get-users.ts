import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { and, count, desc, eq, ilike } from 'drizzle-orm'
import { userRoleEnum, users } from '../../database/schema'
import { z } from 'zod'
import { UnauthorizedError } from '../../errors/unauthorized'

export async function getUsers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/users',
    {
      schema: {
        summary: 'Get Users',
        tags: ['users'],
        querystring: z.object({
          pageIndex: z.coerce.number().default(0),
          userRole: z.enum([...userRoleEnum.enumValues]).optional(),
          userName: z.string().optional(),
          userEmail: z.string().optional(),
        }),
        response: {
          200: z.object({
            users: z.array(
              z.object({
                id: z.string().cuid2(),
                name: z.string(),
                email: z.string(),
                role: z.string(),
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
        await request.jwtVerify({ onlyCookie: true })
        const { sub } = request.user
        const { pageIndex, userName, userEmail, userRole } = request.query

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
          throw new UnauthorizedError()
        }

        const baseQuery = db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
          })
          .from(users)
          .where(
            and(
              userName ? ilike(users.name, `%${userName}`) : undefined,
              userEmail ? ilike(users.email, `%${userEmail}`) : undefined,
              userRole ? eq(users.role, userRole) : undefined,
            ),
          )

        const [amountOfUsersQuery, allUsers] = await Promise.all([
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
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({
            message: error.message,
          })
        }
      }
    },
  )
}
