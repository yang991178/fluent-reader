import { RSSSource, SourceActionTypes, INIT_SOURCES, ADD_SOURCE, DELETE_SOURCE } from "./source"
import { ALL, SOURCE } from "./feed"
import { ActionStatus } from "../utils"

const GROUPS_STORE_KEY = "sourceGroups"

export class SourceGroup {
    isMultiple: boolean
    sids: number[]
    name?: string

    constructor(sources: RSSSource[], name: string = "订阅源组") {
        if (sources.length == 1) {
            this.isMultiple = false
        } else {
            this.isMultiple = true
            this.name = name
        }
        this.sids = sources.map(s => s.sid)
    }

    static save(groups: SourceGroup[]) {
        localStorage.setItem(GROUPS_STORE_KEY, JSON.stringify(groups))
    }

    static load(): SourceGroup[] {
        return <SourceGroup[]>JSON.parse(localStorage.getItem(GROUPS_STORE_KEY))
    }
}

export const SELECT_PAGE = "SELECT_PAGE"

export enum PageType {
    AllArticles, Sources, Page
}

interface SelectPageAction {
    type: typeof SELECT_PAGE
    pageType: PageType
    init: boolean
    sids?: number[]
    menuKey?: string
    title?: string
}

export type PageActionTypes = SelectPageAction

export function selectAllArticles(init = false): SelectPageAction {
    return {
        type: SELECT_PAGE,
        pageType: PageType.AllArticles,
        init: init
    }
}

export function selectSources(sids: number[], menuKey: string, title: string) {
    return {
        type: SELECT_PAGE,
        pageType: PageType.Sources,
        sids: sids,
        menuKey: menuKey,
        title: title,
        init: true
    }
}

export class PageState {
    feedId = ALL
    sourceGroups = SourceGroup.load()
}


export function pageReducer(
    state = new PageState(),
    action: PageActionTypes | SourceActionTypes
): PageState {
    switch(action.type) {
        case ADD_SOURCE:
            switch (action.status) {
                case ActionStatus.Success: return {
                    ...state,
                    sourceGroups: [
                        ...state.sourceGroups,
                        new SourceGroup([action.source])
                    ]
                }
                default: return state
            }
        case DELETE_SOURCE: return {
            ...state,
            sourceGroups: [
                ...state.sourceGroups.map(group => ({
                    ...group,
                    sids: group.sids.filter(sid => sid != action.source.sid)
                })).filter(g => g.isMultiple || g.sids.length == 1)
            ]
        }
        case SELECT_PAGE:
            switch (action.pageType) {
                case PageType.AllArticles: return {
                    ...state,
                    feedId: ALL
                }
                case PageType.Sources: return {
                    ...state,
                    feedId: SOURCE
                }
            }
        default: return state
    }
}