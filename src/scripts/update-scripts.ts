import { app } from "electron"
import Store = require("electron-store")

export default function performUpdate(store: Store) {
    let version = store.get("version", null)
    let currentVersion = app.getVersion()

    if (version != currentVersion) {
        store.set("version", currentVersion)
    }
}