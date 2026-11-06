import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('business_state', {id:text('id').primaryKey(),payload:text('payload').notNull(),version:integer('version').notNull().default(0)});

export const accounts=sqliteTable('invoice_accounts',{id:integer('id').primaryKey(),email:text('email').notNull().unique(),passwordHash:text('password_hash').notNull(),salt:text('salt').notNull()});
export const sessions=sqliteTable('invoice_sessions',{tokenHash:text('token_hash').primaryKey(),accountId:integer('account_id').notNull(),expiresAt:integer('expires_at').notNull()});
export const attempts=sqliteTable('invoice_auth_attempts',{id:text('id').primaryKey(),count:integer('count').notNull(),expiresAt:integer('expires_at').notNull()});
