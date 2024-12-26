import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { unitys } from './unitys'
import { relations } from 'drizzle-orm'

export const sectors = pgTable('sectors', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: varchar({ length: 24 }).notNull(),
  unityId: text('unity_id').references(() => unitys.id, {
    onDelete: 'cascade',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow()
})

export const sectorsRelations = relations(sectors, ({ one }) => {
  return {
    unity: one(unitys, {
      fields: [sectors.unityId],
      references: [unitys.id],
      relationName: 'sector_unity'
    })
  }
})