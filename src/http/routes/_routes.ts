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
import { createOrders } from './create-orders'
import { restaurantConnection } from './restaurant-connection'
import { getMenuTodayAndTomorrow } from './get-menus-today-and-tomorrow'
import { getColaboratorsOrderSummary } from './get-colaborators-orders-summary'
import { getUnits } from './get-units'
import { getProfile } from './get-profile'
import { signOut } from './sign-out'

export async function Routes(app: FastifyInstance) {
  // Auth
  app.register(authenticate)
  app.register(refresh)
  app.register(signOut)

  // Colaborators
  app.register(createColaborator)
  app.register(getColaborator)
  app.register(getColaborators)
  app.register(updateColaborator)

  app.register(getColaboratorsOrderSummary)

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
  app.register(getMenuTodayAndTomorrow)

  // Orders
  app.register(createOrders)

  // Units
  app.register(getUnits)

  // Profile
  app.register(getProfile)

  app.register(restaurantConnection)
}
