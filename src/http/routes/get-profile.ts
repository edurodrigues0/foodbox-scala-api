import { z } from 'zod'

import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { db } from '../../database/connection'
import { ResourceNotFoundError } from '../../errors/resource-not-found'
import { getProfilePresenters } from '../presenters/get-profile-presenters'

export async function getProfile(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/me',
    {
      schema: {
        summary: 'Get Profile',
        tags: ['profile'],
        response: {
          200: z.object({
            user: z.object({
              id: z.string().cuid2(),
              email: z.string().email(),
              name: z.string(),
              restaurant_id: z.string().cuid2().nullish(),
            }),
          }),
          404: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        await request.jwtVerify({ onlyCookie: true })
        const { sub } = request.user

        const user = await db.query.users.findFirst({
          columns: {
            id: true,
            email: true,
            name: true,
          },
          with: {
            managedRestaurant: {
              columns: {
                id: true,
              },
            },
          },
          where(fields, { eq }) {
            return eq(fields.id, sub)
          },
        })

        if (!user) {
          throw new ResourceNotFoundError()
        }

        return reply.status(200).send({ user: getProfilePresenters(user) })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }

        throw error
      }
    },
  )
}
