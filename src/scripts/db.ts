import intl from "react-intl-universal"
import { RSSSource } from "./models/source"
import { SourceRule } from "./models/rule"
import { RSSItem } from "./models/item"
import lf from "lovefield"
import { Dexie, type EntityTable } from "dexie"

export interface SourceEntry {
    sid: number
    url: string
    iconurl?: string
    name: string
    openTarget: number
    lastFetched: Date
    serviceRef?: string
    fetchFrequency: number
    rules?: SourceRule[]
    textDir: number
    hidden: boolean
}

export const fluentDB = new Dexie("MainDB") as Dexie & {
    sources: EntityTable<SourceEntry, "sid">
}
fluentDB.version(1).stores({
    sources: `++sid, &url`,
})

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

export let itemsDB: lf.Database
export let items: lf.schema.Table

/**
 * Migrate old Lovefield Sources Database into the new MainDB Dexie DB.
 */
async function migrateLovefieldSourcesDB(dbName: string, version: number) {
    const databases = await indexedDB.databases()
    if (!databases.map(d => d.name).some(d => d === dbName)) {
        return
    }
    const request = indexedDB.open(dbName, version)
    request.onsuccess = () => {
        const db = request.result
        const transaction = db.transaction("sources")
        const store = transaction.objectStore("sources")
        const entryQuery = store.getAll()
        entryQuery.onsuccess = () => {
            const result = entryQuery.result
            const txFunc = async () => {
                for (const row of result) {
                    const source = row.value

                    // Skip entries that already exist.
                    const query = await fluentDB.sources
                        .where("url")
                        .equals(source.url)
                        .toArray()
                    if (query.length > 0) {
                        continue
                    }

                    const newEntry = {
                        sid: source.sid,
                        url: source.url,
                        iconurl: source.iconurl,
                        name: source.name,
                        openTarget: source.openTarget,
                        lastFetched: source.lastFetched,
                        serviceRef: source.serviceRef,
                        fetchFrequency: source.fetchFrequency,
                        rules: source.rules,
                        textDir: source.textDir,
                        hidden: source.hidden,
                    }
                    await fluentDB.sources.add(newEntry)
                }
            }
            fluentDB
                .transaction("rw", "sources", txFunc)
                .then(() => {
                    console.log(
                        `Successfully Migrated.` +
                            `Attempting to deleting old DB ${dbName}.`,
                    )
                    const deletion = indexedDB.deleteDatabase(dbName)
                    deletion.onsuccess = () => {
                        console.log(`Successfully deleted old DB ${dbName}`)
                    }
                    deletion.onerror = () => {
                        console.error(`Failed to delete old DB ${dbName}`)
                    }
                })
                .catch(error => console.error(error.inner))
        }
    }
}

export async function init() {
    migrateLovefieldSourcesDB("sourcesDB", 3)
    itemsDB = await idbSchema.connect()
    items = itemsDB.getSchema().table("items")
}
