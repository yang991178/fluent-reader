import { ipcRenderer } from "electron"

const dbBridge = {
    execute: (
        sql: string,
        params: unknown[],
        method: string
    ): Promise<unknown[]> =>
        ipcRenderer.invoke("db:execute", sql, params, method),

    exportAll: (): Promise<void> => ipcRenderer.invoke("db-export-all"),

    importAll: (): Promise<boolean> => ipcRenderer.invoke("db-import-all"),
}

declare global {
    interface Window {
        db: typeof dbBridge
    }
}

export default dbBridge
