import { ipcRenderer } from "electron"

export type DatabaseQuery = {
    sql: string
    params: unknown[]
    method: "run" | "all" | "values" | "get"
}

const dbBridge = {
    execute: (
        sql: string,
        params: unknown[],
        method: string
    ): Promise<unknown[]> =>
        ipcRenderer.invoke("db:execute", sql, params, method),

    batch: (queries: DatabaseQuery[]): Promise<unknown[][]> =>
        ipcRenderer.invoke("db:batch", queries),

    exportAll: (): Promise<void> => ipcRenderer.invoke("db-export-all"),

    importAll: (): Promise<boolean> => ipcRenderer.invoke("db-import-all"),
}

declare global {
    interface Window {
        db: typeof dbBridge
    }
}

export default dbBridge
