import { app, ipcMain, Menu, nativeTheme } from "electron"
import { ThemeSettings, SchemaTypes } from "./schema-types"
import { store } from "./main/settings"
import performUpdate from "./main/update-scripts"
import { WindowManager } from "./main/window"

if (!process.mas) {
    const locked = app.requestSingleInstanceLock()
    if (!locked) {
        app.quit()
    }
}

if (!app.isPackaged) app.setAppUserModelId(process.execPath)
else if (process.platform === "win32")
    app.setAppUserModelId("me.hyliu.fluentreader")

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
                {
                    label: "Hide",
                    accelerator: "Command+H",
                    click: () => {
                        app.hide()
                    },
                },
                {
                    label: "Quit",
                    accelerator: "Command+Q",
                    click: () => {
                        if (winManager.hasWindow) winManager.mainWindow.close()
                    },
                },
            ],
        },
        {
            label: "Edit",
            submenu: [
                {
                    label: "Undo",
                    accelerator: "CmdOrCtrl+Z",
                    selector: "undo:",
                },
                {
                    label: "Redo",
                    accelerator: "Shift+CmdOrCtrl+Z",
                    selector: "redo:",
                },
                { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
                {
                    label: "Copy",
                    accelerator: "CmdOrCtrl+C",
                    selector: "copy:",
                },
                {
                    label: "Paste",
                    accelerator: "CmdOrCtrl+V",
                    selector: "paste:",
                },
                {
                    label: "Select All",
                    accelerator: "CmdOrCtrl+A",
                    selector: "selectAll:",
                },
            ],
        },
        {
            label: "Window",
            submenu: [
                {
                    label: "Close",
                    accelerator: "Command+W",
                    click: () => {
                        if (winManager.hasWindow) winManager.mainWindow.close()
                    },
                },
                {
                    label: "Minimize",
                    accelerator: "Command+M",
                    click: () => {
                        if (winManager.hasWindow())
                            winManager.mainWindow.minimize()
                    },
                },
                { label: "Zoom", click: () => winManager.zoom() },
            ],
        },
    ]
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
} else {
    Menu.setApplicationMenu(null)
}

const winManager = new WindowManager()

app.on("window-all-closed", () => {
    if (winManager.hasWindow()) {
        winManager.mainWindow.webContents.session.clearStorageData({
            storages: ["cookies", "localstorage"],
        })
    }
    winManager.mainWindow = null
    if (restarting) {
        restarting = false
        winManager.createWindow()
    } else {
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
    setTimeout(
        () => {
            winManager.mainWindow.close()
        },
        process.platform === "darwin" ? 1000 : 0
    ) // Why ???
})
