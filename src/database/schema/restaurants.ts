import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'
import { relations } from 'drizzle-orm'
import { menus } from './menus'
import { unitys } from './unitys'

export const restaurants = pgTable('restaurants', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text('name').notNull(),
  managerId: text('manager_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  unitId: text('unit_id').references(() => unitys.id, {
    onDelete: 'cascade',
  }),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
})

export const restaurantsRelations = relations(restaurants, ({ one, many }) => {
  return {
    unit: one(unitys, {
      fields: [restaurants.unitId],
      references: [unitys.id],
      relationName: 'restaurant_unit',
    }),
    manager: one(users, {
      fields: [restaurants.managerId],
      references: [users.id],
      relationName: 'restaurant_manager',
    }),
    menus: many(menus),
  }
})
