import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { collaborators } from './collaborators'
import { menus } from './menus'

export const orders = pgTable('orders', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  colaboratorId: text('colaborator_id')
    .notNull()
    .references(() => collaborators.id, {
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
    collaborators: one(collaborators, {
      fields: [orders.colaboratorId],
      references: [collaborators.id],
      relationName: 'orders_colaborator',
    }),
  }
})
