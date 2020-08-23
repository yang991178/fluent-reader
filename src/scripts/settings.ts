import { IPartialTheme, loadTheme } from "@fluentui/react"
import locales from "./i18n/_locales"
import { ThemeSettings } from "../schema-types"
import intl from "react-intl-universal"

const lightTheme: IPartialTheme = {
    defaultFontStyle: { fontFamily: '"Segoe UI", "Source Han Sans SC Regular", "Microsoft YaHei", sans-serif' }
}
const darkTheme: IPartialTheme = {
    ...lightTheme,
    palette: {
        neutralLighterAlt: "#282828",
        neutralLighter: "#313131",
        neutralLight: "#3f3f3f",
        neutralQuaternaryAlt: "#484848",
        neutralQuaternary: "#4f4f4f",
        neutralTertiaryAlt: "#6d6d6d",
        neutralTertiary: "#c8c8c8",
        neutralSecondary: "#d0d0d0",
        neutralSecondaryAlt: "#d2d0ce",
        neutralPrimaryAlt: "#dadada",
        neutralPrimary: "#ffffff",
        neutralDark: "#f4f4f4",
        black: "#f8f8f8",
        white: "#1f1f1f",
        themePrimary: "#3a96dd",
        themeLighterAlt: "#020609",
        themeLighter: "#091823",
        themeLight: "#112d43",
        themeTertiary: "#235a85",
        themeSecondary: "#3385c3",
        themeDarkAlt: "#4ba0e1",
        themeDark: "#65aee6",
        themeDarker: "#8ac2ec",
        accent: "#3a96dd"
    }
}

export function setThemeSettings(theme: ThemeSettings) {
    window.settings.setThemeSettings(theme)
    applyThemeSettings()
}
export function getThemeSettings(): ThemeSettings {
    return window.settings.getThemeSettings()
}
export function applyThemeSettings() {
    loadTheme(window.settings.shouldUseDarkColors() ? darkTheme : lightTheme)
}
window.settings.addThemeUpdateListener((shouldDark) => {
    loadTheme(shouldDark ? darkTheme : lightTheme)
})

export function getCurrentLocale() {
    let locale = window.settings.getCurrentLocale()
    if (locale in locales) return locale
    locale = locale.split("-")[0]
    return (locale in locales) ? locale : "en-US"
}

export function exportAll() {
    const filters = [{ name: intl.get("app.frData"), extensions: ["frdata"] }]
    window.utils.showSaveDialog(filters, "*/Fluent_Reader_Backup.frdata").then(write => {
        if (write) {
            let output = window.settings.getAll()
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
                        write(JSON.stringify(output), intl.get("settings.writeError"))
                    }
                }
            }
        }
    })
}

export async function importAll() {
    const filters = [{ name: intl.get("app.frData"), extensions: ["frdata"] }]
    let data = await window.utils.showOpenDialog(filters)
    if (!data) return true
    let confirmed = await window.utils.showMessageBox(
        intl.get("app.restore"),
        intl.get("app.confirmImport"),
        intl.get("confirm"), intl.get("cancel"),
        true, "warning"
    )
    if (!confirmed) return true
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
            window.settings.setAll(configs)
        })
    }
    return false
}
