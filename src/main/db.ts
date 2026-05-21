import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { migrate } from "drizzle-orm/better-sqlite3/migrator"
import { ipcMain, app, dialog, nativeTheme } from "electron"
import * as fs from "node:fs"
import * as path from "node:path"
import type Store from "electron-store"
import type { SchemaTypes, StoredRule } from "../schema-types"
import { ThemeSettings } from "../schema-types"
import { sourcesTable, itemsTable } from "../db/schema"
import * as schema from "../db/schema"
import { WindowManager } from "./window"
import performUpdate from "./update-scripts"

let sqlite: Database.Database
let db: ReturnType<typeof drizzle>
let storeRef: Store<SchemaTypes>
let managerRef: WindowManager
let restartFn: () => void

function toDrizzleResult(
    rows: Record<string, unknown> | Record<string, unknown>[]
): unknown[] {
    if (!rows) return []
    const convertValue = (v: unknown) => (typeof v === "bigint" ? Number(v) : v)
    if (Array.isArray(rows)) {
        return rows.map(row =>
            Object.values(row).map(convertValue)
        )
    } else {
        return Object.values(rows).map(convertValue)
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

function normDateToMs(v: unknown): number {
    if (typeof v === "number") return v
    if (v instanceof Date) return v.getTime()
    return new Date(v as string).getTime()
}

async function handleImportAll(): Promise<boolean> {
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
    } catch (err) {
        dialog.showErrorBox("Import Error", String(err))
        return true
    }

    const confirmed = await dialog.showMessageBox(managerRef.mainWindow, {
        type: "warning",
        message: "Restore from backup",
        detail: "This will overwrite all current data. Continue?",
        buttons: ["Cancel", "Restore"],
        defaultId: 0,
        cancelId: 0,
    })
    if (confirmed.response !== 1) return true

    type InsertSource = typeof sourcesTable.$inferInsert
    type InsertItem = typeof itemsTable.$inferInsert

    let typedSources: InsertSource[] = []
    let typedItems: InsertItem[] = []
    let storedRules: StoredRule[] = []

    const mapSource = (s: Record<string, unknown>): InsertSource => ({
        sid: s.sid as number,
        url: s.url as string,
        iconurl: (s.iconurl as string) || null,
        name: s.name as string,
        openTarget: (s.openTarget as number) || 0,
        lastFetched: new Date(normDateToMs(s.lastFetched)),
        serviceRef: (s.serviceRef as string) || null,
        fetchFrequency: (s.fetchFrequency as number) || 0,
        textDir: (s.textDir as number) || 0,
        hidden: Boolean(s.hidden),
    })

    const mapItem = (i: Record<string, unknown>): InsertItem => ({
        _id: i._id as number,
        source: i.source as number,
        title: (i.title as string) || "",
        link: (i.link as string) || "",
        date: new Date(normDateToMs(i.date)),
        fetchedDate: new Date(normDateToMs(i.fetchedDate)),
        thumb: (i.thumb as string) || null,
        content: (i.content as string) || "",
        snippet: (i.snippet as string) || "",
        creator: (i.creator as string) || null,
        hasRead: Boolean(i.hasRead),
        starred: Boolean(i.starred),
        hidden: Boolean(i.hidden),
        notify: Boolean(i.notify),
        serviceRef: (i.serviceRef as string) || null,
    })

    if (configs.sqlite) {
        const sqliteData = configs.sqlite as {
            sources?: Record<string, unknown>[]
            items?: Record<string, unknown>[]
        }
        typedSources = (sqliteData.sources || []).map(mapSource)
        typedItems = (sqliteData.items || []).map(mapItem)
        storedRules = (configs.sourceRules as StoredRule[]) || []
    } else if (configs.lovefield) {
        const lfData = configs.lovefield as {
            sources?: Record<string, unknown>[]
            items?: Record<string, unknown>[]
        }
        const rawSources = lfData.sources || []
        typedSources = rawSources.map(mapSource)
        typedItems = (lfData.items || []).map(mapItem)

        for (const source of rawSources) {
            const rules = source.rules as Record<string, unknown>[] | undefined
            if (rules && Array.isArray(rules)) {
                rules.forEach((rule, idx) => {
                    const filter = rule.filter as Record<string, unknown>
                    const actions = rule.actions as Record<string, boolean>
                    storedRules.push({
                        id: `${source.sid as number}-${idx}`,
                        target: { type: "source", sid: source.sid as number },
                        filter: (filter?.type as number) ?? 0,
                        search: (filter?.search as string) ?? "",
                        match: rule.match as boolean,
                        actions: Object.entries(actions || {}).map(
                            ([t, f]) => `${t}-${f}`
                        ),
                    })
                })
            }
        }
    } else {
        dialog.showErrorBox("Import Error", "Unrecognized backup format.")
        return true
    }

    try {
        db.transaction(tx => {
            tx.delete(itemsTable)
            tx.delete(sourcesTable)
            if (typedSources.length > 0) tx.insert(sourcesTable).values(typedSources)
            if (typedItems.length > 0) tx.insert(itemsTable).values(typedItems)
        })
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
    storeRef.set("sourceRules" as keyof SchemaTypes, storedRules)

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

    const migrationsFolder = app.isPackaged
        ? path.join(
              process.resourcesPath,
              "app.asar.unpacked",
              "dist",
              "drizzle"
          )
        : path.join(__dirname, "drizzle")

    migrate(db, { migrationsFolder })

    ipcMain.handle(
        "db:execute",
        (
            _,
            sql: string,
            params: unknown[],
            method: "run" | "all" | "values" | "get"
        ) => {
            try {
                const stmt = sqlite.prepare(sql)
                const result = stmt[method](...params) as
                    | Record<string, unknown>
                    | Record<string, unknown>[]
                return toDrizzleResult(result)
            } catch (err) {
                console.error("db:execute error:", err)
                throw err
            }
        }
    )

    ipcMain.handle("db-export-all", handleExportAll)
    ipcMain.handle("db-import-all", handleImportAll)
}
