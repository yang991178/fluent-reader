import intl from "react-intl-universal"
import {
    INIT_SOURCES,
    SourceActionTypes,
    ADD_SOURCE,
    UPDATE_SOURCE,
    DELETE_SOURCE,
    initSources,
    SourceOpenTarget,
    updateFavicon,
} from "./source"
import { RSSItem, ItemActionTypes, FETCH_ITEMS, fetchItems } from "./item"
import {
    ActionStatus,
    AppThunk,
    getWindowBreakpoint,
    initTouchBarWithTexts,
} from "../utils"
import { INIT_FEEDS, FeedActionTypes, ALL, initFeeds } from "./feed"
import {
    SourceGroupActionTypes,
    UPDATE_SOURCE_GROUP,
    ADD_SOURCE_TO_GROUP,
    DELETE_SOURCE_GROUP,
    REMOVE_SOURCE_FROM_GROUP,
    REORDER_SOURCE_GROUPS,
} from "./group"
import {
    PageActionTypes,
    SELECT_PAGE,
    PageType,
    selectAllArticles,
    showItemFromId,
} from "./page"
import { getCurrentLocale, setThemeDefaultFont } from "../settings"
import locales from "../i18n/_locales"
import { SYNC_SERVICE, ServiceActionTypes } from "./service"

export const enum ContextMenuType {
    Hidden,
    Item,
    Text,
    View,
    Group,
    Image,
    MarkRead,
}

export const enum AppLogType {
    Info,
    Warning,
    Failure,
    Article,
}

export class AppLog {
    type: AppLogType
    title: string
    details?: string
    iid?: number
    time: Date

    constructor(
        type: AppLogType,
        title: string,
        details: string = null,
        iid: number = null
    ) {
        this.type = type
        this.title = title
        this.details = details
        this.iid = iid
        this.time = new Date()
    }
}

export class AppState {
    locale = null as string
    sourceInit = false
    feedInit = false
    syncing = false
    fetchingItems = false
    fetchingProgress = 0
    fetchingTotal = 0
    lastFetched = new Date()
    menu = getWindowBreakpoint() && window.settings.getDefaultMenu()
    menuKey = ALL
    title = ""
    settings = {
        display: false,
        changed: false,
        sids: new Array<number>(),
        saving: false,
    }
    logMenu = {
        display: false,
        notify: false,
        logs: new Array<AppLog>(),
    }

    contextMenu: {
        type: ContextMenuType
        event?: MouseEvent | string
        position?: [number, number]
        target?: [RSSItem, string] | number[] | [string, string]
    }

    constructor() {
        this.contextMenu = {
            type: ContextMenuType.Hidden,
        }
    }
}

export const CLOSE_CONTEXT_MENU = "CLOSE_CONTEXT_MENU"
export const OPEN_ITEM_MENU = "OPEN_ITEM_MENU"
export const OPEN_TEXT_MENU = "OPEN_TEXT_MENU"
export const OPEN_VIEW_MENU = "OPEN_VIEW_MENU"
export const OPEN_GROUP_MENU = "OPEN_GROUP_MENU"
export const OPEN_IMAGE_MENU = "OPEN_IMAGE_MENU"
export const OPEN_MARK_ALL_MENU = "OPEN_MARK_ALL_MENU"

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
    item: [string, string]
}

interface OpenViewMenuAction {
    type: typeof OPEN_VIEW_MENU
}

interface OpenMarkAllMenuAction {
    type: typeof OPEN_MARK_ALL_MENU
}

interface OpenGroupMenuAction {
    type: typeof OPEN_GROUP_MENU
    event: MouseEvent
    sids: number[]
}

interface OpenImageMenuAction {
    type: typeof OPEN_IMAGE_MENU
    position: [number, number]
}

export type ContextMenuActionTypes =
    | CloseContextMenuAction
    | OpenItemMenuAction
    | OpenTextMenuAction
    | OpenViewMenuAction
    | OpenGroupMenuAction
    | OpenImageMenuAction
    | OpenMarkAllMenuAction

export const TOGGLE_LOGS = "TOGGLE_LOGS"
export const PUSH_NOTIFICATION = "PUSH_NOTIFICATION"

interface ToggleLogMenuAction {
    type: typeof TOGGLE_LOGS
}

interface PushNotificationAction {
    type: typeof PUSH_NOTIFICATION
    iid: number
    title: string
    source: string
}

export type LogMenuActionType = ToggleLogMenuAction | PushNotificationAction

export const TOGGLE_MENU = "TOGGLE_MENU"

export interface MenuActionTypes {
    type: typeof TOGGLE_MENU
}

export const TOGGLE_SETTINGS = "TOGGLE_SETTINGS"
export const SAVE_SETTINGS = "SAVE_SETTINGS"
export const FREE_MEMORY = "FREE_MEMORY"

interface ToggleSettingsAction {
    type: typeof TOGGLE_SETTINGS
    open: boolean
    sids: number[]
}
interface SaveSettingsAction {
    type: typeof SAVE_SETTINGS
}
interface FreeMemoryAction {
    type: typeof FREE_MEMORY
    iids: Set<number>
}
export type SettingsActionTypes =
    | ToggleSettingsAction
    | SaveSettingsAction
    | FreeMemoryAction

export function closeContextMenu(): AppThunk {
    return (dispatch, getState) => {
        if (getState().app.contextMenu.type !== ContextMenuType.Hidden) {
            dispatch({ type: CLOSE_CONTEXT_MENU })
        }
    }
}

export function openItemMenu(
    item: RSSItem,
    feedId: string,
    event: React.MouseEvent
): ContextMenuActionTypes {
    return {
        type: OPEN_ITEM_MENU,
        event: event.nativeEvent,
        item: item,
        feedId: feedId,
    }
}

export function openTextMenu(
    position: [number, number],
    text: string,
    url: string = null
): ContextMenuActionTypes {
    return {
        type: OPEN_TEXT_MENU,
        position: position,
        item: [text, url],
    }
}

export const openViewMenu = (): ContextMenuActionTypes => ({
    type: OPEN_VIEW_MENU,
})

export function openGroupMenu(
    sids: number[],
    event: React.MouseEvent
): ContextMenuActionTypes {
    return {
        type: OPEN_GROUP_MENU,
        event: event.nativeEvent,
        sids: sids,
    }
}

export function openImageMenu(
    position: [number, number]
): ContextMenuActionTypes {
    return {
        type: OPEN_IMAGE_MENU,
        position: position,
    }
}

export const openMarkAllMenu = (): ContextMenuActionTypes => ({
    type: OPEN_MARK_ALL_MENU,
})

export function toggleMenu(): AppThunk {
    return (dispatch, getState) => {
        dispatch({ type: TOGGLE_MENU })
        window.settings.setDefaultMenu(getState().app.menu)
    }
}

export const toggleLogMenu = () => ({ type: TOGGLE_LOGS })
export const saveSettings = () => ({ type: SAVE_SETTINGS })

export const toggleSettings = (open = true, sids = new Array<number>()) => ({
    type: TOGGLE_SETTINGS,
    open: open,
    sids: sids,
})

export function exitSettings(): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        if (!getState().app.settings.saving) {
            if (getState().app.settings.changed) {
                dispatch(saveSettings())
                dispatch(selectAllArticles(true))
                await dispatch(initFeeds(true))
                dispatch(toggleSettings(false))
                freeMemory()
            } else {
                dispatch(toggleSettings(false))
            }
        }
    }
}

function freeMemory(): AppThunk {
    return (dispatch, getState) => {
        const iids = new Set<number>()
        for (let feed of Object.values(getState().feeds)) {
            if (feed.loaded) feed.iids.forEach(iids.add, iids)
        }
        dispatch({
            type: FREE_MEMORY,
            iids: iids,
        })
    }
}

let fetchTimeout: NodeJS.Timeout
export function setupAutoFetch(): AppThunk {
    return (dispatch, getState) => {
        clearTimeout(fetchTimeout)
        const setupTimeout = (interval?: number) => {
            if (!interval) interval = window.settings.getFetchInterval()
            if (interval) {
                fetchTimeout = setTimeout(() => {
                    let state = getState()
                    if (!state.app.settings.display) {
                        if (!state.app.fetchingItems) dispatch(fetchItems(true))
                    } else {
                        setupTimeout(1)
                    }
                }, interval * 60000)
            }
        }
        setupTimeout()
    }
}

export function pushNotification(item: RSSItem): AppThunk {
    return (dispatch, getState) => {
        const sourceName = getState().sources[item.source].name
        if (!window.utils.isFocused()) {
            const options = { body: sourceName } as any
            if (item.thumb) options.icon = item.thumb
            const notification = new Notification(item.title, options)
            notification.onclick = () => {
                const state = getState()
                if (
                    state.sources[item.source].openTarget ===
                    SourceOpenTarget.External
                ) {
                    window.utils.openExternal(item.link)
                } else if (!state.app.settings.display) {
                    window.utils.focus()
                    dispatch(showItemFromId(item._id))
                }
            }
        }
        dispatch({
            type: PUSH_NOTIFICATION,
            iid: item._id,
            title: item.title,
            source: sourceName,
        })
    }
}

export const INIT_INTL = "INIT_INTL"
export interface InitIntlAction {
    type: typeof INIT_INTL
    locale: string
}
export const initIntlDone = (locale: string): InitIntlAction => {
    document.documentElement.lang = locale
    setThemeDefaultFont(locale)
    return {
        type: INIT_INTL,
        locale: locale,
    }
}

export function initIntl(): AppThunk<Promise<void>> {
    return dispatch => {
        let locale = getCurrentLocale()
        return intl
            .init({
                currentLocale: locale,
                locales: locales,
                fallbackLocale: "en-US",
            })
            .then(() => {
                dispatch(initIntlDone(locale))
            })
    }
}

export function initApp(): AppThunk {
    return dispatch => {
        document.body.classList.add(window.utils.platform)
        dispatch(initIntl())
            .then(async () => {
                if (window.utils.platform === "darwin") initTouchBarWithTexts()
                await dispatch(initSources())
            })
            .then(() => dispatch(initFeeds()))
            .then(async () => {
                dispatch(selectAllArticles())
                await dispatch(fetchItems())
            })
            .then(() => {
                dispatch(updateFavicon())
            })
    }
}

export function appReducer(
    state = new AppState(),
    action:
        | SourceActionTypes
        | ItemActionTypes
        | ContextMenuActionTypes
        | SettingsActionTypes
        | InitIntlAction
        | MenuActionTypes
        | LogMenuActionType
        | FeedActionTypes
        | PageActionTypes
        | SourceGroupActionTypes
        | ServiceActionTypes
): AppState {
    switch (action.type) {
        case INIT_INTL:
            return {
                ...state,
                locale: action.locale,
            }
        case INIT_SOURCES:
            switch (action.status) {
                case ActionStatus.Success:
                    return {
                        ...state,
                        sourceInit: true,
                    }
                default:
                    return state
            }
        case ADD_SOURCE:
            switch (action.status) {
                case ActionStatus.Request:
                    return {
                        ...state,
                        fetchingItems: true,
                        settings: {
                            ...state.settings,
                            changed: true,
                            saving: true,
                        },
                    }
                default:
                    return {
                        ...state,
                        fetchingItems: state.fetchingTotal !== 0,
                        settings: {
                            ...state.settings,
                            saving: action.batch,
                        },
                    }
            }
        case UPDATE_SOURCE:
        case DELETE_SOURCE:
        case UPDATE_SOURCE_GROUP:
        case ADD_SOURCE_TO_GROUP:
        case REMOVE_SOURCE_FROM_GROUP:
        case REORDER_SOURCE_GROUPS:
        case DELETE_SOURCE_GROUP:
            return {
                ...state,
                settings: {
                    ...state.settings,
                    changed: true,
                },
            }
        case INIT_FEEDS:
            switch (action.status) {
                case ActionStatus.Request:
                    return state
                default:
                    return {
                        ...state,
                        feedInit: true,
                    }
            }
        case SYNC_SERVICE:
            switch (action.status) {
                case ActionStatus.Request:
                    return {
                        ...state,
                        syncing: true,
                    }
                case ActionStatus.Failure:
                    return {
                        ...state,
                        syncing: false,
                        logMenu: {
                            ...state.logMenu,
                            notify: true,
                            logs: [
                                ...state.logMenu.logs,
                                new AppLog(
                                    AppLogType.Failure,
                                    intl.get("log.syncFailure"),
                                    String(action.err)
                                ),
                            ],
                        },
                    }
                default:
                    return {
                        ...state,
                        syncing: false,
                    }
            }
        case FETCH_ITEMS:
            switch (action.status) {
                case ActionStatus.Request:
                    return {
                        ...state,
                        fetchingItems: true,
                        fetchingProgress: 0,
                        fetchingTotal: action.fetchCount,
                    }
                case ActionStatus.Failure:
                    return {
                        ...state,
                        logMenu: {
                            ...state.logMenu,
                            notify: !state.logMenu.display,
                            logs: [
                                ...state.logMenu.logs,
                                new AppLog(
                                    AppLogType.Failure,
                                    intl.get("log.fetchFailure", {
                                        name: action.errSource.name,
                                    }),
                                    String(action.err)
                                ),
                            ],
                        },
                    }
                case ActionStatus.Success:
                    return {
                        ...state,
                        fetchingItems: false,
                        fetchingTotal: 0,
                        logMenu:
                            action.items.length == 0
                                ? state.logMenu
                                : {
                                      ...state.logMenu,
                                      logs: [
                                          ...state.logMenu.logs,
                                          new AppLog(
                                              AppLogType.Info,
                                              intl.get("log.fetchSuccess", {
                                                  count: action.items.length,
                                              })
                                          ),
                                      ],
                                  },
                    }
                case ActionStatus.Intermediate:
                    return {
                        ...state,
                        fetchingProgress: state.fetchingProgress + 1,
                    }
                default:
                    return state
            }
        case SELECT_PAGE:
            switch (action.pageType) {
                case PageType.AllArticles:
                    return {
                        ...state,
                        menu: state.menu && action.keepMenu,
                        menuKey: ALL,
                        title: intl.get("allArticles"),
                    }
                case PageType.Sources:
                    return {
                        ...state,
                        menu: state.menu && action.keepMenu,
                        menuKey: action.menuKey,
                        title: action.title,
                    }
            }
        case CLOSE_CONTEXT_MENU:
            return {
                ...state,
                contextMenu: {
                    type: ContextMenuType.Hidden,
                },
            }
        case OPEN_ITEM_MENU:
            return {
                ...state,
                contextMenu: {
                    type: ContextMenuType.Item,
                    event: action.event,
                    target: [action.item, action.feedId],
                },
            }
        case OPEN_TEXT_MENU:
            return {
                ...state,
                contextMenu: {
                    type: ContextMenuType.Text,
                    position: action.position,
                    target: action.item,
                },
            }
        case OPEN_VIEW_MENU:
            return {
                ...state,
                contextMenu: {
                    type:
                        state.contextMenu.type === ContextMenuType.View
                            ? ContextMenuType.Hidden
                            : ContextMenuType.View,
                    event: "#view-toggle",
                },
            }
        case OPEN_GROUP_MENU:
            return {
                ...state,
                contextMenu: {
                    type: ContextMenuType.Group,
                    event: action.event,
                    target: action.sids,
                },
            }
        case OPEN_IMAGE_MENU:
            return {
                ...state,
                contextMenu: {
                    type: ContextMenuType.Image,
                    position: action.position,
                },
            }
        case OPEN_MARK_ALL_MENU:
            return {
                ...state,
                contextMenu: {
                    type:
                        state.contextMenu.type === ContextMenuType.MarkRead
                            ? ContextMenuType.Hidden
                            : ContextMenuType.MarkRead,
                    event: "#mark-all-toggle",
                },
            }
        case TOGGLE_MENU:
            return {
                ...state,
                menu: !state.menu,
            }
        case SAVE_SETTINGS:
            return {
                ...state,
                settings: {
                    ...state.settings,
                    display: true,
                    changed: true,
                    saving: !state.settings.saving,
                },
            }
        case TOGGLE_SETTINGS:
            return {
                ...state,
                settings: {
                    display: action.open,
                    changed: false,
                    sids: action.sids,
                    saving: false,
                },
            }
        case TOGGLE_LOGS:
            return {
                ...state,
                logMenu: {
                    ...state.logMenu,
                    display: !state.logMenu.display,
                    notify: false,
                },
            }
        case PUSH_NOTIFICATION:
            return {
                ...state,
                logMenu: {
                    ...state.logMenu,
                    notify: true,
                    logs: [
                        ...state.logMenu.logs,
                        new AppLog(
                            AppLogType.Article,
                            action.title,
                            action.source,
                            action.iid
                        ),
                    ],
                },
            }
        default:
            return state
    }
}
