import { pgTable, text, varchar, timestamp, serial } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { sectors } from './sectors'

export const colaborators = pgTable('colaborators', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  registration: serial('registration').notNull().unique(),
  cpf: text('cpf').notNull().unique(),
  hmac_cpf: text('hmac_cpf').notNull().unique(),
  sectorId: text('sector_id')
    .references(() => sectors.id)
    .default('1'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const colaboratorsRelations = relations(colaborators, ({ one }) => {
  return {
    unity: one(sectors, {
      fields: [colaborators.sectorId],
      references: [sectors.id],
      relationName: 'colaborator_sector',
    }),
  }
})
