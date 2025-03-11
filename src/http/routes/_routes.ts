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
import { getSectors } from './get-sectors'
import { getUsers } from './get-users'
import { deleteUser } from './delete-user'
import { createUnit } from './create-unity'
import { getUnit } from './get-unit'
import { updateUnit } from './update-unit'
import { createSector } from './create-sector'
import { getAllSectors } from './get-all-sectors'
import { getSector } from './get-sector'
import { updateSector } from './update-sector'
import { createRestaurant } from './create-restaurant'
import { getRecentOrders } from './get-recent-orders'
import { getOrdersRestaurant } from './get-orders-restaurant'
import { getColaboratorsBySector } from './get-colaborators-by-sector'

export async function Routes(app: FastifyInstance) {
  // Auth
  app.register(authenticate)
  app.register(refresh)
  app.register(signOut)

  // Colaborators
  app.register(createColaborator)
  app.register(getColaborator)
  app.register(getColaboratorsBySector)
  app.register(getColaborators)
  app.register(updateColaborator)

  app.register(getColaboratorsOrderSummary)

  // Users
  app.register(registerUsers)
  app.register(getUsers)
  app.register(deleteUser)

  // Restaurants
  app.register(createRestaurant)
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
  app.register(getRecentOrders)
  app.register(getOrdersRestaurant)

  // Units
  app.register(createUnit)
  app.register(getUnits)
  app.register(getUnit)
  app.register(updateUnit)

  // Profile
  app.register(getProfile)

  // Sector
  app.register(createSector)
  app.register(getSectors)
  app.register(getAllSectors)
  app.register(getSector)
  app.register(updateSector)

  // WS
  app.register(restaurantConnection)
}
