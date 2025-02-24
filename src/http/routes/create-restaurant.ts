import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { db } from '../../database/connection'
import { restaurants, unitys, users } from '../../database/schema'
import { z } from 'zod'
import { DataAlreadyExistsError } from '../../errors/data-already-existis'
import { inArray } from 'drizzle-orm'
import { hash } from 'bcrypt'

export async function createRestaurant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/restaurants',
    {
      schema: {
        summary: 'Create Sector',
        tags: ['restaurants'],
        body: z.object({
          userName: z.string(),
          userEmail: z.string().email(),
          password: z.string(),
          restaurantName: z.string(),
          unitIds: z.array(z.string().cuid2()),
        }),
        response: {
          201: z.object({
            restaurant_name: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { userName, userEmail, restaurantName, unitIds, password } =
          request.body

        const hashPassword = await hash(password, 6)

        const userWithSameEmail = await db.query.users.findFirst({
          where(fields, { eq }) {
            return eq(fields.email, userEmail)
          },
        })

        if (userWithSameEmail) {
          throw new DataAlreadyExistsError()
        }

        const [user] = await db
          .insert(users)
          .values({
            name: userName,
            email: userEmail,
            password: hashPassword,
            role: 'restaurant',
          })
          .returning({
            id: users.id,
            email: users.email,
          })

        const [restaurant] = await db
          .insert(restaurants)
          .values({
            name: restaurantName,
            managerId: user.id,
          })
          .returning()

        const units = await db.query.unitys.findMany({
          where(fields) {
            return inArray(fields.id, unitIds ?? [])
          },
        })

        const unitsToUpdate = units.filter((unit) => unit.restaurantId === null)

        if (unitsToUpdate.length !== units.length) {
          throw new DataAlreadyExistsError()
        }

        if (unitsToUpdate.length > 0) {
          await db
            .update(unitys)
            .set({
              restaurantId: restaurant.id,
            })
            .where(
              inArray(
                unitys.id,
                unitsToUpdate.map((unit) => unit.id),
              ),
            )
        }

        return reply.status(201).send({
          restaurant_name: restaurant.name,
        })
      } catch (error) {
        if (error instanceof DataAlreadyExistsError) {
          return reply.status(409).send({
            message: error.message,
          })
        }

        throw error
      }
    },
  )
}
