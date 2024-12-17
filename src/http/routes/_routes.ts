import { FastifyInstance } from 'fastify'
import { createColaborator } from './create-colaborator'
import { getColaborator } from './get-colaborator'
import { getColaborators } from './get-colaborators'
import { updateColaborator } from './update-colaborator'

export async function Routes(app: FastifyInstance) {
  // Colaborators
  app.register(createColaborator)
  app.register(getColaborator)
  app.register(getColaborators)
  app.register(updateColaborator)
}
