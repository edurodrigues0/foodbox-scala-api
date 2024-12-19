import chalk from 'chalk'

import { faker } from '@faker-js/faker'

import { db } from './connection'
import { colaborators, menus, orders, restaurants, users } from './schema'
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
 * Create colaborator
 */
const createColaborator = async () => {
  const cpf = '146.113.760-87'
  const encryptedCPF = encryptCPF(cpf)
  const hashedHmacCPF = hmacCPF(cpf)

  const [colaborator] = await db
    .insert(colaborators)
    .values({
      name: faker.person.fullName(),
      cpf: encryptedCPF,
      hmac_cpf: hashedHmacCPF,
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

  const { colaborator } = await createColaborator()
  console.log(chalk.greenBright('✔️ Created colaborator!'))

  await createOrders(colaborator.id, menu1.id)
  console.log(chalk.greenBright('✔️ Created orders!'))
}

main().finally(() => {
  process.exit(1)
})
