import { desc, sql } from "drizzle-orm"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const sourcesTable = sqliteTable("sources", {
    sid: integer("sid").primaryKey(),
    url: text("url").notNull().unique(),
    iconurl: text("iconurl"),
    name: text("name").notNull(),
    openTarget: integer("openTarget").notNull().default(0),
    lastFetched: integer("lastFetched", { mode: "timestamp_ms" }).notNull(),
    serviceRef: text("serviceRef"),
    fetchFrequency: integer("fetchFrequency").notNull().default(0),
    textDir: integer("textDir").notNull().default(0),
    hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
})

export const itemsTable = sqliteTable(
    "items",
    {
        _id: integer("_id").primaryKey({ autoIncrement: true }),
        source: integer("source").notNull(),
        guid: text("guid"),
        title: text("title").notNull(),
        link: text("link").notNull(),
        date: integer("date", { mode: "timestamp_ms" }).notNull(),
        fetchedDate: integer("fetchedDate", { mode: "timestamp_ms" }).notNull(),
        thumb: text("thumb"),
        content: text("content").notNull(),
        snippet: text("snippet").notNull(),
        creator: text("creator"),
        hasRead: integer("hasRead", { mode: "boolean" })
            .notNull()
            .default(false),
        starred: integer("starred", { mode: "boolean" })
            .notNull()
            .default(false),
        hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
        notify: integer("notify", { mode: "boolean" }).notNull().default(false),
        serviceRef: text("serviceRef"),
    },
    table => [
        index("items_source_date").on(
            table.source,
            desc(table.date),
            desc(table._id)
        ),
        index("items_date").on(desc(table.date), desc(table._id)),
        index("items_source_guid")
            .on(table.source, table.guid)
            .where(sql`${table.guid} IS NOT NULL`),
        index("items_local_identity")
            .on(table.source, table.title, table.link, table.date)
            .where(sql`${table.serviceRef} IS NULL`),
        index("items_service_state")
            .on(table.serviceRef, table.hasRead, table.starred)
            .where(sql`${table.serviceRef} IS NOT NULL`),
        index("items_unread_date")
            .on(table.hasRead, desc(table.date), desc(table._id), table.source)
            .where(sql`${table.hasRead} = 0`),
        index("items_starred_date")
            .on(table.starred, desc(table.date), desc(table._id))
            .where(sql`${table.starred} = 1`),
    ]
)
