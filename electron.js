"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const settings_1 = require("./main/settings");
const update_scripts_1 = __importDefault(require("./main/update-scripts"));
const window_1 = require("./main/window");
if (!process.mas) {
    const locked = electron_1.app.requestSingleInstanceLock();
    if (!locked) {
        electron_1.app.quit();
    }
}
if (!electron_1.app.isPackaged)
    electron_1.app.setAppUserModelId(process.execPath);
else if (process.platform === "win32")
    electron_1.app.setAppUserModelId("me.hyliu.fluentreader");
let restarting = false;
function init() {
    (0, update_scripts_1.default)(settings_1.store);
    electron_1.nativeTheme.themeSource = settings_1.store.get("theme", "system" /* Default */);
}
init();
if (process.platform === "darwin") {
    const template = [
        {
            label: "Application",
            submenu: [
                {
                    label: "Hide",
                    accelerator: "Command+H",
                    click: () => {
                        electron_1.app.hide();
                    },
                },
                {
                    label: "Quit",
                    accelerator: "Command+Q",
                    click: () => {
                        if (winManager.hasWindow)
                            winManager.mainWindow.close();
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
                        if (winManager.hasWindow)
                            winManager.mainWindow.close();
                    },
                },
                {
                    label: "Minimize",
                    accelerator: "Command+M",
                    click: () => {
                        if (winManager.hasWindow())
                            winManager.mainWindow.minimize();
                    },
                },
                { label: "Zoom", click: () => winManager.zoom() },
            ],
        },
    ];
    electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(template));
}
else {
    electron_1.Menu.setApplicationMenu(null);
}
const winManager = new window_1.WindowManager();
electron_1.app.on("window-all-closed", () => {
    if (winManager.hasWindow()) {
        winManager.mainWindow.webContents.session.clearStorageData({
            storages: ["cookies", "localstorage"],
        });
    }
    winManager.mainWindow = null;
    if (restarting) {
        restarting = false;
        winManager.createWindow();
    }
    else {
        electron_1.app.quit();
    }
});
electron_1.ipcMain.handle("import-all-settings", (_, configs) => {
    restarting = true;
    settings_1.store.clear();
    for (let [key, value] of Object.entries(configs)) {
        // @ts-ignore
        settings_1.store.set(key, value);
    }
    (0, update_scripts_1.default)(settings_1.store);
    electron_1.nativeTheme.themeSource = settings_1.store.get("theme", "system" /* Default */);
    setTimeout(() => {
        winManager.mainWindow.close();
    }, process.platform === "darwin" ? 1000 : 0); // Why ???
});
