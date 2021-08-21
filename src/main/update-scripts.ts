import { app } from "electron"
import Store = require("electron-store")
import { SchemaTypes } from "../schema-types"

export default function performUpdate(store: Store<SchemaTypes>) {
    let version = store.get("version", null)
    let useNeDB = store.get("useNeDB", undefined)
    let currentVersion = app.getVersion()

    if (useNeDB === undefined) {
        if (version !== null) {
            const revs = version.split(".").map(s => parseInt(s))
            store.set(
                "useNeDB",
                (revs[0] === 0 && revs[1] < 8) || !app.isPackaged
            )
        } else {
            store.set("useNeDB", false)
        }
    }
    if (version != currentVersion) {
        store.set("version", currentVersion)
    }
}
