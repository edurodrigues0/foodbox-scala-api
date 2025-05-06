import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '../../database/connection'
import { compare } from 'bcrypt'
import { InvalidCredentialsError } from '../../errors/invalid-credentials'
import { env } from '../../env'

export async function authenticate(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/login',
    {
      schema: {
        summary: 'Authenticate User (via Bearer)',
        tags: ['auth'],
        body: z.object({
          email: z.string().email(),
          password: z.string(),
        }),
        response: {
          200: z.object({
            auth_metadata: z.object({
              token: z.string(),
            }),
            user: z.object({
              id: z.string().cuid2(),
              email: z.string().email(),
              name: z.string(),
              role: z.string(),
            }),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body

      try {
        const user = await db.query.users.findFirst({
          columns: {
            id: true,
            email: true,
            name: true,
            role: true,
            password: true,
          },
          where(fields, { eq }) {
            return eq(fields.email, email)
          },
        })

        if (!user) {
          throw new InvalidCredentialsError()
        }

        const doesPasswordMatches = await compare(password, user.password)

        if (!doesPasswordMatches) {
          throw new InvalidCredentialsError()
        }

        const token = await reply.jwtSign(
          {
            role: user.role,
          },
          {
            sign: {
              sub: user.id,
              expiresIn: '1d',
            },
          },
        )

        const { password: _, ...userWithoutPassword } = user

        return reply
        .status(200)
        .send({
          auth_metadata: {
            token,
          },
          user: userWithoutPassword,
        })
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          return reply.status(400).send({
            message: error.message,
          })
        }

        console.error(error)
        throw error
      }
    },
  )
}
