CREATE TABLE `items` (
	`_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`source` integer NOT NULL,
	`title` text NOT NULL,
	`link` text NOT NULL,
	`date` integer NOT NULL,
	`fetchedDate` integer NOT NULL,
	`thumb` text,
	`content` text NOT NULL,
	`snippet` text NOT NULL,
	`creator` text,
	`hasRead` integer DEFAULT false NOT NULL,
	`starred` integer DEFAULT false NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	`notify` integer DEFAULT false NOT NULL,
	`serviceRef` text
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`sid` integer PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`iconurl` text,
	`name` text NOT NULL,
	`openTarget` integer DEFAULT 0 NOT NULL,
	`lastFetched` integer NOT NULL,
	`serviceRef` text,
	`fetchFrequency` integer DEFAULT 0 NOT NULL,
	`textDir` integer DEFAULT 0 NOT NULL,
	`hidden` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sources_url_unique` ON `sources` (`url`);