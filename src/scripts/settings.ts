import locales from "./i18n/_locales"
import { ThemeSettings } from "../schema-types"

export function getFontFamilyForLocale(locale: string): string {
    switch (locale) {
        case "zh-CN":
            return '"Segoe UI", "Source Han Sans SC Regular", "Microsoft YaHei", sans-serif'
        case "zh-TW":
            return '"Segoe UI", "Source Han Sans TC Regular", "Microsoft JhengHei", sans-serif'
        case "ja":
            return '"Segoe UI", "Source Han Sans JP Regular", "Yu Gothic UI", sans-serif'
        case "ko":
            return '"Segoe UI", "Source Han Sans KR Regular", "Malgun Gothic", sans-serif'
        default:
            return '"Segoe UI", "Source Han Sans Regular", sans-serif'
    }
}

export function setThemeSettings(theme: ThemeSettings) {
    window.settings.setThemeSettings(theme)
}
export function getThemeSettings(): ThemeSettings {
    return window.settings.getThemeSettings()
}

export function getCurrentLocale() {
    let locale = window.settings.getCurrentLocale()
    if (locale in locales) return locale
    locale = locale.split("-")[0]
    return locale in locales ? locale : "en-US"
}

export async function exportAll() {
    await window.db.exportAll()
}

export async function importAll(): Promise<boolean> {
    return await window.db.importAll()
}
