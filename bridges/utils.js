"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const utilsBridge = {
    platform: process.platform,
    getVersion: () => {
        return electron_1.ipcRenderer.sendSync("get-version");
    },
    openExternal: (url, background = false) => {
        electron_1.ipcRenderer.invoke("open-external", url, background);
    },
    showErrorBox: (title, content) => {
        electron_1.ipcRenderer.invoke("show-error-box", title, content);
    },
    showMessageBox: async (title, message, confirm, cancel, defaultCancel = false, type = "none") => {
        return (await electron_1.ipcRenderer.invoke("show-message-box", title, message, confirm, cancel, defaultCancel, type));
    },
    showSaveDialog: async (filters, path) => {
        let result = (await electron_1.ipcRenderer.invoke("show-save-dialog", filters, path));
        if (result) {
            return (result, errmsg) => {
                electron_1.ipcRenderer.invoke("write-save-result", result, errmsg);
            };
        }
        else {
            return null;
        }
    },
    showOpenDialog: async (filters) => {
        return (await electron_1.ipcRenderer.invoke("show-open-dialog", filters));
    },
    getCacheSize: async () => {
        return await electron_1.ipcRenderer.invoke("get-cache");
    },
    clearCache: async () => {
        await electron_1.ipcRenderer.invoke("clear-cache");
    },
    addMainContextListener: (callback) => {
        electron_1.ipcRenderer.removeAllListeners("window-context-menu");
        electron_1.ipcRenderer.on("window-context-menu", (_, pos, text) => {
            callback(pos, text);
        });
    },
    addWebviewContextListener: (callback) => {
        electron_1.ipcRenderer.removeAllListeners("webview-context-menu");
        electron_1.ipcRenderer.on("webview-context-menu", (_, pos, text, url) => {
            callback(pos, text, url);
        });
    },
    imageCallback: (type) => {
        electron_1.ipcRenderer.invoke("image-callback", type);
    },
    addWebviewKeydownListener: (callback) => {
        electron_1.ipcRenderer.removeAllListeners("webview-keydown");
        electron_1.ipcRenderer.on("webview-keydown", (_, input) => {
            callback(input);
        });
    },
    addWebviewErrorListener: (callback) => {
        electron_1.ipcRenderer.removeAllListeners("webview-error");
        electron_1.ipcRenderer.on("webview-error", (_, reason) => {
            callback(reason);
        });
    },
    writeClipboard: (text) => {
        electron_1.ipcRenderer.invoke("write-clipboard", text);
    },
    closeWindow: () => {
        electron_1.ipcRenderer.invoke("close-window");
    },
    minimizeWindow: () => {
        electron_1.ipcRenderer.invoke("minimize-window");
    },
    maximizeWindow: () => {
        electron_1.ipcRenderer.invoke("maximize-window");
    },
    isMaximized: () => {
        return electron_1.ipcRenderer.sendSync("is-maximized");
    },
    isFullscreen: () => {
        return electron_1.ipcRenderer.sendSync("is-fullscreen");
    },
    isFocused: () => {
        return electron_1.ipcRenderer.sendSync("is-focused");
    },
    focus: () => {
        electron_1.ipcRenderer.invoke("request-focus");
    },
    requestAttention: () => {
        electron_1.ipcRenderer.invoke("request-attention");
    },
    addWindowStateListener: (callback) => {
        electron_1.ipcRenderer.removeAllListeners("maximized");
        electron_1.ipcRenderer.on("maximized", () => {
            callback(0 /* Maximized */, true);
        });
        electron_1.ipcRenderer.removeAllListeners("unmaximized");
        electron_1.ipcRenderer.on("unmaximized", () => {
            callback(0 /* Maximized */, false);
        });
        electron_1.ipcRenderer.removeAllListeners("enter-fullscreen");
        electron_1.ipcRenderer.on("enter-fullscreen", () => {
            callback(2 /* Fullscreen */, true);
        });
        electron_1.ipcRenderer.removeAllListeners("leave-fullscreen");
        electron_1.ipcRenderer.on("leave-fullscreen", () => {
            callback(2 /* Fullscreen */, false);
        });
        electron_1.ipcRenderer.removeAllListeners("window-focus");
        electron_1.ipcRenderer.on("window-focus", () => {
            callback(1 /* Focused */, true);
        });
        electron_1.ipcRenderer.removeAllListeners("window-blur");
        electron_1.ipcRenderer.on("window-blur", () => {
            callback(1 /* Focused */, false);
        });
    },
    addTouchBarEventsListener: (callback) => {
        electron_1.ipcRenderer.removeAllListeners("touchbar-event");
        electron_1.ipcRenderer.on("touchbar-event", (_, key) => {
            callback({ key: key });
        });
    },
    initTouchBar: (texts) => {
        electron_1.ipcRenderer.invoke("touchbar-init", texts);
    },
    destroyTouchBar: () => {
        electron_1.ipcRenderer.invoke("touchbar-destroy");
    },
};
exports.default = utilsBridge;
