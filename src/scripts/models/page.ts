import { ALL, SOURCE, FeedIdType } from "./feed"
import { getWindowBreakpoint } from "../utils"

export const SELECT_PAGE = "SELECT_PAGE"

export enum PageType {
    AllArticles, Sources, Page
}

interface SelectPageAction {
    type: typeof SELECT_PAGE
    pageType: PageType
    init: boolean
    keepMenu: boolean
    sids?: number[]
    menuKey?: string
    title?: string
}

export type PageActionTypes = SelectPageAction

export function selectAllArticles(init = false): SelectPageAction {
    return {
        type: SELECT_PAGE,
        keepMenu: getWindowBreakpoint(),
        pageType: PageType.AllArticles,
        init: init
    }
}

export function selectSources(sids: number[], menuKey: string, title: string) {
    return {
        type: SELECT_PAGE,
        pageType: PageType.Sources,
        keepMenu: getWindowBreakpoint(),
        sids: sids,
        menuKey: menuKey,
        title: title,
        init: true
    }
}

export class PageState {
    feedId = ALL
}

export function pageReducer(
    state = new PageState(),
    action: PageActionTypes
): PageState {
    switch (action.type) {
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
                default: return state
            }
        default: return state
    }
}