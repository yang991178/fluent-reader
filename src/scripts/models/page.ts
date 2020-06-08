import { ALL, SOURCE, FeedIdType, loadMore } from "./feed"
import { getWindowBreakpoint, AppThunk, getDefaultView } from "../utils"
import { RSSItem, markRead } from "./item"
import { SourceActionTypes, DELETE_SOURCE } from "./source"

export const SELECT_PAGE = "SELECT_PAGE"
export const SWITCH_VIEW = "SWITCH_VIEW"
export const SHOW_ITEM = "SHOW_ITEM"
export const SHOW_OFFSET_ITEM = "SHOW_OFFSET_ITEM"
export const DISMISS_ITEM = "DISMISS_ITEM"

export enum PageType {
    AllArticles, Sources, Page
}

export enum ViewType {
    Cards, List, Customized
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

interface SwitchViewAction {
    type: typeof SWITCH_VIEW
    viewType: ViewType
}

interface ShowItemAction {
    type: typeof SHOW_ITEM
    feedId: FeedIdType
    item: RSSItem
}

interface DismissItemAction { type: typeof DISMISS_ITEM }

export type PageActionTypes = SelectPageAction | SwitchViewAction | ShowItemAction | DismissItemAction

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

export function switchView(viewType: ViewType): PageActionTypes {
    return {
        type: SWITCH_VIEW,
        viewType: viewType
    }
}

export function showItem(feedId: FeedIdType, item: RSSItem): PageActionTypes {
    return {
        type: SHOW_ITEM,
        feedId: feedId,
        item: item
    }
}

export const dismissItem = (): PageActionTypes => ({ type: DISMISS_ITEM })

export function showOffsetItem(offset: number): AppThunk {
    return (dispatch, getState) => {
        let state = getState()
        let [itemId, feedId] = [state.page.itemId, state.page.feedId]
        let feed = state.feeds[feedId]
        let iids = feed.iids
        let itemIndex = iids.indexOf(itemId)
        let newIndex = itemIndex + offset
        if (itemIndex >= 0 && newIndex >= 0) {
            if (newIndex < iids.length) {
                let item = state.items[iids[newIndex]]
                dispatch(markRead(item))
                dispatch(showItem(feedId, item))
                return
            } else if (!feed.allLoaded){
                dispatch(loadMore(feed)).then(() => {
                    dispatch(showOffsetItem(offset))
                }).catch(() => 
                    dispatch(dismissItem())
                )
                return
            }
        }
        dispatch(dismissItem())
    }
}

export class PageState {
    viewType = getDefaultView()
    feedId = ALL as FeedIdType
    itemId = -1
}

export function pageReducer(
    state = new PageState(),
    action: PageActionTypes | SourceActionTypes
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
        case SWITCH_VIEW: return {
            ...state,
            viewType: action.viewType,
            itemId: action.viewType === ViewType.List ? state.itemId : -1
        }
        case SHOW_ITEM: return {
            ...state,
            itemId: action.item.id
        }
        case DELETE_SOURCE:
        case DISMISS_ITEM: return {
            ...state,
            itemId: -1
        }
        default: return state
    }
}