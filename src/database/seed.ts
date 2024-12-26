import chalk from 'chalk'

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
import { encryptCPF } from '../utils/encrypt-cpf'
import { hmacCPF } from '../utils/hmac-cpf'

/**
 * Delete database
 */
async function deleteAllDatabase() {
  await db.delete(users)
  await db.delete(restaurants)
  await db.delete(colaborators)
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
const createRestaurant = async (managerId: string) => {
  const [restaurant] = await db
    .insert(restaurants)
    .values([
      {
        name: faker.company.name(),
        managerId,
      },
    ])
    .returning()

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
        description: faker.commerce.productDescription(),
        restaurantId,
        serviceDate: faker.date.recent({ days: 1 }),
      },
      {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
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
      sector
    }
}

/**
 * Create colaborator
 */
const createColaborator = async (sectorId: string) => {
  const cpf = '146.113.760-87'
  const encryptedCPF = encryptCPF(cpf)
  const hashedHmacCPF = hmacCPF(cpf)

  const [colaborator] = await db
    .insert(colaborators)
    .values({
      name: faker.person.fullName(),
      cpf: encryptedCPF,
      hmac_cpf: hashedHmacCPF,
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
  console.log(chalk.greenBright('✔️ Database reset!'))

  const { user2 } = await createUser()
  console.log(chalk.greenBright('✔️ Created users!'))

  const { restaurant } = await createRestaurant(user2.id)
  console.log(chalk.greenBright('✔️ Created restaurant!'))

  const { menu1 } = await createMenu(restaurant.id)
  console.log(chalk.greenBright('✔️ Created menu!'))

  const { unity } = await createUnity()
  console.log(chalk.greenBright('✔️ Created unity!'))

  const { sector } = await createSector(unity.id)
  console.log(chalk.greenBright('✔️ Created sector!'))

  const { colaborator } = await createColaborator(sector.id)
  console.log(chalk.greenBright('✔️ Created colaborator!'))

  await createOrders(colaborator.id, menu1.id)
  console.log(chalk.greenBright('✔️ Created orders!'))
}

main().finally(() => {
  process.exit(1)
})
