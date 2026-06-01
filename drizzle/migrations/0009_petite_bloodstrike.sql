PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_resumes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text DEFAULT 'Unbenannter Lebenslauf' NOT NULL,
	`template` text DEFAULT 'classic' NOT NULL,
	`theme_config` text DEFAULT '{}',
	`is_default` integer DEFAULT false NOT NULL,
	`language` text DEFAULT 'de' NOT NULL,
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
PRAGMA foreign_keys=ON;