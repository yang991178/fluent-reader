import * as db from "./db"
import { IPartialTheme, loadTheme } from "@fluentui/react"
import locales from "./i18n/_locales"
import { ThemeSettings } from "../schema-types"
import intl from "react-intl-universal"
import { SourceTextDirection } from "./models/source"

let lightTheme: IPartialTheme = {
    defaultFontStyle: {
        fontFamily: '"Segoe UI", "Source Han Sans Regular", sans-serif',
    },
}
let darkTheme: IPartialTheme = {
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
        accent: "#3a96dd",
    },
}

export function setThemeDefaultFont(locale: string) {
    switch (locale) {
        case "zh-CN":
            lightTheme.defaultFontStyle.fontFamily =
                '"Segoe UI", "Source Han Sans SC Regular", "Microsoft YaHei", sans-serif'
            break
        case "zh-TW":
            lightTheme.defaultFontStyle.fontFamily =
                '"Segoe UI", "Source Han Sans TC Regular", "Microsoft JhengHei", sans-serif'
            break
        case "ja":
            lightTheme.defaultFontStyle.fontFamily =
                '"Segoe UI", "Source Han Sans JP Regular", "Yu Gothic UI", sans-serif'
            break
        case "ko":
            lightTheme.defaultFontStyle.fontFamily =
                '"Segoe UI", "Source Han Sans KR Regular", "Malgun Gothic", sans-serif'
            break
        default:
            lightTheme.defaultFontStyle.fontFamily =
                '"Segoe UI", "Source Han Sans Regular", sans-serif'
    }
    darkTheme.defaultFontStyle.fontFamily =
        lightTheme.defaultFontStyle.fontFamily
    applyThemeSettings()
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
window.settings.addThemeUpdateListener(shouldDark => {
    loadTheme(shouldDark ? darkTheme : lightTheme)
})

export function getCurrentLocale() {
    let locale = window.settings.getCurrentLocale()
    if (locale in locales) return locale
    locale = locale.split("-")[0]
    return locale in locales ? locale : "en-US"
}

export async function exportAll() {
    const filters = [{ name: intl.get("app.frData"), extensions: ["frdata"] }]
    const write = await window.utils.showSaveDialog(
        filters,
        "*/Fluent_Reader_Backup.frdata"
    )
    if (write) {
        let output = window.settings.getAll()
        output["lovefield"] = {
            sources: await db.sourcesDB.select().from(db.sources).exec(),
            items: await db.itemsDB.select().from(db.items).exec(),
        }
        write(JSON.stringify(output), intl.get("settings.writeError"))
    }
}

export async function importAll() {
    const filters = [{ name: intl.get("app.frData"), extensions: ["frdata"] }]
    let data = await window.utils.showOpenDialog(filters)
    if (!data) return true
    let confirmed = await window.utils.showMessageBox(
        intl.get("app.restore"),
        intl.get("app.confirmImport"),
        intl.get("confirm"),
        intl.get("cancel"),
        true,
        "warning"
    )
    if (!confirmed) return true
    let configs = JSON.parse(data)
    await db.sourcesDB.delete().from(db.sources).exec()
    await db.itemsDB.delete().from(db.items).exec()
    if (configs.nedb) {
        let openRequest = window.indexedDB.open("NeDB")
        configs.useNeDB = true
        openRequest.onsuccess = () => {
            let db = openRequest.result
            let objectStore = db
                .transaction("nedbdata", "readwrite")
                .objectStore("nedbdata")
            let requests = Object.entries(configs.nedb).map(([key, value]) => {
                return objectStore.put(value, key)
            })
            let promises = requests.map(
                req =>
                    new Promise<void>((resolve, reject) => {
                        req.onsuccess = () => resolve()
                        req.onerror = () => reject()
                    })
            )
            Promise.all(promises).then(() => {
                delete configs.nedb
                window.settings.setAll(configs)
            })
        }
    } else {
        const sRows = configs.lovefield.sources.map(s => {
            s.lastFetched = new Date(s.lastFetched)
            if (!s.textDir) s.textDir = SourceTextDirection.LTR
            if (!s.hidden) s.hidden = false
            return db.sources.createRow(s)
        })
        const iRows = configs.lovefield.items.map(i => {
            i.date = new Date(i.date)
            i.fetchedDate = new Date(i.fetchedDate)
            return db.items.createRow(i)
        })
        await db.sourcesDB.insert().into(db.sources).values(sRows).exec()
        await db.itemsDB.insert().into(db.items).values(iRows).exec()
        delete configs.lovefield
        window.settings.setAll(configs)
    }
    return false
}
