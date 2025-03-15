import postgres from 'postgres'

import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

import { env } from '../env'
import { sql } from 'drizzle-orm'

const connection = postgres(env.DATABASE_URL, { max: 1 })

const db = drizzle(connection)

export const up = async (db: PostgresJsDatabase) => {
  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."role" CASCADE;
  `)
}

async function runMigration() {
  await up(db)
  await migrate(db, { migrationsFolder: 'drizzle' })
  await connection.end()

  process.exit()
}

runMigration().catch((error) => {
  console.error('Error during migration:', error)
  process.exit(1)
})
