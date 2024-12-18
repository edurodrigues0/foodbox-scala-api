import { createId } from '@paralleldrive/cuid2'
import { pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'rh',
  'supervisor',
  'restaurant',
])

export const users = pgTable('users', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  password: varchar('password').notNull(),
  role: userRoleEnum('role').default('supervisor').notNull(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
})
