import { createId } from '@paralleldrive/cuid2'
import { integer, pgTable, text, varchar } from 'drizzle-orm/pg-core'

export const unitys = pgTable('unitys', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: varchar({ length: 24 }).notNull(),
  unity: integer().unique(),
})
