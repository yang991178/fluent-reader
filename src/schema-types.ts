export class SourceGroup {
    isMultiple: boolean
    sids: number[]
    name?: string
    expanded?: boolean
    index?: number // available only from groups tab container

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
    None, Fever
}
export interface ServiceConfigs {
    type: SyncService
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
}
