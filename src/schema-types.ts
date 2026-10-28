export class SourceGroup {
    gid: number // persistent identity independent of display order
    isMultiple: boolean
    sids: number[]
    name?: string
    expanded?: boolean

    constructor(gid: number, sids: number[], name: string = null) {
        this.gid = gid
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
    Cards,
    List,
    Magazine,
    Compact,
    Customized,
}

export const ARTICLE_OVERLAY_MIN_WIDTH = 860
export const LIST_VIEW_MIN_WIDTH = 350
// Preserve the article space at the existing 992px minimum window width.
export const LIST_ARTICLE_MIN_WIDTH = 992 - LIST_VIEW_MIN_WIDTH

export const enum ViewConfigs {
    ShowCover = 1 << 0,
    ShowSnippet = 1 << 1,
    FadeRead = 1 << 2,
}

export const enum ThemeSettings {
    Default = "system",
    Light = "light",
    Dark = "dark",
}

export const enum SearchEngines {
    Google,
    Bing,
    Baidu,
    DuckDuckGo,
}

export const enum ImageCallbackTypes {
    OpenExternal,
    OpenExternalBg,
    SaveAs,
    Copy,
    CopyLink,
}

export const enum SyncService {
    None,
    Fever,
    Feedbin,
    GReader,
    Inoreader,
    Miniflux,
    Nextcloud,
}
export interface ServiceConfigs {
    type: SyncService
    importGroups?: boolean
}

export const enum WindowStateListenerType {
    Maximized,
    Focused,
    Fullscreen,
}

export interface TouchBarTexts {
    menu: string
    search: string
    refresh: string
    markAll: string
    notifications: string
}

export type RuleTarget =
    | { type: "source"; sid: number }
    | { type: "group"; gid: number }
    | { type: "all" }

export interface StoredRule {
    filter: number
    search: string
    match: boolean
    actions: string[]
}

export type RuleTargetKey = "all" | `source:${number}` | `group:${number}`
export type StoredRules = Partial<Record<RuleTargetKey, StoredRule[]>>

export function getRuleTargetKey(target: RuleTarget): RuleTargetKey {
    switch (target.type) {
        case "source":
            return `source:${target.sid}`
        case "group":
            return `group:${target.gid}`
        case "all":
            return "all"
    }
}

export type SchemaTypes = {
    version: string
    theme: ThemeSettings
    pac: string
    pacOn: boolean
    view: ViewType
    locale: string
    sourceGroups: SourceGroup[]
    nextGroupId: number
    fontSize: number
    fontFamily: string
    articleOverlayWidth: number
    listViewWidth: number
    menuOn: boolean
    fetchInterval: number
    searchEngine: SearchEngines
    serviceConfigs: ServiceConfigs
    filterType: number
    listViewConfigs: ViewConfigs
    menuUnreadSourcesOnly: boolean
    sourceRules: StoredRules
    dbVersion: string
}
