import { ipcRenderer } from "electron"

export type DatabaseQuery = {
    sql: string
    params: unknown[]
    method: "run" | "all" | "values" | "get"
}

export type DatabaseResult = unknown[] | undefined

export type RestoreDialogTexts = {
    title: string
    message: string
    confirm: string
    cancel: string
}

const dbBridge = {
    execute: (
        sql: string,
        params: unknown[],
        method: DatabaseQuery["method"]
    ): Promise<DatabaseResult> =>
        ipcRenderer.invoke("db:execute", sql, params, method),

    batch: (queries: DatabaseQuery[]): Promise<DatabaseResult[]> =>
        ipcRenderer.invoke("db:batch", queries),

    exportAll: (): Promise<void> => ipcRenderer.invoke("db-export-all"),

    importAll: (texts: RestoreDialogTexts): Promise<boolean> =>
        ipcRenderer.invoke("db-import-all", texts),
}

declare global {
    interface Window {
        db: typeof dbBridge
    }
}

export default dbBridge
