import { app, ipcMain, BrowserWindow, Menu, nativeTheme } from "electron"
import windowStateKeeper = require("electron-window-state")
import { ThemeSettings } from "./schema-types"
import { store, setThemeListener } from "./main/settings"
import performUpdate from "./main/update-scripts"
import path = require("path")

if (!process.mas) {
    const locked = app.requestSingleInstanceLock()
    if (!locked) {
        app.quit()
    }
}

let mainWindow: BrowserWindow
let restarting: boolean

function init(setTheme = true) {
    restarting = false
    performUpdate(store)
    if (setTheme) nativeTheme.themeSource = store.get("theme", ThemeSettings.Default)
}

init()

function createWindow() {
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1200,
        defaultHeight: 700,
    })
    // Create the browser window.
    mainWindow = new BrowserWindow({
        title: "Fluent Reader",
        backgroundColor: process.platform === "darwin" ? "#00000000" : (nativeTheme.shouldUseDarkColors ? "#282828" : "#faf9f8"),
        vibrancy: "sidebar",
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 992,
        minHeight: 600,
        frame: process.platform === "darwin",
        titleBarStyle: "hiddenInset",
        fullscreenable: false,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true,
            enableRemoteModule: true,
            preload: path.join(app.getAppPath(), (app.isPackaged ? "dist/" : "") + "preload.js")
        }
    })
    mainWindowState.manage(mainWindow)
    mainWindow.on("ready-to-show", () => {
        mainWindow.show()
        mainWindow.focus()
        if (!app.isPackaged) mainWindow.webContents.openDevTools()
    })
    setThemeListener(mainWindow)
    // and load the index.html of the app.
    mainWindow.loadFile((app.isPackaged ? "dist/" : "") + "index.html", )
}

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

app.on("ready", createWindow)

app.on("second-instance", () => {
    if (mainWindow !== null) {
        mainWindow.focus()
    }
})

app.on("window-all-closed", function () {
    if (mainWindow) {
        mainWindow.webContents.session.clearStorageData({ storages: ["cookies"] })
    }
    mainWindow = null
    if (restarting) {
        init(false)
        createWindow()
    } else if (process.platform !== "darwin") {
        app.quit()
    }
})

app.on("activate", function () {
    if (mainWindow === null) {
        createWindow()
    }
})

ipcMain.on("restart", () => {
    restarting = true
    mainWindow.close()
})
