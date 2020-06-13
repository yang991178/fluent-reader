import { ALL, SOURCE, loadMore, FeedFilter, initFeeds } from "./feed"
import { getWindowBreakpoint, AppThunk } from "../utils"
import { getDefaultView } from "../settings"
import { RSSItem, markRead } from "./item"
import { SourceActionTypes, DELETE_SOURCE } from "./source"

export const SELECT_PAGE = "SELECT_PAGE"
export const SWITCH_VIEW = "SWITCH_VIEW"
export const SHOW_ITEM = "SHOW_ITEM"
export const SHOW_OFFSET_ITEM = "SHOW_OFFSET_ITEM"
export const DISMISS_ITEM = "DISMISS_ITEM"
export const APPLY_FILTER = "APPLY_FILTER"

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
    filter: FeedFilter
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
    feedId: string
    item: RSSItem
}

interface ApplyFilterAction {
    type: typeof APPLY_FILTER
    filter: FeedFilter
}

interface DismissItemAction { type: typeof DISMISS_ITEM }

export type PageActionTypes = SelectPageAction | SwitchViewAction | ShowItemAction | DismissItemAction | ApplyFilterAction

export function selectAllArticles(init = false): AppThunk {
    return (dispatch, getState) => {
        dispatch({
            type: SELECT_PAGE,
            keepMenu: getWindowBreakpoint(),
            filter: getState().page.filter,
            pageType: PageType.AllArticles,
            init: init
        } as PageActionTypes)
    }
}

export function selectSources(sids: number[], menuKey: string, title: string): AppThunk {
    return (dispatch, getState) => {
        if (getState().app.menuKey !== menuKey) {
            dispatch({
                type: SELECT_PAGE,
                pageType: PageType.Sources,
                keepMenu: getWindowBreakpoint(),
                filter: getState().page.filter,
                sids: sids,
                menuKey: menuKey,
                title: title,
                init: true
            } as PageActionTypes)
        }    
    }
}

export function switchView(viewType: ViewType): PageActionTypes {
    return {
        type: SWITCH_VIEW,
        viewType: viewType
    }
}

export function showItem(feedId: string, item: RSSItem): PageActionTypes {
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
        if (itemIndex < 0) {
            let item = state.items[itemId]
            let prevs = feed.iids
                .map((id, index) => [state.items[id], index] as [RSSItem, number])
                .filter(([i, _]) => i.date > item.date)
            if (prevs.length > 0) {
                let prev = prevs[0]
                for (let j = 1; j < prevs.length; j += 1) {
                    if (prevs[j][0].date < prev[0].date) prev = prevs[j]
                }
                newIndex = prev[1] + offset + (offset < 0 ? 1 : 0)
            } else {
                newIndex = offset - 1
            }
        }
        if (newIndex >= 0) {
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

const applyFilterDone = (filter: FeedFilter): PageActionTypes => ({
    type: APPLY_FILTER,
    filter: filter
})

function applyFilter(filter: FeedFilter): AppThunk {
    return (dispatch) => {
        dispatch(applyFilterDone(filter))
        dispatch(initFeeds(true))
    }
}

export function switchFilter(filter: FeedFilter): AppThunk {
    return (dispatch, getState) => {
        let oldFilter = getState().page.filter
        let newFilter = filter | (oldFilter & FeedFilter.ShowHidden)
        if (newFilter != oldFilter) {
            dispatch(applyFilter(newFilter))
        }
    }
}

export function toggleFilter(filter: FeedFilter): AppThunk {
    return (dispatch, getState) => {
        let oldFilter = getState().page.filter
        dispatch(applyFilter(oldFilter ^ filter))
    }
}

export class PageState {
    viewType = getDefaultView()
    filter = FeedFilter.Default
    feedId = ALL
    itemId = null as string
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
            itemId: action.viewType === ViewType.List ? state.itemId : null
        }
        case APPLY_FILTER: return {
            ...state,
            filter: action.filter
        }
        case SHOW_ITEM: return {
            ...state,
            itemId: action.item._id
        }
        case DELETE_SOURCE:
        case DISMISS_ITEM: return {
            ...state,
            itemId: null
        }
        default: return state
    }
}