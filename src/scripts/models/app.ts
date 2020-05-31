import { RSSSource, INIT_SOURCES, SourceActionTypes, ADD_SOURCE } from "./source"
import { RSSItem, ItemActionTypes, FETCH_ITEMS, fetchItems } from "./item"
import { ActionStatus, AppThunk } from "../utils"
import { INIT_FEEDS, FeedActionTypes, ALL, initFeeds } from "./feed"
import { PageActionTypes, SELECT_PAGE, PageType, selectAllArticles } from "./page"

export enum ContextMenuType {
    Hidden, Item
}

export enum MenuStatus {
    Hidden, Open, Pinned
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
    sourceInit = false
    feedInit = false
    fetchingItems = false
    menu = MenuStatus.Hidden
    menuKey = ALL
    title = "全部文章"
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
        target?: RSSItem | RSSSource
    }

    constructor() {
        this.contextMenu = {
            type: ContextMenuType.Hidden
        }
    }
}

export const CLOSE_CONTEXT_MENU = "CLOSE_CONTEXT_MENU"
export const OPEN_ITEM_MENU = "OPEN_ITEM_MENU"

interface CloseContextMenuAction {
    type: typeof CLOSE_CONTEXT_MENU
}

interface OpenItemMenuAction {
    type: typeof OPEN_ITEM_MENU
    event: MouseEvent
    item: RSSItem
}

export type ContextMenuActionTypes = CloseContextMenuAction | OpenItemMenuAction

export const TOGGLE_LOGS = "TOGGLE_LOGS"
export interface LogMenuActionType { type: typeof TOGGLE_LOGS }

export const OPEN_MENU = "OPEN_MENU"
export const CLOSE_MENU = "CLOSE_MENU"

export interface MenuActionTypes {
    type: typeof OPEN_MENU | typeof CLOSE_MENU
}

export const TOGGLE_SETTINGS = "TOGGLE_SETTINGS"
export const SAVE_SETTINGS = "SAVE_SETTINGS"

export interface SettingsActionTypes {
    type: typeof TOGGLE_SETTINGS | typeof SAVE_SETTINGS
}

export function closeContextMenu(): ContextMenuActionTypes {
    return { type: CLOSE_CONTEXT_MENU }
}

export function openItemMenu(item: RSSItem, event: React.MouseEvent): ContextMenuActionTypes {
    return {
        type: OPEN_ITEM_MENU,
        event: event.nativeEvent,
        item: item
    }
}

export const openMenu = () => ({ type: OPEN_MENU })
export const closeMenu = () => ({ type: CLOSE_MENU })
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

export function appReducer(
    state = new AppState(),
    action: SourceActionTypes | ItemActionTypes | ContextMenuActionTypes | SettingsActionTypes
        | MenuActionTypes | LogMenuActionType | FeedActionTypes | PageActionTypes
): AppState {
    switch (action.type) {
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
                    fetchingItems: false,
                    settings: {
                        ...state.settings,
                        saving: false
                    }
                }
            }
        case INIT_FEEDS:
            switch (action.status) {
                case ActionStatus.Request: return {
                    ...state,
                    feedInit: false
                }
                default: return {
                    ...state,
                    feedInit: true
                }
            }
        case FETCH_ITEMS:
            switch (action.status) {
                case ActionStatus.Request: return {
                    ...state,
                    fetchingItems: true
                }
                case ActionStatus.Failure: return {
                    ...state,
                    logMenu: {
                        ...state.logMenu,
                        notify: true,
                        logs: [...state.logMenu.logs, new AppLog(
                            AppLogType.Failure,
                            `无法加载订阅源“${action.errSource.name}”`,
                            String(action.err)
                        )]
                    }
                }
                case ActionStatus.Success: return {
                    ...state,
                    fetchingItems: false,
                    logMenu: action.items.length == 0 ? state.logMenu : {
                        ...state.logMenu,
                        logs: [...state.logMenu.logs, new AppLog(
                            AppLogType.Info,
                            `成功加载 ${action.items.length} 篇文章`
                        )]
                    }
                }
            }
        case SELECT_PAGE: 
            switch (action.pageType) {
                case PageType.AllArticles: return {
                    ...state,
                    menu: MenuStatus.Hidden,
                    menuKey: ALL,
                    title: "全部文章"
                }
                case PageType.Sources: return {
                    ...state,
                    menu: MenuStatus.Hidden,
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
                target: action.item
            }
        }
        case OPEN_MENU: return {
            ...state,
            menu: MenuStatus.Open
        }
        case CLOSE_MENU: return {
            ...state,
            menu: MenuStatus.Hidden
        }
        case SAVE_SETTINGS: return {
            ...state,
            settings: {
                ...state.settings,
                saving: true
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