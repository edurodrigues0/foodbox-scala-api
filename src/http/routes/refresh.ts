import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { undefined, z } from 'zod'
import { db } from '../../database/connection'

export async function refresh(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/auth/refresh',
    {
      schema: {
        summary: 'Refresh token',
        tags: ['auth'],
        response: {
          200: z.object({
            auth_metadata: z.object({
              token: z.string(),
              refresh_token: z.string(),
            }),
            user: z.object({
              id: z.string().cuid2(),
              email: z.string().email(),
              name: z.string(),
              role: z.string(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      await request.jwtVerify({ onlyCookie: true })

      const { role, sub } = request.user

      const user = await db.query.users.findFirst({
        where(fields, { eq }) {
          return eq(fields.id, sub)
        },
      })

      if (!user) {
        throw new Error()
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
            refresh_token: refreshToken,
          },
          user: {
            ...user,
            password: undefined,
          },
        })
    },
  )
}
