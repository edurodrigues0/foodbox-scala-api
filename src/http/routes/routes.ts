import { FastifyInstance } from 'fastify'
import { createColaborator } from './create-colaborator'
import { getColaborator } from './get-colaborator'

export async function Routes(app: FastifyInstance) {
  // Colaborators
  app.register(createColaborator)
  app.register(getColaborator)
}
