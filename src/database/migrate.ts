import postgres from 'postgres'

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

import { env } from '../env'

const connection = postgres(env.DATABASE_URL, { max: 1 })

const db = drizzle(connection)

async function runMigration() {
  await migrate(db, { migrationsFolder: 'drizzle' })
  await connection.end()

  process.exit()
}

runMigration().catch((error) => {
  console.error('Error during migration:', error)
  process.exit(1)
})
