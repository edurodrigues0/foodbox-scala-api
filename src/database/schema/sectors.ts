import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core'
import { unitys } from './unitys'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const sectors = pgTable('sectors', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: varchar({ length: 24 }).notNull(),
  unityId: text('unity_id').references(() => unitys.id, {
    onDelete: 'cascade',
  }),
  userId: text('user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const sectorsRelations = relations(sectors, ({ one }) => {
  return {
    unity: one(unitys, {
      fields: [sectors.unityId],
      references: [unitys.id],
      relationName: 'sector_unity',
    }),
    supervisor: one(users, {
      fields: [sectors.userId],
      references: [users.id],
      relationName: 'sector_user',
    }),
  }
})
