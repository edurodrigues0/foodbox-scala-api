import postgres from 'postgres'

import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

import { env } from '../env'

const connection = postgres(env.DATABASE_URL, { max: 1 })

const db = drizzle(connection)

export const up = async (db: PostgresJsDatabase) => {
  await db.execute(`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
        CREATE TYPE "role" AS ENUM ('admin', 'user', 'supervisor', 'manager');
      END IF;
    END $$;
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
