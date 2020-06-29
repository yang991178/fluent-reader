const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("renderer",{
    requestNavigation: (href) => {
        ipcRenderer.sendToHost("request-navigation", href)
    },
    contextMenu: (pos, text) => {
        ipcRenderer.sendToHost("context-menu", pos, text)
    }
})