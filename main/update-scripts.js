"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
function performUpdate(store) {
    let version = store.get("version", null);
    let useNeDB = store.get("useNeDB", undefined);
    let currentVersion = electron_1.app.getVersion();
    if (useNeDB === undefined) {
        if (version !== null) {
            const revs = version.split(".").map(s => parseInt(s));
            store.set("useNeDB", (revs[0] === 0 && revs[1] < 8) || !electron_1.app.isPackaged);
        }
        else {
            store.set("useNeDB", false);
        }
    }
    if (version != currentVersion) {
        store.set("version", currentVersion);
    }
}
exports.default = performUpdate;
