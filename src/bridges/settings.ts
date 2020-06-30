import { SourceGroup, ViewType, ThemeSettings, SchemaTypes } from "../schema-types"
import { ipcRenderer } from "electron"

const settingsBridge = {
    saveGroups: (groups: SourceGroup[]) => {
        ipcRenderer.invoke("set-groups", groups)
    },
    loadGroups: (): SourceGroup[] => {
        return ipcRenderer.sendSync("get-groups")
    },

    getDefaultMenu: (): boolean => {
        return ipcRenderer.sendSync("get-menu")
    },
    setDefaultMenu: (state: boolean) => {
        ipcRenderer.invoke("set-menu", state)
    },

    getProxyStatus: (): boolean => {
        return ipcRenderer.sendSync("get-proxy-status")
    },
    toggleProxyStatus: () => {
        ipcRenderer.send("toggle-proxy-status")
    },
    getProxy: (): string => {
        return ipcRenderer.sendSync("get-proxy")
    },
    setProxy: (address: string = null) => {
        ipcRenderer.invoke("set-proxy", address)
    },

    getDefaultView: (): ViewType => {
        return ipcRenderer.sendSync("get-view")
    },
    setDefaultView: (viewType: ViewType) => {
        ipcRenderer.invoke("set-view", viewType)
    },

    getThemeSettings: (): ThemeSettings => {
        return ipcRenderer.sendSync("get-theme")
    },
    setThemeSettings: (theme: ThemeSettings) => {
        ipcRenderer.invoke("set-theme", theme)
    },
    shouldUseDarkColors: (): boolean => {
        return ipcRenderer.sendSync("get-theme-dark-color")
    },
    addThemeUpdateListener: (callback: (shouldDark: boolean) => any) => {
        ipcRenderer.on("theme-updated", (_, shouldDark) => {
            callback(shouldDark)
        })
    },

    setLocaleSettings: (option: string) => {
        ipcRenderer.invoke("set-locale", option)
    },
    getLocaleSettings: (): string => {
        return ipcRenderer.sendSync("get-locale-settings")
    },
    getCurrentLocale: (): string => {
        return ipcRenderer.sendSync("get-locale")
    },

    getAll: () => {
        return ipcRenderer.sendSync("get-all-settings") as Object
    },

    setAll: (configs) => {
        ipcRenderer.invoke("import-all-settings", configs)
    },
}

declare global { 
    interface Window {
        settings: typeof settingsBridge
    }
}

export default settingsBridge