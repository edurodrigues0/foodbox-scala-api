import { FastifyInstance } from 'fastify'
import { createColaborator } from './create-colaborator'

export async function Routes(app: FastifyInstance) {
  // Colaborators
  app.register(createColaborator)
}
