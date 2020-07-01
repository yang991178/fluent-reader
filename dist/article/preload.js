const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("renderer",{
    dismissContextMenu: () => {
        ipcRenderer.invoke("webview-context-menu", null, null)
    },
    contextMenu: (pos, text) => {
        ipcRenderer.invoke("webview-context-menu", pos, text)
    }
})