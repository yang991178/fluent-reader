import { remote, ipcRenderer } from "electron"
import { ViewType } from "./models/page"
import { IPartialTheme, loadTheme } from "@fluentui/react"
import locales from "./i18n/_locales"

const PAC_STORE_KEY = "PAC"
const PAC_STATUS_KEY = "PAC_ON"
export function getProxyStatus() {
    return Boolean(localStorage.getItem(PAC_STATUS_KEY))
}
export function toggleProxyStatus() {
    localStorage.setItem(PAC_STATUS_KEY, getProxyStatus() ? "" : "on")
    setProxy()
}
export function getProxy() {
    return localStorage.getItem(PAC_STORE_KEY) || ""
}
export function setProxy(address = null) {
    if (!address) {
        address = getProxy()
    } else {
        localStorage.setItem(PAC_STORE_KEY, address)
    }
    remote.getCurrentWebContents().session.setProxy({
        pacScript: getProxyStatus() ? address : ""
    })
    remote.session.fromPartition("sandbox").setProxy({
        pacScript: getProxyStatus() ? address : ""
    })
}

const VIEW_STORE_KEY = "view"
export const getDefaultView = () => {
    let view = localStorage.getItem(VIEW_STORE_KEY)
    return view ? parseInt(view) as ViewType : ViewType.Cards
}
export const setDefaultView = (viewType: ViewType) => {
    localStorage.setItem(VIEW_STORE_KEY, String(viewType))
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
    localStorage.setItem(THEME_STORE_KEY, theme)
    ipcRenderer.send("set-theme", theme)
    applyThemeSettings()
}
export function getThemeSettings(): ThemeSettings {
    let stored = localStorage.getItem(THEME_STORE_KEY)
    return stored === null ? ThemeSettings.Default : stored as ThemeSettings
}
export function applyThemeSettings() {
    let theme = getThemeSettings()
    let useDark = theme === ThemeSettings.Default 
        ? remote.nativeTheme.shouldUseDarkColors
        : theme === ThemeSettings.Dark
    loadTheme(useDark ? darkTheme : lightTheme)
    if (useDark) { 
        document.body.classList.add("dark")
    } else { 
        document.body.classList.remove("dark")
    }
}

const LOCALE_STORE_KEY = "locale"
export function setLocaleSettings(option: string) {
    localStorage.setItem(LOCALE_STORE_KEY, option)
}
export function getLocaleSettings() {
    let stored = localStorage.getItem(LOCALE_STORE_KEY)
    return stored === null ? "default" : stored
}
export function getCurrentLocale() {
    let set = getLocaleSettings()
    let locale = set === "default" ? remote.app.getLocale() : set
    return (locale in locales) ? locale : "en-US"
}

export const STORE_KEYS = [
    PAC_STORE_KEY, PAC_STATUS_KEY, VIEW_STORE_KEY, THEME_STORE_KEY
]