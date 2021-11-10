"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.items = exports.itemsDB = exports.sources = exports.sourcesDB = void 0;
const react_intl_universal_1 = __importDefault(require("react-intl-universal"));
const nedb_1 = __importDefault(require("nedb"));
const lovefield_1 = __importDefault(require("lovefield"));
const sdbSchema = lovefield_1.default.schema.create("sourcesDB", 1);
sdbSchema
    .createTable("sources")
    .addColumn("sid", lovefield_1.default.Type.INTEGER)
    .addPrimaryKey(["sid"], false)
    .addColumn("url", lovefield_1.default.Type.STRING)
    .addColumn("iconurl", lovefield_1.default.Type.STRING)
    .addColumn("name", lovefield_1.default.Type.STRING)
    .addColumn("openTarget", lovefield_1.default.Type.NUMBER)
    .addColumn("lastFetched", lovefield_1.default.Type.DATE_TIME)
    .addColumn("serviceRef", lovefield_1.default.Type.STRING)
    .addColumn("fetchFrequency", lovefield_1.default.Type.NUMBER)
    .addColumn("rules", lovefield_1.default.Type.OBJECT)
    .addNullable(["iconurl", "serviceRef", "rules"])
    .addIndex("idxURL", ["url"], true);
const idbSchema = lovefield_1.default.schema.create("itemsDB", 1);
idbSchema
    .createTable("items")
    .addColumn("_id", lovefield_1.default.Type.INTEGER)
    .addPrimaryKey(["_id"], true)
    .addColumn("source", lovefield_1.default.Type.INTEGER)
    .addColumn("title", lovefield_1.default.Type.STRING)
    .addColumn("link", lovefield_1.default.Type.STRING)
    .addColumn("date", lovefield_1.default.Type.DATE_TIME)
    .addColumn("fetchedDate", lovefield_1.default.Type.DATE_TIME)
    .addColumn("thumb", lovefield_1.default.Type.STRING)
    .addColumn("content", lovefield_1.default.Type.STRING)
    .addColumn("snippet", lovefield_1.default.Type.STRING)
    .addColumn("creator", lovefield_1.default.Type.STRING)
    .addColumn("hasRead", lovefield_1.default.Type.BOOLEAN)
    .addColumn("starred", lovefield_1.default.Type.BOOLEAN)
    .addColumn("hidden", lovefield_1.default.Type.BOOLEAN)
    .addColumn("notify", lovefield_1.default.Type.BOOLEAN)
    .addColumn("serviceRef", lovefield_1.default.Type.STRING)
    .addNullable(["thumb", "creator", "serviceRef"])
    .addIndex("idxDate", ["date"], false, lovefield_1.default.Order.DESC)
    .addIndex("idxService", ["serviceRef"], false);
async function init() {
    exports.sourcesDB = await sdbSchema.connect();
    exports.sources = exports.sourcesDB.getSchema().table("sources");
    exports.itemsDB = await idbSchema.connect();
    exports.items = exports.itemsDB.getSchema().table("items");
    if (window.settings.getNeDBStatus()) {
        await migrateNeDB();
    }
}
exports.init = init;
async function migrateNeDB() {
    try {
        const sdb = new nedb_1.default({
            filename: "sources",
            autoload: true,
            onload: err => {
                if (err)
                    window.console.log(err);
            },
        });
        const idb = new nedb_1.default({
            filename: "items",
            autoload: true,
            onload: err => {
                if (err)
                    window.console.log(err);
            },
        });
        const sourceDocs = await new Promise(resolve => {
            sdb.find({}, (_, docs) => {
                resolve(docs);
            });
        });
        const itemDocs = await new Promise(resolve => {
            idb.find({}, (_, docs) => {
                resolve(docs);
            });
        });
        const sRows = sourceDocs.map(doc => {
            if (doc.serviceRef !== undefined)
                doc.serviceRef = String(doc.serviceRef);
            // @ts-ignore
            delete doc._id;
            if (!doc.fetchFrequency)
                doc.fetchFrequency = 0;
            return exports.sources.createRow(doc);
        });
        const iRows = itemDocs.map(doc => {
            if (doc.serviceRef !== undefined)
                doc.serviceRef = String(doc.serviceRef);
            if (!doc.title)
                doc.title = react_intl_universal_1.default.get("article.untitled");
            if (!doc.content)
                doc.content = "";
            if (!doc.snippet)
                doc.snippet = "";
            delete doc._id;
            doc.starred = Boolean(doc.starred);
            doc.hidden = Boolean(doc.hidden);
            doc.notify = Boolean(doc.notify);
            return exports.items.createRow(doc);
        });
        await Promise.all([
            exports.sourcesDB.insert().into(exports.sources).values(sRows).exec(),
            exports.itemsDB.insert().into(exports.items).values(iRows).exec(),
        ]);
        window.settings.setNeDBStatus(false);
        sdb.remove({}, { multi: true }, () => {
            sdb.persistence.compactDatafile();
        });
        idb.remove({}, { multi: true }, () => {
            idb.persistence.compactDatafile();
        });
    }
    catch (err) {
        window.utils.showErrorBox("An error has occured during update. Please report this error on GitHub.", String(err));
        window.utils.closeWindow();
    }
}
