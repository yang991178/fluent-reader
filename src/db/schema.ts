import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

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

export const itemsTable = sqliteTable("items", {
    _id: integer("_id").primaryKey({ autoIncrement: true }),
    source: integer("source").notNull(),
    title: text("title").notNull(),
    link: text("link").notNull(),
    date: integer("date", { mode: "timestamp_ms" }).notNull(),
    fetchedDate: integer("fetchedDate", { mode: "timestamp_ms" }).notNull(),
    thumb: text("thumb"),
    content: text("content").notNull(),
    snippet: text("snippet").notNull(),
    creator: text("creator"),
    hasRead: integer("hasRead", { mode: "boolean" }).notNull().default(false),
    starred: integer("starred", { mode: "boolean" }).notNull().default(false),
    hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
    notify: integer("notify", { mode: "boolean" }).notNull().default(false),
    serviceRef: text("serviceRef"),
})
