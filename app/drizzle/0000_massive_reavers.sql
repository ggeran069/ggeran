CREATE TABLE `news` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`date` text,
	`summary` text,
	`image` text,
	`body` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_slug_idx` ON `news` (`slug`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`year` integer,
	`date` text,
	`ref` text,
	`category` text,
	`location` text,
	`medium` text,
	`dimensions` text,
	`edition` text,
	`availability` text,
	`series` text,
	`featured` integer DEFAULT false,
	`weight` integer DEFAULT 1,
	`image` text,
	`gallery` text,
	`body` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_idx` ON `projects` (`slug`);--> statement-breakpoint
CREATE TABLE `publications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`year` integer,
	`date` text,
	`ref` text,
	`category` text,
	`publisher` text,
	`author` text,
	`isbn` text,
	`pages` text,
	`format` text,
	`edition` text,
	`image` text,
	`gallery` text,
	`body` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `publications_slug_idx` ON `publications` (`slug`);--> statement-breakpoint
CREATE TABLE `site_content` (
	`id` integer PRIMARY KEY NOT NULL,
	`contact_email` text,
	`contact_instagram_url` text,
	`contact_instagram_handle` text,
	`contact_intro` text,
	`about_portrait` text,
	`about_bio` text,
	`about_exhibitions` text,
	`available_heading` text,
	`available_intro` text,
	`hero_title` text,
	`hero_subtitle` text,
	`nav_projects_label` text,
	`nav_available_label` text,
	`nav_about_label` text,
	`nav_contact_label` text,
	`nav_show_publications` integer DEFAULT false,
	`nav_show_news` integer DEFAULT false,
	`project_categories` text,
	`nav_extra_links` text,
	`updated_at` integer
);
