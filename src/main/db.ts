import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { app, ipcMain, dialog, nativeTheme } from "electron"
import * as fs from "node:fs"
import * as path from "node:path"
import type Store from "electron-store"
import type { SchemaTypes, StoredRules } from "../schema-types"
import { ThemeSettings } from "../schema-types"
import { sourcesTable, itemsTable } from "../db/schema"
import * as schema from "../db/schema"
import { WindowManager } from "./window"
import performUpdate from "./update-scripts"
import { transformLovefieldRules } from "./utils"
import { getValidDate } from "../scripts/date"
import type {
    DatabaseQuery,
    DatabaseResult,
    RestoreDialogTexts,
} from "../bridges/db"

let sqlite: Database.Database
let db: ReturnType<typeof drizzle>
let storeRef: Store<SchemaTypes>
let managerRef: WindowManager
let restartFn: () => void

function optimizeDB() {
    try {
        sqlite.pragma("optimize")
    } catch (err) {
        // Statistics maintenance must not turn a committed write into a failure.
        console.warn("SQLite optimize error:", err)
    }
}

async function handleExportAll() {
    if (!managerRef.hasWindow()) return
    const result = await dialog.showSaveDialog(managerRef.mainWindow, {
        defaultPath: "Fluent_Reader_Backup.frdata",
        filters: [{ name: "Fluent Reader Data", extensions: ["frdata"] }],
    })
    if (result.canceled) return
    try {
        const sources = db.select().from(sourcesTable).all()
        const items = db.select().from(itemsTable).all()
        const output = {
            ...storeRef.store,
            sqlite: { sources, items },
        }
        fs.writeFileSync(result.filePath, JSON.stringify(output))
    } catch (err) {
        dialog.showErrorBox("Export Error", String(err))
    }
}

async function handleImportAll(texts: RestoreDialogTexts): Promise<boolean> {
    if (!managerRef.hasWindow()) return true
    const openResult = await dialog.showOpenDialog(managerRef.mainWindow, {
        filters: [
            { name: "Fluent Reader Data", extensions: ["frdata", "json"] },
        ],
        properties: ["openFile"],
    })
    if (openResult.canceled || openResult.filePaths.length === 0) return true

    let configs: Record<string, unknown>
    try {
        const data = fs.readFileSync(openResult.filePaths[0], "utf-8")
        configs = JSON.parse(data)
        if (!configs || typeof configs !== "object" || Array.isArray(configs))
            throw new Error("Unrecognized backup format.")
    } catch (err) {
        dialog.showErrorBox("Import Error", String(err))
        return true
    }

    const confirmed = await dialog.showMessageBox(managerRef.mainWindow, {
        type: "warning",
        title: texts.title,
        message: texts.title,
        detail: texts.message,
        buttons: [texts.cancel, texts.confirm],
        defaultId: 0,
        cancelId: 0,
    })
    if (confirmed.response !== 1) return true

    type InsertSource = typeof sourcesTable.$inferInsert
    type InsertItem = typeof itemsTable.$inferInsert

    let typedSources: InsertSource[] = []
    let typedItems: InsertItem[] = []
    let storedRules: StoredRules = {}
    const restoreDate = new Date()

    const mapSource = (s: Record<string, unknown>): InsertSource => ({
        sid: s.sid as number,
        url: s.url as string,
        iconurl: (s.iconurl as string) || null,
        name: s.name as string,
        openTarget: (s.openTarget as number) || 0,
        lastFetched: getValidDate(s.lastFetched, new Date(0)),
        serviceRef: (s.serviceRef as string) || null,
        fetchFrequency: (s.fetchFrequency as number) || 0,
        textDir: (s.textDir as number) || 0,
        hidden: Boolean(s.hidden),
    })

    const mapItem = (i: Record<string, unknown>): InsertItem => {
        const fetchedDate = getValidDate(i.fetchedDate, i.date, restoreDate)
        return {
            _id: i._id as number,
            source: i.source as number,
            guid: typeof i.guid === "string" && i.guid.trim() ? i.guid : null,
            title: (i.title as string) || "",
            link: (i.link as string) || "",
            date: getValidDate(i.date, fetchedDate),
            fetchedDate,
            thumb: (i.thumb as string) || null,
            content: (i.content as string) || "",
            snippet: (i.snippet as string) || "",
            creator: (i.creator as string) || null,
            hasRead: Boolean(i.hasRead),
            starred: Boolean(i.starred),
            hidden: Boolean(i.hidden),
            notify: Boolean(i.notify),
            serviceRef: (i.serviceRef as string) || null,
        }
    }

    try {
        if (configs.sqlite) {
            const sqliteData = configs.sqlite as {
                sources?: Record<string, unknown>[]
                items?: Record<string, unknown>[]
            }
            typedSources = (sqliteData.sources || []).map(mapSource)
            typedItems = (sqliteData.items || []).map(mapItem)
            storedRules = (configs.sourceRules as StoredRules) || {}
        } else if (configs.lovefield) {
            const lfData = configs.lovefield as {
                sources?: Record<string, unknown>[]
                items?: Record<string, unknown>[]
            }
            const rawSources = lfData.sources || []
            typedSources = rawSources.map(mapSource)
            typedItems = (lfData.items || []).map(mapItem)

            storedRules = transformLovefieldRules(rawSources)
        } else {
            dialog.showErrorBox("Import Error", "Unrecognized backup format.")
            return true
        }

        db.transaction(tx => {
            tx.delete(itemsTable).run()
            tx.delete(sourcesTable).run()
            for (let i = 0; i < typedSources.length; i += 50) {
                tx.insert(sourcesTable)
                    .values(typedSources.slice(i, i + 50))
                    .run()
            }
            for (let i = 0; i < typedItems.length; i += 50) {
                tx.insert(itemsTable)
                    .values(typedItems.slice(i, i + 50))
                    .run()
            }
        })
        optimizeDB()
    } catch (err) {
        dialog.showErrorBox("Import Error", String(err))
        return true
    }

    storeRef.clear()
    for (const [key, value] of Object.entries(configs)) {
        if (["lovefield", "sqlite", "nedb", "useNeDB"].includes(key)) continue
        storeRef.set(
            key as keyof SchemaTypes,
            value as SchemaTypes[keyof SchemaTypes]
        )
    }
    storeRef.set("dbVersion" as keyof SchemaTypes, "sqlite")
    storeRef.set("sourceRules", storedRules)

    performUpdate(storeRef)
    nativeTheme.themeSource = storeRef.get("theme", ThemeSettings.Default)

    restartFn()
    return false
}

export function initDB(
    store: Store<SchemaTypes>,
    manager: WindowManager,
    restart: () => void
): void {
    storeRef = store
    managerRef = manager
    restartFn = restart

    const dbPath = path.join(path.dirname(store.path), "fluent-reader.db")

    sqlite = new Database(dbPath)

    // Register custom regex functions for SQLite queries
    sqlite.function(
        "regexp",
        { deterministic: true },
        (pattern: string, value: string) => {
            try {
                return Number(new RegExp(pattern).test(value ?? ""))
            } catch {
                return 0
            }
        }
    )
    sqlite.function(
        "regexpi",
        { deterministic: true },
        (pattern: string, value: string) => {
            try {
                return Number(new RegExp(pattern, "i").test(value ?? ""))
            } catch {
                return 0
            }
        }
    )

    db = drizzle(sqlite, { schema })

    // Electron's fs APIs can read migrations directly from app.asar.
    const migrationsFolder = path.join(__dirname, "drizzle")

    migrate(db, { migrationsFolder })
    // Include all tables on opening this long-lived connection, then maintain
    // statistics after bulk writes, daily, and on an orderly shutdown.
    try {
        sqlite.pragma("optimize=0x10002")
    } catch (err) {
        console.warn("SQLite optimize error:", err)
    }
    const optimizeTimer = setInterval(optimizeDB, 24 * 60 * 60 * 1000)
    optimizeTimer.unref()
    app.once("will-quit", () => {
        clearInterval(optimizeTimer)
        optimizeDB()
    })

    const executeQuery = ({
        sql,
        params,
        method,
    }: DatabaseQuery): DatabaseResult => {
        const stmt = sqlite.prepare(sql)
        if (method === "run") {
            const result = stmt.run(params)
            return [result.changes, Number(result.lastInsertRowid)]
        }
        const convert = (row: unknown[]) =>
            row?.map(value =>
                typeof value === "bigint" ? Number(value) : value
            )
        // Drizzle maps columns positionally. Object rows lose duplicate names
        // and reorder numeric aliases; raw rows preserve the actual SQL order.
        stmt.raw()
        if (method === "get") return convert(stmt.get(params) as unknown[])
        return (stmt.all(params) as unknown[][]).map(convert)
    }

    ipcMain.handle(
        "db:execute",
        (
            _,
            sql: string,
            params: unknown[],
            method: "run" | "all" | "values" | "get"
        ) => {
            try {
                return executeQuery({ sql, params, method })
            } catch (err) {
                console.error("db:execute error:", err)
                throw err
            }
        }
    )

    // Keep the entire batch atomic without interleaving other renderer queries.
    const executeBatch = sqlite.transaction((queries: DatabaseQuery[]) =>
        queries.map(executeQuery)
    )
    ipcMain.handle("db:batch", (_, queries: DatabaseQuery[]) => {
        try {
            const results = executeBatch(queries)
            optimizeDB()
            return results
        } catch (err) {
            console.error("db:batch error:", err)
            throw err
        }
    })

    ipcMain.handle("db-export-all", handleExportAll)
    ipcMain.handle("db-import-all", (_, texts: RestoreDialogTexts) =>
        handleImportAll(texts)
    )
}
