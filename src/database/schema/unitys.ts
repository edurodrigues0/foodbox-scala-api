import { createId } from '@paralleldrive/cuid2'
import { integer, pgTable, text, varchar } from 'drizzle-orm/pg-core'
import { restaurants } from './restaurants'
import { relations } from 'drizzle-orm'

export const unitys = pgTable('unitys', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: varchar({ length: 24 }).notNull(),
  unity: integer().unique(),
  restaurantId: text('restaurant_id').references(() => restaurants.id, {
    onDelete: 'set null',
  }),
})

export const unitsRelations = relations(unitys, ({ one }) => {
  return {
    restaurant: one(restaurants, {
      fields: [unitys.restaurantId],
      references: [restaurants.id],
      relationName: 'unit_restaurant',
    }),
  }
})
