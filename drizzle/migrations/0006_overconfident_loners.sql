PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`resume_id` text NOT NULL,
	`title` text DEFAULT 'New Chat' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_chat_sessions`("id", "resume_id", "title", "created_at", "updated_at") SELECT "id", "resume_id", "title", "created_at", "updated_at" FROM `chat_sessions`;--> statement-breakpoint
DROP TABLE `chat_sessions`;--> statement-breakpoint
ALTER TABLE `__new_chat_sessions` RENAME TO `chat_sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_resumes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text DEFAULT 'Unbenannter Lebenslauf' NOT NULL,
	`template` text DEFAULT 'classic' NOT NULL,
	`theme_config` text DEFAULT '{}',
	`is_default` integer DEFAULT false NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`share_token` text,
	`is_public` integer DEFAULT false NOT NULL,
	`share_password` text,
	`view_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_resumes`("id", "user_id", "title", "template", "theme_config", "is_default", "language", "share_token", "is_public", "share_password", "view_count", "created_at", "updated_at") SELECT "id", "user_id", "title", "template", "theme_config", "is_default", "language", "share_token", "is_public", "share_password", "view_count", "created_at", "updated_at" FROM `resumes`;--> statement-breakpoint
DROP TABLE `resumes`;--> statement-breakpoint
ALTER TABLE `__new_resumes` RENAME TO `resumes`;--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_customer_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_subscription_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_price_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_current_period_end` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `subscription_status` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_stripe_customer_id_unique` ON `users` (`stripe_customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_stripe_subscription_id_unique` ON `users` (`stripe_subscription_id`);