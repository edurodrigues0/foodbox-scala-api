import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { colaborators } from './colaborators'
import { menus } from './menus'

export const orders = pgTable('orders', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  colaboratorId: text('colaborator_id')
    .notNull()
    .references(() => colaborators.id, {
      onDelete: 'set null',
    }),
  menuId: text('menu_id')
    .notNull()
    .references(() => menus.id),
  orderDate: timestamp().notNull(),
  price: integer().notNull(),
})

export const ordersRelations = relations(orders, ({ one }) => {
  return {
    restaurant: one(colaborators, {
      fields: [orders.colaboratorId],
      references: [colaborators.id],
      relationName: 'orders_colaborator',
    }),
  }
})
