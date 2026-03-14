CREATE TABLE `account` (
	`access_token` text,
	`access_token_expires_at` integer,
	`account_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`id_token` text,
	`password` text,
	`provider_id` text NOT NULL,
	`refresh_token` text,
	`refresh_token_expires_at` integer,
	`scope` text,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `passkey` (
	`aaguid` text,
	`backed_up` integer NOT NULL,
	`counter` integer NOT NULL,
	`created_at` integer,
	`credential_id` text NOT NULL,
	`device_type` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`public_key` text NOT NULL,
	`transports` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `passkey_userId_idx` ON `passkey` (`user_id`);--> statement-breakpoint
CREATE INDEX `passkey_credentialID_idx` ON `passkey` (`credential_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`browser` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`device` text,
	`expires_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`ip_address` text,
	`os` text,
	`token` text NOT NULL,
	`updated_at` integer NOT NULL,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `two_factor` (
	`backup_codes` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`secret` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `twoFactor_secret_idx` ON `two_factor` (`secret`);--> statement-breakpoint
CREATE INDEX `twoFactor_userId_idx` ON `two_factor` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`image` text,
	`name` text NOT NULL,
	`two_factor_enabled` integer DEFAULT false,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`expires_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `folders` (
	`color` text,
	`created_at` integer,
	`deleted_at` integer,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`order` integer,
	`parent_id` text,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `folders_user_idx` ON `folders` (`user_id`);--> statement-breakpoint
CREATE INDEX `folders_user_parent_idx` ON `folders` (`user_id`,`parent_id`);--> statement-breakpoint
CREATE TABLE `receipt_items` (
	`id` text PRIMARY KEY NOT NULL,
	`is_deposit` integer,
	`is_discount` integer,
	`name` text NOT NULL,
	`quantity` real,
	`receipt_id` text NOT NULL,
	`sort_order` integer NOT NULL,
	`total_price` real NOT NULL,
	`unit_price` real,
	FOREIGN KEY (`receipt_id`) REFERENCES `receipts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `receipt_items_receipt_idx` ON `receipt_items` (`receipt_id`);--> statement-breakpoint
CREATE TABLE `receipts` (
	`card_last_four` text,
	`created_at` integer,
	`currency` text DEFAULT 'USD' NOT NULL,
	`date` text NOT NULL,
	`deleted_at` integer,
	`discount` real,
	`fees` real,
	`folder_id` text,
	`id` text PRIMARY KEY NOT NULL,
	`image_url` text,
	`merchant_address` text,
	`merchant_name` text NOT NULL,
	`merchant_phone` text,
	`order` integer,
	`payment_method` text,
	`receipt_number` text,
	`receipt_type` text NOT NULL,
	`storage_key` text,
	`subtotal` real,
	`tax` real,
	`time` text,
	`tip` real,
	`total` real NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `receipts_user_idx` ON `receipts` (`user_id`);--> statement-breakpoint
CREATE INDEX `receipts_user_folder_idx` ON `receipts` (`user_id`,`folder_id`);--> statement-breakpoint
CREATE TABLE `sheet_cells` (
	`col` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`row` integer NOT NULL,
	`sheet_id` text NOT NULL,
	`value` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`sheet_id`) REFERENCES `sheets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sheet_cells_sheet_idx` ON `sheet_cells` (`sheet_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `sheet_cells_pos_idx` ON `sheet_cells` (`sheet_id`,`row`,`col`);--> statement-breakpoint
CREATE TABLE `sheets` (
	`col_widths` text,
	`created_at` integer,
	`description` text,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`row_heights` text,
	`updated_at` integer,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sheets_user_idx` ON `sheets` (`user_id`);