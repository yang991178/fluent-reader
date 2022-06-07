import windowStateKeeper = require("electron-window-state")
import { BrowserWindow, nativeTheme, app } from "electron"
import path = require("path")
import { setThemeListener } from "./settings"
import { setUtilsListeners } from "./utils"

export class WindowManager {
    mainWindow: BrowserWindow = null
    private mainWindowState: windowStateKeeper.State

    constructor() {
        this.init()
    }

    private init = () => {
        app.on("ready", () => {
            this.mainWindowState = windowStateKeeper({
                defaultWidth: 1200,
                defaultHeight: 700,
            })
            this.setListeners()
            this.createWindow()
        })
    }

    private setListeners = () => {
        setThemeListener(this)
        setUtilsListeners(this)

        app.on("second-instance", () => {
            if (this.mainWindow !== null) {
                this.mainWindow.focus()
            }
        })

        app.on("activate", () => {
            if (this.mainWindow === null) {
                this.createWindow()
            }
        })
    }

    createWindow = () => {
        if (!this.hasWindow()) {
            this.mainWindow = new BrowserWindow({
                title: "Fluent Reader",
                backgroundColor:
                    process.platform === "darwin"
                        ? "#00000000"
                        : nativeTheme.shouldUseDarkColors
                        ? "#282828"
                        : "#faf9f8",
                vibrancy: "sidebar",
                x: this.mainWindowState.x,
                y: this.mainWindowState.y,
                width: this.mainWindowState.width,
                height: this.mainWindowState.height,
                minWidth: 992,
                minHeight: 600,
                frame: process.platform === "darwin",
                titleBarStyle: "hiddenInset",
                fullscreenable: process.platform === "darwin",
                show: false,
                webPreferences: {
                    webviewTag: true,
                    contextIsolation: true,
                    spellcheck: false,
                    preload: path.join(
                        app.getAppPath(),
                        (app.isPackaged ? "dist/" : "") + "preload.js"
                    ),
                },
            })
            this.mainWindowState.manage(this.mainWindow)
            this.mainWindow.on("ready-to-show", () => {
                this.mainWindow.show()
                this.mainWindow.focus()
                if (!app.isPackaged) this.mainWindow.webContents.openDevTools()
            })
            this.mainWindow.loadFile(
                (app.isPackaged ? "dist/" : "") + "index.html"
            )

            this.mainWindow.on("maximize", () => {
                this.mainWindow.webContents.send("maximized")
            })
            this.mainWindow.on("unmaximize", () => {
                this.mainWindow.webContents.send("unmaximized")
            })
            this.mainWindow.on("enter-full-screen", () => {
                this.mainWindow.webContents.send("enter-fullscreen")
            })
            this.mainWindow.on("leave-full-screen", () => {
                this.mainWindow.webContents.send("leave-fullscreen")
            })
            this.mainWindow.on("focus", () => {
                this.mainWindow.webContents.send("window-focus")
            })
            this.mainWindow.on("blur", () => {
                this.mainWindow.webContents.send("window-blur")
            })
            this.mainWindow.webContents.on("context-menu", (_, params) => {
                if (params.selectionText) {
                    this.mainWindow.webContents.send(
                        "window-context-menu",
                        [params.x, params.y],
                        params.selectionText
                    )
                }
            })
        }
    }

    zoom = () => {
        if (this.hasWindow()) {
            if (this.mainWindow.isMaximized()) {
                this.mainWindow.unmaximize()
            } else {
                this.mainWindow.maximize()
            }
        }
    }

    hasWindow = () => {
        return this.mainWindow !== null && !this.mainWindow.isDestroyed()
    }
}
