export class SourceGroup {
    isMultiple: boolean
    sids: number[]
    name?: string
    expanded?: boolean
    index?: number // available only from menu or groups tab container

    constructor(sids: number[], name: string = null) {
        name = (name && name.trim()) || "Source group"
        if (sids.length == 1) {
            this.isMultiple = false
        } else {
            this.isMultiple = true
            this.name = name
            this.expanded = true
        }
        this.sids = sids
    }
}

export const enum ViewType {
    Cards, List, Magazine, Compact, Customized
}

export const enum ViewConfigs {
    ShowCover = 1 << 0,
    ShowSnippet = 1 << 1,
    FadeRead = 1 << 2,
}

export const enum ThemeSettings {
    Default = "system", 
    Light = "light", 
    Dark = "dark"
}

export const enum SearchEngines {
    Google, Bing, Baidu, DuckDuckGo
}

export const enum ImageCallbackTypes {
    OpenExternal, OpenExternalBg, SaveAs, Copy, CopyLink
}

export const enum SyncService {
    None, Fever, Feedbin, GReader, Inoreader
}
export interface ServiceConfigs {
    type: SyncService
    importGroups?: boolean
}

export const enum WindowStateListenerType {
    Maximized, Focused
}

export interface TouchBarTexts {
    menu: string
    search: string
    refresh: string
    markAll: string
    notifications: string
}

export type SchemaTypes = {
    version: string
    theme: ThemeSettings
    pac: string
    pacOn: boolean
    view: ViewType
    locale: string
    sourceGroups: SourceGroup[]
    fontSize: number
    menuOn: boolean
    fetchInterval: number
    searchEngine: SearchEngines
    serviceConfigs: ServiceConfigs
    filterType: number
    listViewConfigs: ViewConfigs
    useNeDB: boolean
}
