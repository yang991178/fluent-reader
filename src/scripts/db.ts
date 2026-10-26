import lf from "lovefield"
import { drizzle } from "drizzle-orm/sqlite-proxy"
import { sourcesTable, itemsTable } from "../db/schema"
import { getValidDate } from "./date"

export { itemsTable, sourcesTable } from "../db/schema"

export const database = drizzle(
    async (sql, params, method) => {
        const rows = await globalThis.db.execute(sql, params, method)
        return { rows: rows as unknown[][] }
    },
    async queries => {
        const results = await globalThis.db.batch(queries)
        return results.map(rows => ({ rows: rows as unknown[][] }))
    },
    { schema: { sourcesTable, itemsTable } }
)

const sdbSchema = lf.schema.create("sourcesDB", 3)
sdbSchema
    .createTable("sources")
    .addColumn("sid", lf.Type.INTEGER)
    .addPrimaryKey(["sid"], false)
    .addColumn("url", lf.Type.STRING)
    .addColumn("iconurl", lf.Type.STRING)
    .addColumn("name", lf.Type.STRING)
    .addColumn("openTarget", lf.Type.NUMBER)
    .addColumn("lastFetched", lf.Type.DATE_TIME)
    .addColumn("serviceRef", lf.Type.STRING)
    .addColumn("fetchFrequency", lf.Type.NUMBER)
    .addColumn("rules", lf.Type.OBJECT)
    .addColumn("textDir", lf.Type.NUMBER)
    .addColumn("hidden", lf.Type.BOOLEAN)
    .addNullable(["iconurl", "serviceRef", "rules"])
    .addIndex("idxURL", ["url"], true)

const idbSchema = lf.schema.create("itemsDB", 1)
idbSchema
    .createTable("items")
    .addColumn("_id", lf.Type.INTEGER)
    .addPrimaryKey(["_id"], true)
    .addColumn("source", lf.Type.INTEGER)
    .addColumn("title", lf.Type.STRING)
    .addColumn("link", lf.Type.STRING)
    .addColumn("date", lf.Type.DATE_TIME)
    .addColumn("fetchedDate", lf.Type.DATE_TIME)
    .addColumn("thumb", lf.Type.STRING)
    .addColumn("content", lf.Type.STRING)
    .addColumn("snippet", lf.Type.STRING)
    .addColumn("creator", lf.Type.STRING)
    .addColumn("hasRead", lf.Type.BOOLEAN)
    .addColumn("starred", lf.Type.BOOLEAN)
    .addColumn("hidden", lf.Type.BOOLEAN)
    .addColumn("notify", lf.Type.BOOLEAN)
    .addColumn("serviceRef", lf.Type.STRING)
    .addNullable(["thumb", "creator", "serviceRef"])
    .addIndex("idxDate", ["date"], false, lf.Order.DESC)
    .addIndex("idxService", ["serviceRef"], false)

// Lovefield uses Closure promises. Attach rejection handlers immediately so an
// early failure is handled before native await adopts the promise.
function asNativePromise<T>(promise: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        promise.then(resolve, reject)
    })
}

async function onUpgradeSourceDB(rawDb: lf.raw.BackStore) {
    const version = rawDb.getVersion()
    if (version < 2) {
        await asNativePromise(rawDb.addTableColumn("sources", "textDir", 0))
    }
    if (version < 3) {
        await asNativePromise(rawDb.addTableColumn("sources", "hidden", false))
    }
}

const MIGRATION_BATCH = 50

export async function init() {
    if (globalThis.settings.getDBVersion() === "sqlite") return

    let sourcesDB: lf.Database
    let itemsDB: lf.Database
    try {
        // One-time migration from Lovefield → SQLite
        sourcesDB = await asNativePromise(
            sdbSchema.connect({ onUpgrade: onUpgradeSourceDB })
        )
        const sources = sourcesDB.getSchema().table("sources")
        itemsDB = await asNativePromise(idbSchema.connect())
        const items = itemsDB.getSchema().table("items")
        const migrationDate = new Date()
        const sourcesData = (await asNativePromise(
            sourcesDB.select().from(sources).exec()
        )) as Record<string, unknown>[]
        const itemsData = (await asNativePromise(
            itemsDB.select().from(items).exec()
        )) as Record<string, unknown>[]

        const sourcesForDB = sourcesData.map(source => {
            return {
                sid: source.sid as number,
                url: source.url as string,
                iconurl: (source.iconurl as string) || null,
                name: source.name as string,
                openTarget: (source.openTarget as number) || 0,
                // An unknown fetch time should leave the source due for refresh.
                lastFetched: getValidDate(source.lastFetched, new Date(0)),
                serviceRef: (source.serviceRef as string) || null,
                fetchFrequency: (source.fetchFrequency as number) || 0,
                textDir: (source.textDir as number) || 0,
                hidden: (source.hidden as boolean) || false,
            }
        })

        // Roll back failed batches. Conflict handling also recovers old partial
        // migrations and a crash between the commit and saving dbVersion.
        await database.transaction(async tx => {
            for (let i = 0; i < sourcesForDB.length; i += MIGRATION_BATCH) {
                await tx
                    .insert(sourcesTable)
                    .values(sourcesForDB.slice(i, i + MIGRATION_BATCH))
                    .onConflictDoNothing({ target: sourcesTable.sid })
            }
            for (let i = 0; i < itemsData.length; i += MIGRATION_BATCH) {
                const chunk = itemsData.slice(i, i + MIGRATION_BATCH)
                await tx
                    .insert(itemsTable)
                    .values(
                        chunk.map(item => {
                            // Lovefield could persist invalid dates from feeds.
                            const fetchedDate = getValidDate(
                                item.fetchedDate,
                                item.date,
                                migrationDate
                            )
                            return {
                                _id: item._id as number,
                                source: item.source as number,
                                title: (item.title as string) || "",
                                link: (item.link as string) || "",
                                date: getValidDate(item.date, fetchedDate),
                                fetchedDate,
                                thumb: (item.thumb as string) || null,
                                content: (item.content as string) || "",
                                snippet: (item.snippet as string) || "",
                                creator: (item.creator as string) || null,
                                hasRead: (item.hasRead as boolean) || false,
                                starred: (item.starred as boolean) || false,
                                hidden: (item.hidden as boolean) || false,
                                notify: (item.notify as boolean) || false,
                                serviceRef: (item.serviceRef as string) || null,
                            }
                        })
                    )
                    .onConflictDoNothing({ target: itemsTable._id })
            }
        })

        await globalThis.settings.migrateLovefieldRules(sourcesData)
        await globalThis.settings.setDBVersion("sqlite")
    } finally {
        sourcesDB?.close()
        itemsDB?.close()
    }

    // Delete legacy data only after the migration and its completion marker succeed.
    globalThis.indexedDB.deleteDatabase("sourcesDB")
    globalThis.indexedDB.deleteDatabase("itemsDB")
}
