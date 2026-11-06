CREATE TABLE `invoice_accounts` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`salt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_accounts_email_unique` ON `invoice_accounts` (`email`);--> statement-breakpoint
CREATE TABLE `invoice_auth_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invoice_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`account_id` integer NOT NULL,
	`expires_at` integer NOT NULL
);
