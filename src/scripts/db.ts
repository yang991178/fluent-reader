import Datastore = require("nedb")
import { RSSSource } from "./models/source"
import { RSSItem } from "./models/item"

export const sdb = new Datastore<RSSSource>({
    filename: "sources",
    autoload: true,
    onload: (err) => {
        if (err) window.console.log(err)
    }
})
sdb.ensureIndex({ fieldName: "sid", unique: true })
sdb.ensureIndex({ fieldName: "url", unique: true })
//sdb.remove({}, { multi: true })

export const idb = new Datastore<RSSItem>({
    filename: "items",
    autoload: true,
    onload: (err) => {
        if (err) window.console.log(err)
    }
})
idb.removeIndex("id")
idb.update({}, {$unset: {id: true}}, {multi: true})
//idb.remove({}, { multi: true })