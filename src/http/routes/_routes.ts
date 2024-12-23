import { FastifyInstance } from 'fastify'
import { createColaborator } from './create-colaborator'
import { getColaborator } from './get-colaborator'
import { getColaborators } from './get-colaborators'
import { updateColaborator } from './update-colaborator'
import { registerUsers } from './register-user'
import { getRestaurant } from './get-restaurant'
import { getRestaurants } from './get-restaurants'
import { updateRestaurant } from './update-restaurant'
import { authenticate } from './authenticate'
import { refresh } from './refresh'
import { createMenu } from './create-menu'
import { getMenus } from './get-menus'
import { getMenu } from './get-menu'
import { updateMenu } from './update-menu'
import { deleteMenu } from './delete-menu'

export async function Routes(app: FastifyInstance) {
  // Auth
  app.register(authenticate)
  app.register(refresh)

  // Colaborators
  app.register(createColaborator)
  app.register(getColaborator)
  app.register(getColaborators)
  app.register(updateColaborator)

  // Users
  app.register(registerUsers)

  // Restaurants
  app.register(getRestaurant)
  app.register(getRestaurants)
  app.register(updateRestaurant)

  // Menus
  app.register(createMenu)
  app.register(getMenu)
  app.register(getMenus)
  app.register(updateMenu)
  app.register(deleteMenu)
}
