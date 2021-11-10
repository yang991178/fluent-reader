"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appReducer = exports.initApp = exports.initIntl = exports.initIntlDone = exports.INIT_INTL = exports.pushNotification = exports.setupAutoFetch = exports.exitSettings = exports.toggleSettings = exports.saveSettings = exports.toggleLogMenu = exports.toggleMenu = exports.openMarkAllMenu = exports.openImageMenu = exports.openGroupMenu = exports.openViewMenu = exports.openTextMenu = exports.openItemMenu = exports.closeContextMenu = exports.FREE_MEMORY = exports.SAVE_SETTINGS = exports.TOGGLE_SETTINGS = exports.TOGGLE_MENU = exports.PUSH_NOTIFICATION = exports.TOGGLE_LOGS = exports.OPEN_MARK_ALL_MENU = exports.OPEN_IMAGE_MENU = exports.OPEN_GROUP_MENU = exports.OPEN_VIEW_MENU = exports.OPEN_TEXT_MENU = exports.OPEN_ITEM_MENU = exports.CLOSE_CONTEXT_MENU = exports.AppState = exports.AppLog = void 0;
const react_intl_universal_1 = __importDefault(require("react-intl-universal"));
const source_1 = require("./source");
const item_1 = require("./item");
const utils_1 = require("../utils");
const feed_1 = require("./feed");
const group_1 = require("./group");
const page_1 = require("./page");
const settings_1 = require("../settings");
const _locales_1 = __importDefault(require("../i18n/_locales"));
const service_1 = require("./service");
class AppLog {
    constructor(type, title, details = null, iid = null) {
        this.type = type;
        this.title = title;
        this.details = details;
        this.iid = iid;
        this.time = new Date();
    }
}
exports.AppLog = AppLog;
class AppState {
    constructor() {
        this.locale = null;
        this.sourceInit = false;
        this.feedInit = false;
        this.syncing = false;
        this.fetchingItems = false;
        this.fetchingProgress = 0;
        this.fetchingTotal = 0;
        this.lastFetched = new Date();
        this.menu = (0, utils_1.getWindowBreakpoint)() && window.settings.getDefaultMenu();
        this.menuKey = feed_1.ALL;
        this.title = "";
        this.settings = {
            display: false,
            changed: false,
            sids: new Array(),
            saving: false,
        };
        this.logMenu = {
            display: false,
            notify: false,
            logs: new Array(),
        };
        this.contextMenu = {
            type: 0 /* Hidden */,
        };
    }
}
exports.AppState = AppState;
exports.CLOSE_CONTEXT_MENU = "CLOSE_CONTEXT_MENU";
exports.OPEN_ITEM_MENU = "OPEN_ITEM_MENU";
exports.OPEN_TEXT_MENU = "OPEN_TEXT_MENU";
exports.OPEN_VIEW_MENU = "OPEN_VIEW_MENU";
exports.OPEN_GROUP_MENU = "OPEN_GROUP_MENU";
exports.OPEN_IMAGE_MENU = "OPEN_IMAGE_MENU";
exports.OPEN_MARK_ALL_MENU = "OPEN_MARK_ALL_MENU";
exports.TOGGLE_LOGS = "TOGGLE_LOGS";
exports.PUSH_NOTIFICATION = "PUSH_NOTIFICATION";
exports.TOGGLE_MENU = "TOGGLE_MENU";
exports.TOGGLE_SETTINGS = "TOGGLE_SETTINGS";
exports.SAVE_SETTINGS = "SAVE_SETTINGS";
exports.FREE_MEMORY = "FREE_MEMORY";
function closeContextMenu() {
    return (dispatch, getState) => {
        if (getState().app.contextMenu.type !== 0 /* Hidden */) {
            dispatch({ type: exports.CLOSE_CONTEXT_MENU });
        }
    };
}
exports.closeContextMenu = closeContextMenu;
function openItemMenu(item, feedId, event) {
    return {
        type: exports.OPEN_ITEM_MENU,
        event: event.nativeEvent,
        item: item,
        feedId: feedId,
    };
}
exports.openItemMenu = openItemMenu;
function openTextMenu(position, text, url = null) {
    return {
        type: exports.OPEN_TEXT_MENU,
        position: position,
        item: [text, url],
    };
}
exports.openTextMenu = openTextMenu;
const openViewMenu = () => ({
    type: exports.OPEN_VIEW_MENU,
});
exports.openViewMenu = openViewMenu;
function openGroupMenu(sids, event) {
    return {
        type: exports.OPEN_GROUP_MENU,
        event: event.nativeEvent,
        sids: sids,
    };
}
exports.openGroupMenu = openGroupMenu;
function openImageMenu(position) {
    return {
        type: exports.OPEN_IMAGE_MENU,
        position: position,
    };
}
exports.openImageMenu = openImageMenu;
const openMarkAllMenu = () => ({
    type: exports.OPEN_MARK_ALL_MENU,
});
exports.openMarkAllMenu = openMarkAllMenu;
function toggleMenu() {
    return (dispatch, getState) => {
        dispatch({ type: exports.TOGGLE_MENU });
        window.settings.setDefaultMenu(getState().app.menu);
    };
}
exports.toggleMenu = toggleMenu;
const toggleLogMenu = () => ({ type: exports.TOGGLE_LOGS });
exports.toggleLogMenu = toggleLogMenu;
const saveSettings = () => ({ type: exports.SAVE_SETTINGS });
exports.saveSettings = saveSettings;
const toggleSettings = (open = true, sids = new Array()) => ({
    type: exports.TOGGLE_SETTINGS,
    open: open,
    sids: sids,
});
exports.toggleSettings = toggleSettings;
function exitSettings() {
    return async (dispatch, getState) => {
        if (!getState().app.settings.saving) {
            if (getState().app.settings.changed) {
                dispatch((0, exports.saveSettings)());
                dispatch((0, page_1.selectAllArticles)(true));
                await dispatch((0, feed_1.initFeeds)(true));
                dispatch((0, exports.toggleSettings)(false));
                freeMemory();
            }
            else {
                dispatch((0, exports.toggleSettings)(false));
            }
        }
    };
}
exports.exitSettings = exitSettings;
function freeMemory() {
    return (dispatch, getState) => {
        const iids = new Set();
        for (let feed of Object.values(getState().feeds)) {
            if (feed.loaded)
                feed.iids.forEach(iids.add, iids);
        }
        dispatch({
            type: exports.FREE_MEMORY,
            iids: iids,
        });
    };
}
let fetchTimeout;
function setupAutoFetch() {
    return (dispatch, getState) => {
        clearTimeout(fetchTimeout);
        const setupTimeout = (interval) => {
            if (!interval)
                interval = window.settings.getFetchInterval();
            if (interval) {
                fetchTimeout = setTimeout(() => {
                    let state = getState();
                    if (!state.app.settings.display) {
                        if (!state.app.fetchingItems)
                            dispatch((0, item_1.fetchItems)(true));
                    }
                    else {
                        setupTimeout(1);
                    }
                }, interval * 60000);
            }
        };
        setupTimeout();
    };
}
exports.setupAutoFetch = setupAutoFetch;
function pushNotification(item) {
    return (dispatch, getState) => {
        const sourceName = getState().sources[item.source].name;
        if (!window.utils.isFocused()) {
            const options = { body: sourceName };
            if (item.thumb)
                options.icon = item.thumb;
            const notification = new Notification(item.title, options);
            notification.onclick = () => {
                const state = getState();
                if (state.sources[item.source].openTarget ===
                    2 /* External */) {
                    window.utils.openExternal(item.link);
                }
                else if (!state.app.settings.display) {
                    window.utils.focus();
                    dispatch((0, page_1.showItemFromId)(item._id));
                }
            };
        }
        dispatch({
            type: exports.PUSH_NOTIFICATION,
            iid: item._id,
            title: item.title,
            source: sourceName,
        });
    };
}
exports.pushNotification = pushNotification;
exports.INIT_INTL = "INIT_INTL";
const initIntlDone = (locale) => ({
    type: exports.INIT_INTL,
    locale: locale,
});
exports.initIntlDone = initIntlDone;
function initIntl() {
    return dispatch => {
        let locale = (0, settings_1.getCurrentLocale)();
        return react_intl_universal_1.default
            .init({
            currentLocale: locale,
            locales: _locales_1.default,
            fallbackLocale: "en-US",
        })
            .then(() => {
            dispatch((0, exports.initIntlDone)(locale));
        });
    };
}
exports.initIntl = initIntl;
function initApp() {
    return dispatch => {
        document.body.classList.add(window.utils.platform);
        dispatch(initIntl())
            .then(async () => {
            if (window.utils.platform === "darwin")
                (0, utils_1.initTouchBarWithTexts)();
            await dispatch((0, source_1.initSources)());
        })
            .then(() => dispatch((0, feed_1.initFeeds)()))
            .then(async () => {
            dispatch((0, page_1.selectAllArticles)());
            await dispatch((0, item_1.fetchItems)());
        })
            .then(() => {
            dispatch((0, source_1.updateFavicon)());
        });
    };
}
exports.initApp = initApp;
function appReducer(state = new AppState(), action) {
    switch (action.type) {
        case exports.INIT_INTL:
            return {
                ...state,
                locale: action.locale,
            };
        case source_1.INIT_SOURCES:
            switch (action.status) {
                case utils_1.ActionStatus.Success:
                    return {
                        ...state,
                        sourceInit: true,
                    };
                default:
                    return state;
            }
        case source_1.ADD_SOURCE:
            switch (action.status) {
                case utils_1.ActionStatus.Request:
                    return {
                        ...state,
                        fetchingItems: true,
                        settings: {
                            ...state.settings,
                            changed: true,
                            saving: true,
                        },
                    };
                default:
                    return {
                        ...state,
                        fetchingItems: state.fetchingTotal !== 0,
                        settings: {
                            ...state.settings,
                            saving: action.batch,
                        },
                    };
            }
        case source_1.UPDATE_SOURCE:
        case source_1.DELETE_SOURCE:
        case group_1.UPDATE_SOURCE_GROUP:
        case group_1.ADD_SOURCE_TO_GROUP:
        case group_1.REMOVE_SOURCE_FROM_GROUP:
        case group_1.REORDER_SOURCE_GROUPS:
        case group_1.DELETE_SOURCE_GROUP:
            return {
                ...state,
                settings: {
                    ...state.settings,
                    changed: true,
                },
            };
        case feed_1.INIT_FEEDS:
            switch (action.status) {
                case utils_1.ActionStatus.Request:
                    return state;
                default:
                    return {
                        ...state,
                        feedInit: true,
                    };
            }
        case service_1.SYNC_SERVICE:
            switch (action.status) {
                case utils_1.ActionStatus.Request:
                    return {
                        ...state,
                        syncing: true,
                    };
                case utils_1.ActionStatus.Failure:
                    return {
                        ...state,
                        syncing: false,
                        logMenu: {
                            ...state.logMenu,
                            notify: true,
                            logs: [
                                ...state.logMenu.logs,
                                new AppLog(2 /* Failure */, react_intl_universal_1.default.get("log.syncFailure"), String(action.err)),
                            ],
                        },
                    };
                default:
                    return {
                        ...state,
                        syncing: false,
                    };
            }
        case item_1.FETCH_ITEMS:
            switch (action.status) {
                case utils_1.ActionStatus.Request:
                    return {
                        ...state,
                        fetchingItems: true,
                        fetchingProgress: 0,
                        fetchingTotal: action.fetchCount,
                    };
                case utils_1.ActionStatus.Failure:
                    return {
                        ...state,
                        logMenu: {
                            ...state.logMenu,
                            notify: !state.logMenu.display,
                            logs: [
                                ...state.logMenu.logs,
                                new AppLog(2 /* Failure */, react_intl_universal_1.default.get("log.fetchFailure", {
                                    name: action.errSource.name,
                                }), String(action.err)),
                            ],
                        },
                    };
                case utils_1.ActionStatus.Success:
                    return {
                        ...state,
                        fetchingItems: false,
                        fetchingTotal: 0,
                        logMenu: action.items.length == 0
                            ? state.logMenu
                            : {
                                ...state.logMenu,
                                logs: [
                                    ...state.logMenu.logs,
                                    new AppLog(0 /* Info */, react_intl_universal_1.default.get("log.fetchSuccess", {
                                        count: action.items.length,
                                    })),
                                ],
                            },
                    };
                case utils_1.ActionStatus.Intermediate:
                    return {
                        ...state,
                        fetchingProgress: state.fetchingProgress + 1,
                    };
                default:
                    return state;
            }
        case page_1.SELECT_PAGE:
            switch (action.pageType) {
                case page_1.PageType.AllArticles:
                    return {
                        ...state,
                        menu: state.menu && action.keepMenu,
                        menuKey: feed_1.ALL,
                        title: react_intl_universal_1.default.get("allArticles"),
                    };
                case page_1.PageType.Sources:
                    return {
                        ...state,
                        menu: state.menu && action.keepMenu,
                        menuKey: action.menuKey,
                        title: action.title,
                    };
            }
        case exports.CLOSE_CONTEXT_MENU:
            return {
                ...state,
                contextMenu: {
                    type: 0 /* Hidden */,
                },
            };
        case exports.OPEN_ITEM_MENU:
            return {
                ...state,
                contextMenu: {
                    type: 1 /* Item */,
                    event: action.event,
                    target: [action.item, action.feedId],
                },
            };
        case exports.OPEN_TEXT_MENU:
            return {
                ...state,
                contextMenu: {
                    type: 2 /* Text */,
                    position: action.position,
                    target: action.item,
                },
            };
        case exports.OPEN_VIEW_MENU:
            return {
                ...state,
                contextMenu: {
                    type: state.contextMenu.type === 3 /* View */
                        ? 0 /* Hidden */
                        : 3 /* View */,
                    event: "#view-toggle",
                },
            };
        case exports.OPEN_GROUP_MENU:
            return {
                ...state,
                contextMenu: {
                    type: 4 /* Group */,
                    event: action.event,
                    target: action.sids,
                },
            };
        case exports.OPEN_IMAGE_MENU:
            return {
                ...state,
                contextMenu: {
                    type: 5 /* Image */,
                    position: action.position,
                },
            };
        case exports.OPEN_MARK_ALL_MENU:
            return {
                ...state,
                contextMenu: {
                    type: state.contextMenu.type === 6 /* MarkRead */
                        ? 0 /* Hidden */
                        : 6 /* MarkRead */,
                    event: "#mark-all-toggle",
                },
            };
        case exports.TOGGLE_MENU:
            return {
                ...state,
                menu: !state.menu,
            };
        case exports.SAVE_SETTINGS:
            return {
                ...state,
                settings: {
                    ...state.settings,
                    display: true,
                    changed: true,
                    saving: !state.settings.saving,
                },
            };
        case exports.TOGGLE_SETTINGS:
            return {
                ...state,
                settings: {
                    display: action.open,
                    changed: false,
                    sids: action.sids,
                    saving: false,
                },
            };
        case exports.TOGGLE_LOGS:
            return {
                ...state,
                logMenu: {
                    ...state.logMenu,
                    display: !state.logMenu.display,
                    notify: false,
                },
            };
        case exports.PUSH_NOTIFICATION:
            return {
                ...state,
                logMenu: {
                    ...state.logMenu,
                    notify: true,
                    logs: [
                        ...state.logMenu.logs,
                        new AppLog(3 /* Article */, action.title, action.source, action.iid),
                    ],
                },
            };
        default:
            return state;
    }
}
exports.appReducer = appReducer;
