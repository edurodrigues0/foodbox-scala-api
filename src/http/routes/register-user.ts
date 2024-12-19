import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../database/connection'
import { userRoleEnum, users } from '../../database/schema'
import { hash } from 'bcrypt'
import { restaurants } from '../../database/schema/restaurants'
import { DataAlreadyExistsError } from '../../errors/data-already-existis'

export async function registerUsers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/users',
    {
      schema: {
        summary: 'Register User',
        tags: ['users'],
        body: z.object({
          name: z.string(),
          email: z.string().email(),
          password: z.string(),
          role: z.enum([...userRoleEnum.enumValues]).optional(),
          restaurantName: z.string().optional(),
        }),
        response: {
          201: z.object({
            email: z.string().email(),
          }),
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { name, email, password, role, restaurantName } = request.body

        const userWithSameEmail = await db.query.users.findFirst({
          where(fields, { eq }) {
            return eq(fields.email, email)
          },
        })

        if (userWithSameEmail) {
          throw new DataAlreadyExistsError()
        }

        const hashPassword = await hash(password, 6)

        const [user] = await db
          .insert(users)
          .values({
            name,
            email,
            password: hashPassword,
            role: role ?? 'supervisor',
          })
          .returning({
            id: users.id,
            email: users.email,
          })

        if (role === 'restaurant' && restaurantName) {
          await db.insert(restaurants).values({
            name: restaurantName,
            managerId: user.id,
          })
        }

        return reply.status(201).send({
          email: user.email,
        })
      } catch (error) {
        if (error instanceof DataAlreadyExistsError) {
          return reply.status(409).send({ message: error.message })
        }
      }
    },
  )
}
