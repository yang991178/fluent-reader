import { ipcMain, shell, dialog, app, session, webContents, clipboard } from "electron"
import { WindowManager } from "./window"
import fs = require("fs")

export function openExternal(url: string) {
    if (url.startsWith("https://") || url.startsWith("http://"))
        shell.openExternal(url)
}

export function setUtilsListeners(manager: WindowManager) {
    ipcMain.on("get-version", (event) => {
        event.returnValue = app.getVersion()
    })

    ipcMain.handle("open-external", (_, url: string) => {
        openExternal(url)
    })

    ipcMain.handle("show-error-box", (_, title, content) => {
        dialog.showErrorBox(title, content)
    })

    ipcMain.handle("show-message-box", async (_, title, message, confirm, cancel, defaultCancel, type) => {
        if (manager.hasWindow()) {
            let response = await dialog.showMessageBox(manager.mainWindow, {
                type: type,
                title: title,
                message: message,
                buttons: process.platform === "win32" ? ["Yes", "No"] : [confirm, cancel],
                cancelId: 1,
                defaultId: defaultCancel ? 1 : 0
            })
            return response.response === 0
        } else {
            return false
        }
    })

    ipcMain.handle("show-save-dialog", async (_, filters: Electron.FileFilter[], path: string) => {
        ipcMain.removeAllListeners("write-save-result")
        if (manager.hasWindow()) {
            let response = await dialog.showSaveDialog(manager.mainWindow, {
                defaultPath: path,
                filters: filters
            })
            if (!response.canceled) {
                ipcMain.handleOnce("write-save-result", (_, result, errmsg) => {
                    fs.writeFile(response.filePath, result, (err) => {
                        if (err) dialog.showErrorBox(errmsg, String(err))
                    })
                })
                return true
            }
        }
        return false
    })

    ipcMain.handle("show-open-dialog", async (_, filters: Electron.FileFilter[]) => {
        if (manager.hasWindow()) {
            let response = await dialog.showOpenDialog(manager.mainWindow, {
                filters: filters,
                properties: ["openFile"]
            })
            if (!response.canceled) {
                try {
                    return await fs.promises.readFile(response.filePaths[0], "utf-8")
                } catch (err) {
                    console.log(err)
                }
            }
        }
        return null
    })

    ipcMain.handle("get-cache", async () => {
        return await session.defaultSession.getCacheSize()
    })

    ipcMain.handle("clear-cache", async () => {
        await session.defaultSession.clearCache()
    })

    ipcMain.handle("webview-context-menu", (_, pos, text) => {
        if (manager.hasWindow()) {
            manager.mainWindow.webContents.send("webview-context-menu", pos, text)
        }
    })

    ipcMain.handle("add-webview-keydown-listener", (_, id) => {
        let contents = webContents.fromId(id)
        contents.on("before-input-event", (_, input) => {
            if (manager.hasWindow()) {
                let contents = manager.mainWindow.webContents
                if (!contents.isDestroyed()) {
                    contents.send("webview-keydown", input)
                }
            }
        })
    })

    ipcMain.handle("write-clipboard", (_, text) => {
        clipboard.writeText(text)
    })

    ipcMain.handle("close-window", () => {
        if (manager.hasWindow()) manager.mainWindow.close()
    })

    ipcMain.handle("minimize-window", () => {
        if (manager.hasWindow()) manager.mainWindow.minimize()
    })

    ipcMain.handle("maximize-window", () => {
        if (manager.hasWindow) {
            if (manager.mainWindow.isMaximized()) {
                manager.mainWindow.unmaximize()
            } else {
                manager.mainWindow.maximize()
            }
        }
    })

    ipcMain.on("is-maximized", (event) => {
        event.returnValue = Boolean(manager.mainWindow) && manager.mainWindow.isMaximized()
    })
}