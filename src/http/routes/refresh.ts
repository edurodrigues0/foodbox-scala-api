import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { undefined, z } from 'zod'
import { db } from '../../database/connection'
import { UnauthorizedError } from '../../errors/unauthorized'

export async function refresh(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/auth/refresh',
    {
      schema: {
        summary: 'Refresh token',
        tags: ['auth'],
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
          401: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        await request.jwtVerify({ onlyCookie: true })

        const { role, sub } = request.user

        const user = await db.query.users.findFirst({
          where(fields, { eq }) {
            return eq(fields.id, sub)
          },
        })

        if (!user) {
          throw new UnauthorizedError()
        }

        const token = await reply.jwtSign(
          {
            role,
          },
          {
            sign: {
              sub: request.user.sub,
            },
          },
        )

        const refreshToken = await reply.jwtSign(
          { role },
          {
            sign: {
              sub,
              expiresIn: '3d',
            },
          },
        )

        return reply
          .setCookie('refreshToken', refreshToken, {
            path: '/',
            secure: true,
            httpOnly: true,
          })
          .status(200)
          .send({
            auth_metadata: {
              token,
            },
            user: {
              ...user,
              password: undefined,
            },
          })
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({
            message: error.message,
          })

          throw error
        }
      }
    },
  )
}
