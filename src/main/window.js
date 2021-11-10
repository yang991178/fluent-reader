"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowManager = void 0;
const windowStateKeeper = require("electron-window-state");
const electron_1 = require("electron");
const path = require("path");
const settings_1 = require("./settings");
const utils_1 = require("./utils");
class WindowManager {
    constructor() {
        this.mainWindow = null;
        this.init = () => {
            electron_1.app.on("ready", () => {
                this.mainWindowState = windowStateKeeper({
                    defaultWidth: 1200,
                    defaultHeight: 700,
                });
                this.setListeners();
                this.createWindow();
            });
        };
        this.setListeners = () => {
            (0, settings_1.setThemeListener)(this);
            (0, utils_1.setUtilsListeners)(this);
            electron_1.app.on("second-instance", () => {
                if (this.mainWindow !== null) {
                    this.mainWindow.focus();
                }
            });
            electron_1.app.on("activate", () => {
                if (this.mainWindow === null) {
                    this.createWindow();
                }
            });
        };
        this.createWindow = () => {
            if (!this.hasWindow()) {
                this.mainWindow = new electron_1.BrowserWindow({
                    title: "Fluent Reader",
                    backgroundColor: process.platform === "darwin"
                        ? "#00000000"
                        : electron_1.nativeTheme.shouldUseDarkColors
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
                        enableRemoteModule: false,
                        contextIsolation: true,
                        worldSafeExecuteJavaScript: true,
                        spellcheck: false,
                        preload: path.join(electron_1.app.getAppPath(), (electron_1.app.isPackaged ? "dist/" : "") + "preload.js"),
                    },
                });
                this.mainWindowState.manage(this.mainWindow);
                this.mainWindow.on("ready-to-show", () => {
                    this.mainWindow.show();
                    this.mainWindow.focus();
                    if (!electron_1.app.isPackaged)
                        this.mainWindow.webContents.openDevTools();
                });
                this.mainWindow.loadFile((electron_1.app.isPackaged ? "dist/" : "") + "index.html");
                this.mainWindow.on("maximize", () => {
                    this.mainWindow.webContents.send("maximized");
                });
                this.mainWindow.on("unmaximize", () => {
                    this.mainWindow.webContents.send("unmaximized");
                });
                this.mainWindow.on("enter-full-screen", () => {
                    this.mainWindow.webContents.send("enter-fullscreen");
                });
                this.mainWindow.on("leave-full-screen", () => {
                    this.mainWindow.webContents.send("leave-fullscreen");
                });
                this.mainWindow.on("focus", () => {
                    this.mainWindow.webContents.send("window-focus");
                });
                this.mainWindow.on("blur", () => {
                    this.mainWindow.webContents.send("window-blur");
                });
                this.mainWindow.webContents.on("context-menu", (_, params) => {
                    if (params.selectionText) {
                        this.mainWindow.webContents.send("window-context-menu", [params.x, params.y], params.selectionText);
                    }
                });
            }
        };
        this.zoom = () => {
            if (this.hasWindow()) {
                if (this.mainWindow.isMaximized()) {
                    this.mainWindow.unmaximize();
                }
                else {
                    this.mainWindow.maximize();
                }
            }
        };
        this.hasWindow = () => {
            return this.mainWindow !== null && !this.mainWindow.isDestroyed();
        };
        this.init();
    }
}
exports.WindowManager = WindowManager;
