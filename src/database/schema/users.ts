import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { restaurants } from './restaurants'

const userRoleEnum = pgEnum('role', ['admin', 'rh', 'supervisor', 'restaurant'])

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

export const usersRelations = relations(users, ({ one }) => {
  return {
    managedRestaurant: one(restaurants, {
      fields: [users.id],
      references: [restaurants.managerId],
      relationName: 'managed_restaurant',
    }),
  }
})
