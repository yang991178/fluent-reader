"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUtilsListeners = void 0;
const electron_1 = require("electron");
const fs = require("fs");
const touchbar_1 = require("./touchbar");
function setUtilsListeners(manager) {
    async function openExternal(url, background = false) {
        if (url.startsWith("https://") || url.startsWith("http://")) {
            if (background && process.platform === "darwin") {
                electron_1.shell.openExternal(url, { activate: false });
            }
            else if (background && manager.hasWindow()) {
                manager.mainWindow.setAlwaysOnTop(true);
                await electron_1.shell.openExternal(url);
                setTimeout(() => manager.mainWindow.setAlwaysOnTop(false), 1000);
            }
            else {
                electron_1.shell.openExternal(url);
            }
        }
    }
    electron_1.app.on("web-contents-created", (_, contents) => {
        // TODO: Use contents.setWindowOpenHandler instead of new-window listener
        contents.on("new-window", (event, url, _, disposition) => {
            if (manager.hasWindow())
                event.preventDefault();
            if (contents.getType() === "webview")
                openExternal(url, disposition === "background-tab");
        });
        contents.on("will-navigate", (event, url) => {
            event.preventDefault();
            if (contents.getType() === "webview")
                openExternal(url);
        });
    });
    electron_1.ipcMain.on("get-version", event => {
        event.returnValue = electron_1.app.getVersion();
    });
    electron_1.ipcMain.handle("open-external", (_, url, background) => {
        openExternal(url, background);
    });
    electron_1.ipcMain.handle("show-error-box", (_, title, content) => {
        electron_1.dialog.showErrorBox(title, content);
    });
    electron_1.ipcMain.handle("show-message-box", async (_, title, message, confirm, cancel, defaultCancel, type) => {
        if (manager.hasWindow()) {
            let response = await electron_1.dialog.showMessageBox(manager.mainWindow, {
                type: type,
                title: title,
                message: message,
                buttons: process.platform === "win32"
                    ? ["Yes", "No"]
                    : [confirm, cancel],
                cancelId: 1,
                defaultId: defaultCancel ? 1 : 0,
            });
            return response.response === 0;
        }
        else {
            return false;
        }
    });
    electron_1.ipcMain.handle("show-save-dialog", async (_, filters, path) => {
        electron_1.ipcMain.removeAllListeners("write-save-result");
        if (manager.hasWindow()) {
            let response = await electron_1.dialog.showSaveDialog(manager.mainWindow, {
                defaultPath: path,
                filters: filters,
            });
            if (!response.canceled) {
                electron_1.ipcMain.handleOnce("write-save-result", (_, result, errmsg) => {
                    fs.writeFile(response.filePath, result, err => {
                        if (err)
                            electron_1.dialog.showErrorBox(errmsg, String(err));
                    });
                });
                return true;
            }
        }
        return false;
    });
    electron_1.ipcMain.handle("show-open-dialog", async (_, filters) => {
        if (manager.hasWindow()) {
            let response = await electron_1.dialog.showOpenDialog(manager.mainWindow, {
                filters: filters,
                properties: ["openFile"],
            });
            if (!response.canceled) {
                try {
                    return await fs.promises.readFile(response.filePaths[0], "utf-8");
                }
                catch (err) {
                    console.log(err);
                }
            }
        }
        return null;
    });
    electron_1.ipcMain.handle("get-cache", async () => {
        return await electron_1.session.defaultSession.getCacheSize();
    });
    electron_1.ipcMain.handle("clear-cache", async () => {
        await electron_1.session.defaultSession.clearCache();
    });
    electron_1.app.on("web-contents-created", (_, contents) => {
        if (contents.getType() === "webview") {
            contents.on("did-fail-load", (event, code, desc, validated, isMainFrame) => {
                if (isMainFrame && manager.hasWindow()) {
                    manager.mainWindow.webContents.send("webview-error", desc);
                }
            });
            contents.on("context-menu", (_, params) => {
                if ((params.hasImageContents ||
                    params.selectionText ||
                    params.linkURL) &&
                    manager.hasWindow()) {
                    if (params.hasImageContents) {
                        electron_1.ipcMain.removeHandler("image-callback");
                        electron_1.ipcMain.handleOnce("image-callback", (_, type) => {
                            switch (type) {
                                case 0 /* OpenExternal */:
                                case 1 /* OpenExternalBg */:
                                    openExternal(params.srcURL, type ===
                                        1 /* OpenExternalBg */);
                                    break;
                                case 2 /* SaveAs */:
                                    contents.session.downloadURL(params.srcURL);
                                    break;
                                case 3 /* Copy */:
                                    contents.copyImageAt(params.x, params.y);
                                    break;
                                case 4 /* CopyLink */:
                                    electron_1.clipboard.writeText(params.srcURL);
                                    break;
                            }
                        });
                        manager.mainWindow.webContents.send("webview-context-menu", [params.x, params.y]);
                    }
                    else {
                        manager.mainWindow.webContents.send("webview-context-menu", [params.x, params.y], params.selectionText, params.linkURL);
                    }
                    contents
                        .executeJavaScript(`new Promise(resolve => {
                        const dismiss = () => {
                            document.removeEventListener("mousedown", dismiss)
                            document.removeEventListener("scroll", dismiss)                            
                            resolve()
                        }
                        document.addEventListener("mousedown", dismiss)
                        document.addEventListener("scroll", dismiss)
                    })`)
                        .then(() => {
                        if (manager.hasWindow()) {
                            manager.mainWindow.webContents.send("webview-context-menu");
                        }
                    });
                }
            });
            contents.on("before-input-event", (_, input) => {
                if (manager.hasWindow()) {
                    let contents = manager.mainWindow.webContents;
                    contents.send("webview-keydown", input);
                }
            });
        }
    });
    electron_1.ipcMain.handle("write-clipboard", (_, text) => {
        electron_1.clipboard.writeText(text);
    });
    electron_1.ipcMain.handle("close-window", () => {
        if (manager.hasWindow())
            manager.mainWindow.close();
    });
    electron_1.ipcMain.handle("minimize-window", () => {
        if (manager.hasWindow())
            manager.mainWindow.minimize();
    });
    electron_1.ipcMain.handle("maximize-window", () => {
        manager.zoom();
    });
    electron_1.ipcMain.on("is-maximized", event => {
        event.returnValue =
            Boolean(manager.mainWindow) && manager.mainWindow.isMaximized();
    });
    electron_1.ipcMain.on("is-focused", event => {
        event.returnValue =
            manager.hasWindow() && manager.mainWindow.isFocused();
    });
    electron_1.ipcMain.on("is-fullscreen", event => {
        event.returnValue =
            manager.hasWindow() && manager.mainWindow.isFullScreen();
    });
    electron_1.ipcMain.handle("request-focus", () => {
        if (manager.hasWindow()) {
            const win = manager.mainWindow;
            if (win.isMinimized())
                win.restore();
            if (process.platform === "win32") {
                win.setAlwaysOnTop(true);
                win.setAlwaysOnTop(false);
            }
            win.focus();
        }
    });
    electron_1.ipcMain.handle("request-attention", () => {
        if (manager.hasWindow() && !manager.mainWindow.isFocused()) {
            if (process.platform === "win32") {
                manager.mainWindow.flashFrame(true);
                manager.mainWindow.once("focus", () => {
                    manager.mainWindow.flashFrame(false);
                });
            }
            else if (process.platform === "darwin") {
                electron_1.app.dock.bounce();
            }
        }
    });
    electron_1.ipcMain.handle("touchbar-init", (_, texts) => {
        if (manager.hasWindow())
            (0, touchbar_1.initMainTouchBar)(texts, manager.mainWindow);
    });
    electron_1.ipcMain.handle("touchbar-destroy", () => {
        if (manager.hasWindow())
            manager.mainWindow.setTouchBar(null);
    });
}
exports.setUtilsListeners = setUtilsListeners;
