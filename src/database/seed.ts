import { faker } from '@faker-js/faker'

import { db } from './connection'
import {
  colaborators,
  menus,
  orders,
  restaurants,
  sectors,
  unitys,
  users,
} from './schema'
import { hash } from 'bcrypt'
import { eq } from 'drizzle-orm'

/**
 * Delete database
 */
async function deleteAllDatabase() {
  await db.delete(orders)
  await db.delete(colaborators)
  await db.delete(menus)
  await db.delete(restaurants)
  await db.delete(sectors)
  await db.delete(unitys)
  await db.delete(users)
}

/**
 * Create Users
 */
const createUser = async () => {
  const hashPassword = await hash('123456', 6)

  const [user1, user2] = await db
    .insert(users)
    .values([
      {
        name: faker.person.fullName(),
        email: 'admin@admin.com',
        password: hashPassword,
        role: 'admin',
      },
      {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        role: 'restaurant',
      },
    ])
    .returning()

  return {
    user1,
    user2,
  }
}

/**
 * Create Restaurant
 */
const createRestaurant = async (managerId: string, unitId: string) => {
  const [restaurant] = await db
    .insert(restaurants)
    .values([
      {
        name: faker.company.name(),
        managerId,
      },
    ])
    .returning()

  await db
    .update(unitys)
    .set({
      restaurantId: restaurant.id,
    })
    .where(eq(unitys.id, unitId))

  return {
    restaurant,
  }
}

/**
 * Create Menu
 */
const createMenu = async (restaurantId: string) => {
  const [menu1] = await db
    .insert(menus)
    .values([
      {
        name: faker.commerce.productName(),
        description: [
          faker.commerce.productName(),
          faker.commerce.productName(),
          faker.commerce.productName(),
          faker.commerce.productName(),
        ],
        restaurantId,
        serviceDate: faker.date.recent({ days: 1 }),
      },
      {
        name: faker.commerce.productName(),
        description: [
          faker.commerce.productName(),
          faker.commerce.productName(),
        ],
        restaurantId,
        serviceDate: faker.date.recent({ days: 1 }),
      },
    ])
    .returning()

  return {
    menu1,
  }
}

/**
 * Create unitys
 */
const createUnity = async () => {
  const [unity] = await db
    .insert(unitys)
    .values({
      name: 'Scala II',
      unity: 2,
    })
    .returning()

  return { unity }
}

const createSector = async (unityId: string) => {
  const [sector] = await db
    .insert(sectors)
    .values({
      name: faker.commerce.department(),
      unityId,
    })
    .returning()

  return {
    sector,
  }
}

/**
 * Create colaborator
 */
const createColaborator = async (sectorId: string) => {
  const cpf = '146.113.760-87'

  const [colaborator] = await db
    .insert(colaborators)
    .values({
      name: faker.person.fullName(),
      cpf,
      sectorId,
    })
    .returning()

  return {
    colaborator,
  }
}

/**
 * Create orders
 */
const createOrders = async (colaboratorId: string, menuId: string) => {
  await db
    .insert(orders)
    .values([
      {
        colaboratorId,
        menuId,
        orderDate: faker.date.recent(),
        price: 215,
      },
    ])
    .returning()
}

async function main() {
  await deleteAllDatabase()

  const { unity } = await createUnity()

  const { sector } = await createSector(unity.id)

  const { user2 } = await createUser()

  const { restaurant } = await createRestaurant(user2.id, unity.id)

  const { menu1 } = await createMenu(restaurant.id)

  const { colaborator } = await createColaborator(sector.id)

  await createOrders(colaborator.id, menu1.id)
}

main()
  .then((err) => console.log(err))
  .finally(() => {
    process.exit(1)
  })
