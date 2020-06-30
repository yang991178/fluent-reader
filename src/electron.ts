import { app, ipcMain, Menu, nativeTheme } from "electron"
import { ThemeSettings, SchemaTypes } from "./schema-types"
import { store } from "./main/settings"
import performUpdate from "./main/update-scripts"
import { WindowManager } from "./main/window"
import { openExternal } from "./main/utils"

if (!process.mas) {
    const locked = app.requestSingleInstanceLock()
    if (!locked) {
        app.quit()
    }
}

let restarting = false

function init() {
    performUpdate(store)
    nativeTheme.themeSource = store.get("theme", ThemeSettings.Default)
}

init()

if (process.platform === "darwin") {
    const template = [
        {
            label: "Application",
            submenu: [
                { label: "Quit", accelerator: "Command+Q", click: () => { app.quit() } }
            ]
        },
        {
            label: "Edit",
            submenu: [
                { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
                { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
                { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
                { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
                { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
            ]
        }
    ]
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
} else {
    Menu.setApplicationMenu(null)
}

const winManager = new WindowManager()

app.on("window-all-closed", () => {
    if (winManager.hasWindow()) {
        winManager.mainWindow.webContents.session.clearStorageData({ storages: ["cookies"] })
    }
    winManager.mainWindow = null
    if (restarting) {
        restarting = false
        winManager.createWindow()
    } else if (process.platform !== "darwin") {
        app.quit()
    }
})

ipcMain.handle("import-all-settings", (_, configs: SchemaTypes) => {
    restarting = true
    store.clear()
    for (let [key, value] of Object.entries(configs)) {
        // @ts-ignore
        store.set(key, value)
    }
    performUpdate(store)
    nativeTheme.themeSource = store.get("theme", ThemeSettings.Default)
    winManager.mainWindow.close()
})

app.on("web-contents-created", (_, contents) => {
    contents.on("new-window", (event, url) => {
        if (winManager.hasWindow()) event.preventDefault()
        if (contents.getType() === "webview") openExternal(url)
    })
    contents.on("will-navigate", (event, url) => {
        event.preventDefault()
        if (contents.getType() === "webview") openExternal(url)
    })
})
