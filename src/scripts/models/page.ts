import { ALL, SOURCE, FeedIdType } from "./feed"
import { getWindowBreakpoint } from "../utils"

export const SELECT_PAGE = "SELECT_PAGE"
export const SHOW_ITEM = "SHOW_ITEM"
export const DISMISS_ITEM = "DISMISS_ITEM"

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

interface ShowItemAction {
    type: typeof SHOW_ITEM
    feedId: FeedIdType
    itemIndex: number
}

interface DismissItemAction { type: typeof DISMISS_ITEM }

export type PageActionTypes = SelectPageAction | ShowItemAction | DismissItemAction

export function selectAllArticles(init = false): PageActionTypes {
    return {
        type: SELECT_PAGE,
        keepMenu: getWindowBreakpoint(),
        pageType: PageType.AllArticles,
        init: init
    }
}

export function selectSources(sids: number[], menuKey: string, title: string): PageActionTypes {
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

export function showItem(feedId: FeedIdType, itemIndex: number): PageActionTypes {
    return {
        type: SHOW_ITEM,
        feedId: feedId,
        itemIndex: itemIndex
    }
}

export const dismissItem = (): PageActionTypes => ({ type: DISMISS_ITEM })

export class PageState {
    feedId = ALL as FeedIdType
    itemIndex = -1
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
        case SHOW_ITEM: return {
            ...state,
            itemIndex: action.itemIndex
        }
        case DISMISS_ITEM: return {
            ...state,
            itemIndex: -1
        }
        default: return state
    }
}