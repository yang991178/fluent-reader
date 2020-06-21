import intl = require("react-intl-universal")
import { RSSSource, INIT_SOURCES, SourceActionTypes, ADD_SOURCE, UPDATE_SOURCE, DELETE_SOURCE, initSources } from "./source"
import { RSSItem, ItemActionTypes, FETCH_ITEMS, fetchItems } from "./item"
import { ActionStatus, AppThunk, getWindowBreakpoint } from "../utils"
import { INIT_FEEDS, FeedActionTypes, ALL, initFeeds } from "./feed"
import { SourceGroupActionTypes, UPDATE_SOURCE_GROUP, ADD_SOURCE_TO_GROUP, DELETE_SOURCE_GROUP, REMOVE_SOURCE_FROM_GROUP, REORDER_SOURCE_GROUPS } from "./group"
import { PageActionTypes, SELECT_PAGE, PageType, selectAllArticles } from "./page"
import { getCurrentLocale, setDefaultMenu, getDefaultMenu } from "../settings"
import locales from "../i18n/_locales"
import * as db from "../db"

export enum ContextMenuType {
    Hidden, Item, Text, View, Group
}

export enum AppLogType {
    Info, Warning, Failure
}

export class AppLog {
    type: AppLogType
    title: string
    details: string
    time: Date

    constructor(type: AppLogType, title: string, details: string=null) {
        this.type = type
        this.title = title
        this.details = details
        this.time = new Date()
    }
}

export class AppState {
    locale = null as string
    sourceInit = false
    feedInit = false
    fetchingItems = false
    fetchingProgress = 0
    fetchingTotal = 0
    menu = getWindowBreakpoint() && getDefaultMenu()
    menuKey = ALL
    title = ""
    settings = {
        display: false,
        changed: false,
        saving: false
    }
    logMenu = {
        display: false,
        notify: false,
        logs: new Array<AppLog>()
    }
    
    contextMenu: {
        type: ContextMenuType,
        event?: MouseEvent | string,
        position?: [number, number],
        target?: [RSSItem, string] | number[] | string
    }

    constructor() {
        this.contextMenu = {
            type: ContextMenuType.Hidden
        }
    }
}

export const CLOSE_CONTEXT_MENU = "CLOSE_CONTEXT_MENU"
export const OPEN_ITEM_MENU = "OPEN_ITEM_MENU"
export const OPEN_TEXT_MENU = "OPEN_TEXT_MENU"
export const OPEN_VIEW_MENU = "OPEN_VIEW_MENU"
export const OPEN_GROUP_MENU = "OPEN_GROUP_MENU"

interface CloseContextMenuAction {
    type: typeof CLOSE_CONTEXT_MENU
}

interface OpenItemMenuAction {
    type: typeof OPEN_ITEM_MENU
    event: MouseEvent
    item: RSSItem
    feedId: string
}

interface OpenTextMenuAction {
    type: typeof OPEN_TEXT_MENU
    position: [number, number]
    item: string
}

interface OpenViewMenuAction {
    type: typeof OPEN_VIEW_MENU
}

interface OpenGroupMenuAction {
    type: typeof OPEN_GROUP_MENU
    event: MouseEvent
    sids: number[]
}

export type ContextMenuActionTypes = CloseContextMenuAction | OpenItemMenuAction 
    | OpenTextMenuAction | OpenViewMenuAction | OpenGroupMenuAction

export const TOGGLE_LOGS = "TOGGLE_LOGS"
export interface LogMenuActionType { type: typeof TOGGLE_LOGS }

export const TOGGLE_MENU = "TOGGLE_MENU"

export interface MenuActionTypes {
    type: typeof TOGGLE_MENU
}

export const TOGGLE_SETTINGS = "TOGGLE_SETTINGS"
export const SAVE_SETTINGS = "SAVE_SETTINGS"

export interface SettingsActionTypes {
    type: typeof TOGGLE_SETTINGS | typeof SAVE_SETTINGS
}

export function closeContextMenu(): ContextMenuActionTypes {
    return { type: CLOSE_CONTEXT_MENU }
}

export function openItemMenu(item: RSSItem, feedId: string, event: React.MouseEvent): ContextMenuActionTypes {
    return {
        type: OPEN_ITEM_MENU,
        event: event.nativeEvent,
        item: item,
        feedId: feedId
    }
}

export function openTextMenu(text: string, position: [number, number]): ContextMenuActionTypes {
    return {
        type: OPEN_TEXT_MENU,
        position: position,
        item: text
    }
}

export const openViewMenu = (): ContextMenuActionTypes => ({ type: OPEN_VIEW_MENU })

export function openGroupMenu(sids: number[], event: React.MouseEvent): ContextMenuActionTypes {
    return {
        type: OPEN_GROUP_MENU,
        event: event.nativeEvent,
        sids: sids
    }
}

export function toggleMenu(): AppThunk {
    return (dispatch, getState) => {
        dispatch({ type: TOGGLE_MENU })
        setDefaultMenu(getState().app.menu)
    }
}

export const toggleLogMenu = () => ({ type: TOGGLE_LOGS })
export const toggleSettings = () => ({ type: TOGGLE_SETTINGS })
export const saveSettings = () => ({ type: SAVE_SETTINGS })

export function exitSettings(): AppThunk {
    return (dispatch, getState) => {
        if (!getState().app.settings.saving) {
            if (getState().app.settings.changed) {
                dispatch(saveSettings())
                dispatch(selectAllArticles(true))
                dispatch(initFeeds(true)).then(() =>
                    dispatch(toggleSettings())
                )
            } else {
                dispatch(toggleSettings())
            }
        }
    }
}

export const INIT_INTL = "INIT_INTL"
export interface InitIntlAction {
    type: typeof INIT_INTL
    locale: string
}
export const initIntlDone = (locale: string): InitIntlAction => ({
    type: INIT_INTL,
    locale: locale
})

export function initIntl(): AppThunk<Promise<void>> {
    return (dispatch) => {
        let locale = getCurrentLocale()
        return intl.init({
            currentLocale: locale,
            locales: locales,
            fallbackLocale: "en-US"
        }).then(() => { dispatch(initIntlDone(locale)) })
    }
}

export function initApp(): AppThunk {
    return (dispatch) => {
        dispatch(initIntl()).then(() =>
            dispatch(initSources())
        ).then(() => 
            dispatch(initFeeds())
        ).then(() => {
            dispatch(selectAllArticles())
            return dispatch(fetchItems())
        }).then(() => {
            db.sdb.persistence.compactDatafile()
            db.idb.persistence.compactDatafile()
        })
    }
}

export function appReducer(
    state = new AppState(),
    action: SourceActionTypes | ItemActionTypes | ContextMenuActionTypes | SettingsActionTypes | InitIntlAction
        | MenuActionTypes | LogMenuActionType | FeedActionTypes | PageActionTypes | SourceGroupActionTypes
): AppState {
    switch (action.type) {
        case INIT_INTL: return {
            ...state,
            locale: action.locale
        }
        case INIT_SOURCES:
            switch (action.status) {
                case ActionStatus.Success: return {
                    ...state,
                    sourceInit: true
                }
                default: return state
            }
        case ADD_SOURCE: 
            switch (action.status) {
                case ActionStatus.Request: return {
                    ...state,
                    fetchingItems: true,
                    settings: {
                        ...state.settings,
                        changed: true,
                        saving: true
                    }
                }
                default: return {
                    ...state,
                    fetchingItems: state.fetchingTotal !== 0,
                    settings: {
                        ...state.settings,
                        saving: action.batch
                    }
                }
            }
        case UPDATE_SOURCE:
        case DELETE_SOURCE:
        case UPDATE_SOURCE_GROUP:
        case ADD_SOURCE_TO_GROUP:
        case REMOVE_SOURCE_FROM_GROUP:
        case REORDER_SOURCE_GROUPS:
        case DELETE_SOURCE_GROUP: return {
            ...state,
            settings: {
                ...state.settings,
                changed: true
            }
        }
        case INIT_FEEDS:
            switch (action.status) {
                case ActionStatus.Request: return state
                default: return {
                    ...state,
                    feedInit: true
                }
            }
        case FETCH_ITEMS:
            switch (action.status) {
                case ActionStatus.Request: return {
                    ...state,
                    fetchingItems: true,
                    fetchingProgress: 0,
                    fetchingTotal: action.fetchCount
                }
                case ActionStatus.Failure: return {
                    ...state,
                    logMenu: {
                        ...state.logMenu,
                        notify: !state.logMenu.display,
                        logs: [...state.logMenu.logs, new AppLog(
                            AppLogType.Failure,
                            intl.get("log.fetchFailure", { name: action.errSource.name }),
                            String(action.err)
                        )]
                    }
                }
                case ActionStatus.Success: return {
                    ...state,
                    fetchingItems: false,
                    fetchingTotal: 0,
                    logMenu: action.items.length == 0 ? state.logMenu : {
                        ...state.logMenu,
                        logs: [...state.logMenu.logs, new AppLog(
                            AppLogType.Info,
                            intl.get("log.fetchSuccess", { count: action.items.length })
                        )]
                    }
                }
                case ActionStatus.Intermediate: return {
                    ...state,
                    fetchingProgress: state.fetchingProgress + 1
                }
                default: return state
            }
        case SELECT_PAGE: 
            switch (action.pageType) {
                case PageType.AllArticles: return {
                    ...state,
                    menu: state.menu && action.keepMenu,
                    menuKey: ALL,
                    title: intl.get("allArticles")
                }
                case PageType.Sources: return {
                    ...state,
                    menu: state.menu && action.keepMenu,
                    menuKey: action.menuKey,
                    title: action.title
                }
            }
        case CLOSE_CONTEXT_MENU: return {
            ...state,
            contextMenu: {
                type: ContextMenuType.Hidden
            }
        }
        case OPEN_ITEM_MENU: return {
            ...state,
            contextMenu: {
                type: ContextMenuType.Item,
                event: action.event,
                target: [action.item, action.feedId]
            }
        }
        case OPEN_TEXT_MENU: return {
            ...state,
            contextMenu: {
                type: ContextMenuType.Text,
                position: action.position,
                target: action.item
            }
        }
        case OPEN_VIEW_MENU: return {
            ...state,
            contextMenu: {
                type: ContextMenuType.View,
                event: "#view-toggle"
            }
        }
        case OPEN_GROUP_MENU: return {
            ...state,
            contextMenu: {
                type: ContextMenuType.Group,
                event: action.event,
                target: action.sids
            }
        }
        case TOGGLE_MENU: return {
            ...state,
            menu: !state.menu
        }
        case SAVE_SETTINGS: return {
            ...state,
            settings: {
                ...state.settings,
                saving: !state.settings.saving
            }
        }
        case TOGGLE_SETTINGS: return {
            ...state,
            settings: {
                display: !state.settings.display,
                changed: false,
                saving: false
            }
        }
        case TOGGLE_LOGS: return {
            ...state,
            logMenu: {
                ...state.logMenu,
                display: !state.logMenu.display,
                notify: false
            }
        }
        default: return state
    }
}