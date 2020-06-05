import { app, ipcMain, BrowserWindow } from "electron"
import windowStateKeeper = require("electron-window-state")

let mainWindow: BrowserWindow

function createWindow() {
    let mainWindowState = windowStateKeeper({
        defaultWidth: 1200,
        defaultHeight: 700,
    })
    // Create the browser window.
    mainWindow = new BrowserWindow({
        backgroundColor: "#faf9f8",
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        minWidth: 992,
        minHeight: 600,
        frame: false,
        webPreferences: {
            nodeIntegration: true
        }
    })
    mainWindowState.manage(mainWindow)
    // and load the index.html of the app.
    mainWindow.loadFile('index.html')
    mainWindow.webContents.openDevTools()
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
})
