import intl from "react-intl-universal"
import Datastore from "nedb"
import lf from "lovefield"
import { RSSSource } from "./models/source"
import { RSSItem } from "./models/item"

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

export let sourcesDB: lf.Database
export let sources: lf.schema.Table
export let itemsDB: lf.Database
export let items: lf.schema.Table

async function onUpgradeSourceDB(rawDb: lf.raw.BackStore) {
    const version = rawDb.getVersion()
    if (version < 2) {
        await rawDb.addTableColumn("sources", "textDir", 0)
    }
    if (version < 3) {
        await rawDb.addTableColumn("sources", "hidden", false)
    }
}

export async function init() {
    sourcesDB = await sdbSchema.connect({ onUpgrade: onUpgradeSourceDB })
    sources = sourcesDB.getSchema().table("sources")
    itemsDB = await idbSchema.connect()
    items = itemsDB.getSchema().table("items")
    if (window.settings.getNeDBStatus()) {
        await migrateNeDB()
    }
}

async function migrateNeDB() {
    try {
        const sdb = new Datastore<RSSSource>({
            filename: "sources",
            autoload: true,
            onload: err => {
                if (err) window.console.log(err)
            },
        })
        const idb = new Datastore<RSSItem>({
            filename: "items",
            autoload: true,
            onload: err => {
                if (err) window.console.log(err)
            },
        })
        const sourceDocs = await new Promise<RSSSource[]>(resolve => {
            sdb.find({}, (_, docs) => {
                resolve(docs)
            })
        })
        const itemDocs = await new Promise<RSSItem[]>(resolve => {
            idb.find({}, (_, docs) => {
                resolve(docs)
            })
        })
        const sRows = sourceDocs.map(doc => {
            if (doc.serviceRef !== undefined)
                doc.serviceRef = String(doc.serviceRef)
            // @ts-ignore
            delete doc._id
            if (!doc.fetchFrequency) doc.fetchFrequency = 0
            doc.textDir = 0
            doc.hidden = false
            return sources.createRow(doc)
        })
        const iRows = itemDocs.map(doc => {
            if (doc.serviceRef !== undefined)
                doc.serviceRef = String(doc.serviceRef)
            if (!doc.title) doc.title = intl.get("article.untitled")
            if (!doc.content) doc.content = ""
            if (!doc.snippet) doc.snippet = ""
            delete doc._id
            doc.starred = Boolean(doc.starred)
            doc.hidden = Boolean(doc.hidden)
            doc.notify = Boolean(doc.notify)
            return items.createRow(doc)
        })
        await Promise.all([
            sourcesDB.insert().into(sources).values(sRows).exec(),
            itemsDB.insert().into(items).values(iRows).exec(),
        ])
        window.settings.setNeDBStatus(false)
        sdb.remove({}, { multi: true }, () => {
            sdb.persistence.compactDatafile()
        })
        idb.remove({}, { multi: true }, () => {
            idb.persistence.compactDatafile()
        })
    } catch (err) {
        window.utils.showErrorBox(
            "An error has occured during update. Please report this error on GitHub.",
            String(err)
        )
        window.utils.closeWindow()
    }
}
