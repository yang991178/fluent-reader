import { app, ipcMain, BrowserWindow, Menu } from "electron"
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
        fullscreenable: false,
        webPreferences: {
            nodeIntegration: true,
            webviewTag: true
        }
    })
    mainWindowState.manage(mainWindow)
    // and load the index.html of the app.
    mainWindow.loadFile('index.html')
    mainWindow.webContents.openDevTools()
}

Menu.setApplicationMenu(null)

app.on('ready', createWindow)

app.on('window-all-closed', function () {
    mainWindow = null
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
})
