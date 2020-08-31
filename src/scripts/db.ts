import Datastore from "nedb"
import lf from "lovefield"
import { RSSSource } from "./models/source"
import { RSSItem } from "./models/item"

const sdbSchema = lf.schema.create("sourcesDB", 1)
sdbSchema.createTable("sources").
    addColumn("sid", lf.Type.INTEGER).addPrimaryKey(["sid"], false).
    addColumn("url", lf.Type.STRING).
    addColumn("iconurl", lf.Type.STRING).
    addColumn("name", lf.Type.STRING).
    addColumn("openTarget", lf.Type.NUMBER).
    addColumn("lastFetched", lf.Type.DATE_TIME).
    addColumn("serviceRef", lf.Type.NUMBER).
    addColumn("fetchFrequency", lf.Type.NUMBER).
    addColumn("rules", lf.Type.OBJECT).
    addNullable(["iconurl", "serviceRef", "rules"]).
    addIndex("idxURL", ["url"], true)

const idbSchema = lf.schema.create("itemsDB", 1)
idbSchema.createTable("items").
    addColumn("_id", lf.Type.INTEGER).addPrimaryKey(["_id"], true).
    addColumn("source", lf.Type.INTEGER).
    addColumn("title", lf.Type.STRING).
    addColumn("link", lf.Type.STRING).
    addColumn("date", lf.Type.DATE_TIME).
    addColumn("fetchedDate", lf.Type.DATE_TIME).
    addColumn("thumb", lf.Type.STRING).
    addColumn("content", lf.Type.STRING).
    addColumn("snippet", lf.Type.STRING).
    addColumn("creator", lf.Type.STRING).
    addColumn("hasRead", lf.Type.BOOLEAN).
    addColumn("starred", lf.Type.BOOLEAN).
    addColumn("hidden", lf.Type.BOOLEAN).
    addColumn("notify", lf.Type.BOOLEAN).
    addColumn("serviceRef", lf.Type.NUMBER).
    addNullable(["thumb", "creator", "serviceRef"]).
    addIndex("idxDate", ["date"], false, lf.Order.DESC)

export const idb = new Datastore<RSSItem>({
    filename: "items",
    autoload: true,
    onload: (err) => {
        if (err) window.console.log(err)
    }
})
idb.ensureIndex({ fieldName: "source" })
//idb.removeIndex("id")
//idb.update({}, {$unset: {id: true}}, {multi: true})
//idb.remove({}, { multi: true })
export let sourcesDB: lf.Database
export let sources: lf.schema.Table
export let itemsDB: lf.Database
export let items: lf.schema.Table

export async function init() {
    sourcesDB = await sdbSchema.connect()
    sources = sourcesDB.getSchema().table("sources")
    itemsDB = await idbSchema.connect()
    items = itemsDB.getSchema().table("items")
    if (window.settings.getNeDBStatus()) {
        const sdb = new Datastore<RSSSource>({
            filename: "sources",
            autoload: true,
            onload: (err) => {
                if (err) window.console.log(err)
            }
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
            //doc.serviceRef = String(doc.serviceRef)
            // @ts-ignore
            delete doc._id
            if (!doc.fetchFrequency) doc.fetchFrequency = 0
            return sources.createRow(doc)
        })
        const iRows = itemDocs.map(doc => {
            //doc.serviceRef = String(doc.serviceRef)
            delete doc._id
            doc.starred = Boolean(doc.starred)
            doc.hidden = Boolean(doc.hidden)
            doc.notify = Boolean(doc.notify)
            return items.createRow(doc)
        })
        await Promise.all([
            sourcesDB.insert().into(sources).values(sRows).exec(),
            itemsDB.insert().into(items).values(iRows).exec()
        ])
        window.settings.setNeDBStatus()
    }
}
