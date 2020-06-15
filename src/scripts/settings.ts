import { remote, ipcRenderer } from "electron"
import { ViewType } from "./models/page"
import { IPartialTheme, loadTheme, values } from "@fluentui/react"
import locales from "./i18n/_locales"
import Store = require("electron-store")
import { schemaTypes } from "./config-schema"
import fs = require("fs")
import intl = require("react-intl-universal")

export const store = new Store<schemaTypes>()

const PAC_STORE_KEY = "pac"
const PAC_STATUS_KEY = "pacOn"
export function getProxyStatus() {
    return store.get(PAC_STATUS_KEY, false)
}
export function toggleProxyStatus() {
    store.set(PAC_STATUS_KEY, !getProxyStatus())
    setProxy()
}
export function getProxy() {
    return store.get(PAC_STORE_KEY, "")
}
export function setProxy(address = null) {
    if (!address) {
        address = getProxy()
    } else {
        store.set(PAC_STORE_KEY, address)
    }
    remote.getCurrentWebContents().session.setProxy({
        pacScript: getProxyStatus() ? address : ""
    })
    remote.session.fromPartition("sandbox").setProxy({
        pacScript: getProxyStatus() ? address : ""
    })
}

const VIEW_STORE_KEY = "view"
export const getDefaultView = (): ViewType => {
    return store.get(VIEW_STORE_KEY, ViewType.Cards)
}
export const setDefaultView = (viewType: ViewType) => {
    store.set(VIEW_STORE_KEY, viewType)
}

const lightTheme: IPartialTheme = { 
    defaultFontStyle: { fontFamily: '"Source Han Sans SC Regular", "Microsoft YaHei", sans-serif' } 
}
const darkTheme: IPartialTheme = {
    ...lightTheme,
    palette: {
        neutralLighterAlt: '#282828',
        neutralLighter: '#313131',
        neutralLight: '#3f3f3f',
        neutralQuaternaryAlt: '#484848',
        neutralQuaternary: '#4f4f4f',
        neutralTertiaryAlt: '#6d6d6d',
        neutralTertiary: '#c8c8c8',
        neutralSecondary: '#d0d0d0',
        neutralSecondaryAlt: '#d2d0ce',
        neutralPrimaryAlt: '#dadada',
        neutralPrimary: '#ffffff',
        neutralDark: '#f4f4f4',
        black: '#f8f8f8',
        white: '#1f1f1f',
        themePrimary: '#3a96dd',
        themeLighterAlt: '#020609',
        themeLighter: '#091823',
        themeLight: '#112d43',
        themeTertiary: '#235a85',
        themeSecondary: '#3385c3',
        themeDarkAlt: '#4ba0e1',
        themeDark: '#65aee6',
        themeDarker: '#8ac2ec',
        accent: '#3a96dd'
    }
}
export enum ThemeSettings {
    Default = "system", 
    Light = "light", 
    Dark = "dark"
}
const THEME_STORE_KEY = "theme"
export function setThemeSettings(theme: ThemeSettings) {
    store.set(THEME_STORE_KEY, theme)
    remote.nativeTheme.themeSource = theme
    applyThemeSettings()
}
export function getThemeSettings(): ThemeSettings {
    return store.get(THEME_STORE_KEY, ThemeSettings.Default)
}
export function applyThemeSettings() {
    loadTheme(remote.nativeTheme.shouldUseDarkColors ? darkTheme : lightTheme)
}
remote.nativeTheme.on("updated", () => {
    applyThemeSettings()
})

const LOCALE_STORE_KEY = "locale"
export function setLocaleSettings(option: string) {
    store.set(LOCALE_STORE_KEY, option)
}
export function getLocaleSettings() {
    return store.get(LOCALE_STORE_KEY, "default")
}
export function getCurrentLocale() {
    let set = getLocaleSettings()
    let locale = set === "default" ? remote.app.getLocale() : set
    return (locale in locales) ? locale : "en-US"
}

export function exportAll(path: string) {
    let output = {}
    for (let [key, value] of store) {
        output[key] = value
    }
    output["nedb"] = {}
    let openRequest = window.indexedDB.open("NeDB")
    openRequest.onsuccess = () => {
        let db = openRequest.result
        let objectStore = db.transaction("nedbdata").objectStore("nedbdata")
        let cursorRequest = objectStore.openCursor()
        cursorRequest.onsuccess = () => {
            let cursor = cursorRequest.result
            if (cursor) {
                output["nedb"][cursor.key] = cursor.value
                cursor.continue()
            } else {
                fs.writeFile(path, JSON.stringify(output), (err) => {
                    if (err) remote.dialog.showErrorBox(intl.get("settings.writeError"), String(err))
                })
            }
        }
    }
}

export function importAll(path) {
    fs.readFile(path, "utf-8", async (err, data) => {
        if (err) {
            console.log(err)
        } else {
            let configs = JSON.parse(data)
            let openRequest = window.indexedDB.open("NeDB")
            openRequest.onsuccess = () => {
                let db = openRequest.result
                let objectStore = db.transaction("nedbdata", "readwrite").objectStore("nedbdata")
                let requests = Object.entries(configs.nedb).map(([key, value]) => {
                    return objectStore.put(value, key)
                })
                let promises = requests.map(req => new Promise((resolve, reject) => {
                    req.onsuccess = () => resolve()
                    req.onerror = () => reject()
                }))
                Promise.all(promises).then(() => {
                    delete configs.nedb
                    store.clear()
                    for (let [key, value] of Object.entries(configs)) {
                        // @ts-ignore
                        store.set(key, value)
                    }
                    ipcRenderer.send("restart")
                })
            }
        }
    })
}
