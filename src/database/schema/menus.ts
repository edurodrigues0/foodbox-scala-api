import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { restaurants } from './restaurants'

export const menus = pgTable('menus', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: varchar('name', { length: 40 }).notNull(),
  serviceDate: timestamp('service_date').notNull(),
  description: text().notNull(),
  restaurantId: text('restaurant_id')
    .notNull()
    .references(() => restaurants.id, {
      onDelete: 'cascade',
    }),
  allergens: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
})

export const menusRelations = relations(menus, ({ one }) => {
  return {
    restaurant: one(restaurants, {
      fields: [menus.restaurantId],
      references: [restaurants.id],
      relationName: 'menus_restaurant',
    }),
  }
})
