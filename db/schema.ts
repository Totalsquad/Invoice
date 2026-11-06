import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('business_state', {id:text('id').primaryKey(),payload:text('payload').notNull(),version:integer('version').notNull().default(0)});
