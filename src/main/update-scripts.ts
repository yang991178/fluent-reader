import { app } from "electron"
import Store from "electron-store"
import { SchemaTypes } from "../schema-types"

export default function performUpdate(store: Store<SchemaTypes>) {
    let version = store.get("version", null)
    let currentVersion = app.getVersion()
    if (version != currentVersion) {
        store.set("version", currentVersion)
    }
}
