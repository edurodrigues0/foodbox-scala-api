import { pgTable, text, varchar, timestamp, serial } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { unitys } from './unitys'
import { relations } from 'drizzle-orm'

export const colaborators = pgTable('colaborators', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  registration: serial('registration').notNull().unique(),
  cpf: text('cpf').notNull().unique(),
  hmac_cpf: text('hmac_cpf').notNull().unique(),
  unityId: text('unity_id')
    .references(() => unitys.id)
    .default('1'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const colaboratorsRelations = relations(colaborators, ({ one }) => {
  return {
    unity: one(unitys, {
      fields: [colaborators.unityId],
      references: [unitys.id],
      relationName: 'colaborator_unity',
    }),
  }
})
