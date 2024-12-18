import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../database/connection'
import { userRoleEnum, users } from '../../database/schema'
import { hash } from 'bcrypt'

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
      const { name, email, password, role } = request.body

      const userWithSameEmail = await db.query.users.findFirst({
        where(fields, { eq }) {
          return eq(fields.email, email)
        },
      })

      if (userWithSameEmail) {
        return reply.status(409).send({ message: 'User already exists.' })
      }

      const hashPassoword = await hash(password, 6)

      const [user] = await db
        .insert(users)
        .values({
          name,
          email,
          password: hashPassoword,
          role: role ?? 'supervisor',
        })
        .returning({
          email: users.email,
        })

      return reply.status(201).send({
        email: user.email,
      })
    },
  )
}
