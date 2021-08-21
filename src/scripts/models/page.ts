import {
    ALL,
    SOURCE,
    loadMore,
    FeedFilter,
    FilterType,
    initFeeds,
    FeedActionTypes,
    INIT_FEED,
} from "./feed"
import { getWindowBreakpoint, AppThunk, ActionStatus } from "../utils"
import { RSSItem, markRead } from "./item"
import { SourceActionTypes, DELETE_SOURCE } from "./source"
import { toggleMenu } from "./app"
import { ViewType, ViewConfigs } from "../../schema-types"

export const SELECT_PAGE = "SELECT_PAGE"
export const SWITCH_VIEW = "SWITCH_VIEW"
export const SET_VIEW_CONFIGS = "SET_VIEW_CONFIGS"
export const SHOW_ITEM = "SHOW_ITEM"
export const SHOW_OFFSET_ITEM = "SHOW_OFFSET_ITEM"
export const DISMISS_ITEM = "DISMISS_ITEM"
export const APPLY_FILTER = "APPLY_FILTER"
export const TOGGLE_SEARCH = "TOGGLE_SEARCH"

export enum PageType {
    AllArticles,
    Sources,
    Page,
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

interface SetViewConfigsAction {
    type: typeof SET_VIEW_CONFIGS
    configs: ViewConfigs
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

interface DismissItemAction {
    type: typeof DISMISS_ITEM
}
interface ToggleSearchAction {
    type: typeof TOGGLE_SEARCH
}

export type PageActionTypes =
    | SelectPageAction
    | SwitchViewAction
    | ShowItemAction
    | DismissItemAction
    | ApplyFilterAction
    | ToggleSearchAction
    | SetViewConfigsAction

export function selectAllArticles(init = false): AppThunk {
    return (dispatch, getState) => {
        dispatch({
            type: SELECT_PAGE,
            keepMenu: getWindowBreakpoint(),
            filter: getState().page.filter,
            pageType: PageType.AllArticles,
            init: init,
        } as PageActionTypes)
    }
}

export function selectSources(
    sids: number[],
    menuKey: string,
    title: string
): AppThunk {
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
                init: true,
            } as PageActionTypes)
        }
    }
}

export function switchView(viewType: ViewType): PageActionTypes {
    return {
        type: SWITCH_VIEW,
        viewType: viewType,
    }
}

export function setViewConfigs(configs: ViewConfigs): AppThunk {
    return (dispatch, getState) => {
        window.settings.setViewConfigs(getState().page.viewType, configs)
        dispatch({
            type: "SET_VIEW_CONFIGS",
            configs: configs,
        })
    }
}

export function showItem(feedId: string, item: RSSItem): AppThunk {
    return (dispatch, getState) => {
        const state = getState()
        if (
            state.items.hasOwnProperty(item._id) &&
            state.sources.hasOwnProperty(item.source)
        ) {
            dispatch({
                type: SHOW_ITEM,
                feedId: feedId,
                item: item,
            })
        }
    }
}
export function showItemFromId(iid: number): AppThunk {
    return (dispatch, getState) => {
        const state = getState()
        const item = state.items[iid]
        if (!item.hasRead) dispatch(markRead(item))
        if (item) dispatch(showItem(null, item))
    }
}

export const dismissItem = (): PageActionTypes => ({ type: DISMISS_ITEM })

export const toggleSearch = (): AppThunk => {
    return (dispatch, getState) => {
        let state = getState()
        dispatch({ type: TOGGLE_SEARCH })
        if (!getWindowBreakpoint() && state.app.menu) {
            dispatch(toggleMenu())
        }
        if (state.page.searchOn) {
            dispatch(
                applyFilter({
                    ...state.page.filter,
                    search: "",
                })
            )
        }
    }
}

export function showOffsetItem(offset: number): AppThunk {
    return (dispatch, getState) => {
        let state = getState()
        if (!state.page.itemFromFeed) return
        let [itemId, feedId] = [state.page.itemId, state.page.feedId]
        let feed = state.feeds[feedId]
        let iids = feed.iids
        let itemIndex = iids.indexOf(itemId)
        let newIndex = itemIndex + offset
        if (itemIndex < 0) {
            let item = state.items[itemId]
            let prevs = feed.iids
                .map(
                    (id, index) => [state.items[id], index] as [RSSItem, number]
                )
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
            } else if (!feed.allLoaded) {
                dispatch(loadMore(feed))
                    .then(() => {
                        dispatch(showOffsetItem(offset))
                    })
                    .catch(() => dispatch(dismissItem()))
                return
            }
        }
        dispatch(dismissItem())
    }
}

const applyFilterDone = (filter: FeedFilter): PageActionTypes => ({
    type: APPLY_FILTER,
    filter: filter,
})

function applyFilter(filter: FeedFilter): AppThunk {
    return (dispatch, getState) => {
        const oldFilterType = getState().page.filter.type
        if (filter.type !== oldFilterType)
            window.settings.setFilterType(filter.type)
        dispatch(applyFilterDone(filter))
        dispatch(initFeeds(true))
    }
}

export function switchFilter(filter: FilterType): AppThunk {
    return (dispatch, getState) => {
        let oldFilter = getState().page.filter
        let oldType = oldFilter.type
        let newType = filter | (oldType & FilterType.Toggles)
        if (oldType != newType) {
            dispatch(
                applyFilter({
                    ...oldFilter,
                    type: newType,
                })
            )
        }
    }
}

export function toggleFilter(filter: FilterType): AppThunk {
    return (dispatch, getState) => {
        let nextFilter = { ...getState().page.filter }
        nextFilter.type ^= filter
        dispatch(applyFilter(nextFilter))
    }
}

export function performSearch(query: string): AppThunk {
    return (dispatch, getState) => {
        let state = getState()
        if (state.page.searchOn) {
            dispatch(
                applyFilter({
                    ...state.page.filter,
                    search: query,
                })
            )
        }
    }
}

export class PageState {
    viewType = window.settings.getDefaultView()
    viewConfigs = window.settings.getViewConfigs(
        window.settings.getDefaultView()
    )
    filter = new FeedFilter()
    feedId = ALL
    itemId = null as number
    itemFromFeed = true
    searchOn = false
}

export function pageReducer(
    state = new PageState(),
    action: PageActionTypes | SourceActionTypes | FeedActionTypes
): PageState {
    switch (action.type) {
        case SELECT_PAGE:
            switch (action.pageType) {
                case PageType.AllArticles:
                    return {
                        ...state,
                        feedId: ALL,
                        itemId: null,
                    }
                case PageType.Sources:
                    return {
                        ...state,
                        feedId: SOURCE,
                        itemId: null,
                    }
                default:
                    return state
            }
        case SWITCH_VIEW:
            return {
                ...state,
                viewType: action.viewType,
                viewConfigs: window.settings.getViewConfigs(action.viewType),
                itemId: null,
            }
        case SET_VIEW_CONFIGS:
            return {
                ...state,
                viewConfigs: action.configs,
            }
        case APPLY_FILTER:
            return {
                ...state,
                filter: action.filter,
            }
        case SHOW_ITEM:
            return {
                ...state,
                itemId: action.item._id,
                itemFromFeed: Boolean(action.feedId),
            }
        case INIT_FEED:
            switch (action.status) {
                case ActionStatus.Success:
                    return {
                        ...state,
                        itemId:
                            action.feed._id === state.feedId &&
                            action.items.filter(i => i._id === state.itemId)
                                .length === 0
                                ? null
                                : state.itemId,
                    }
                default:
                    return state
            }
        case DELETE_SOURCE:
        case DISMISS_ITEM:
            return {
                ...state,
                itemId: null,
            }
        case TOGGLE_SEARCH:
            return {
                ...state,
                searchOn: !state.searchOn,
            }
        default:
            return state
    }
}
