import chalk from 'chalk'

import { faker } from '@faker-js/faker'

import { db } from './connection'
import { colaborators, restaurants, users } from './schema'
import { hash } from 'bcrypt'

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
        email: faker.internet.email(),
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
  await db
    .insert(restaurants)
    .values([
      {
        name: faker.company.name(),
        managerId,
      },
    ])
    .returning()
}

async function main() {
  await deleteAllDatabase()
  console.log(chalk.greenBright('✔️ Database reset!'))

  const { user2 } = await createUser()
  console.log(chalk.greenBright('✔️ Created users!'))

  await createRestaurant(user2.id)
  console.log(chalk.greenBright('✔️ Created restaurant!'))
}

main().finally(() => {
  process.exit(1)
})
