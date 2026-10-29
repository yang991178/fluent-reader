CREATE INDEX `items_source_date` ON `items` (`source`,"date" desc,"_id" desc);--> statement-breakpoint
CREATE INDEX `items_date` ON `items` ("date" desc,"_id" desc);--> statement-breakpoint
CREATE INDEX `items_source_guid` ON `items` (`source`,`guid`) WHERE "items"."guid" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `items_local_identity` ON `items` (`source`,`title`,`link`,`date`) WHERE "items"."serviceRef" IS NULL;--> statement-breakpoint
CREATE INDEX `items_service_state` ON `items` (`serviceRef`,`hasRead`,`starred`) WHERE "items"."serviceRef" IS NOT NULL;--> statement-breakpoint
CREATE INDEX `items_unread_date` ON `items` (`hasRead`,"date" desc,"_id" desc,`source`) WHERE "items"."hasRead" = 0;--> statement-breakpoint
CREATE INDEX `items_starred_date` ON `items` (`starred`,"date" desc,"_id" desc) WHERE "items"."starred" = 1;