"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pageReducer = exports.PageState = exports.performSearch = exports.toggleFilter = exports.switchFilter = exports.showOffsetItem = exports.toggleSearch = exports.dismissItem = exports.showItemFromId = exports.showItem = exports.setViewConfigs = exports.switchView = exports.selectSources = exports.selectAllArticles = exports.PageType = exports.TOGGLE_SEARCH = exports.APPLY_FILTER = exports.DISMISS_ITEM = exports.SHOW_OFFSET_ITEM = exports.SHOW_ITEM = exports.SET_VIEW_CONFIGS = exports.SWITCH_VIEW = exports.SELECT_PAGE = void 0;
const feed_1 = require("./feed");
const utils_1 = require("../utils");
const item_1 = require("./item");
const source_1 = require("./source");
const app_1 = require("./app");
exports.SELECT_PAGE = "SELECT_PAGE";
exports.SWITCH_VIEW = "SWITCH_VIEW";
exports.SET_VIEW_CONFIGS = "SET_VIEW_CONFIGS";
exports.SHOW_ITEM = "SHOW_ITEM";
exports.SHOW_OFFSET_ITEM = "SHOW_OFFSET_ITEM";
exports.DISMISS_ITEM = "DISMISS_ITEM";
exports.APPLY_FILTER = "APPLY_FILTER";
exports.TOGGLE_SEARCH = "TOGGLE_SEARCH";
var PageType;
(function (PageType) {
    PageType[PageType["AllArticles"] = 0] = "AllArticles";
    PageType[PageType["Sources"] = 1] = "Sources";
    PageType[PageType["Page"] = 2] = "Page";
})(PageType = exports.PageType || (exports.PageType = {}));
function selectAllArticles(init = false) {
    return (dispatch, getState) => {
        dispatch({
            type: exports.SELECT_PAGE,
            keepMenu: (0, utils_1.getWindowBreakpoint)(),
            filter: getState().page.filter,
            pageType: PageType.AllArticles,
            init: init,
        });
    };
}
exports.selectAllArticles = selectAllArticles;
function selectSources(sids, menuKey, title) {
    return (dispatch, getState) => {
        if (getState().app.menuKey !== menuKey) {
            dispatch({
                type: exports.SELECT_PAGE,
                pageType: PageType.Sources,
                keepMenu: (0, utils_1.getWindowBreakpoint)(),
                filter: getState().page.filter,
                sids: sids,
                menuKey: menuKey,
                title: title,
                init: true,
            });
        }
    };
}
exports.selectSources = selectSources;
function switchView(viewType) {
    return {
        type: exports.SWITCH_VIEW,
        viewType: viewType,
    };
}
exports.switchView = switchView;
function setViewConfigs(configs) {
    return (dispatch, getState) => {
        window.settings.setViewConfigs(getState().page.viewType, configs);
        dispatch({
            type: "SET_VIEW_CONFIGS",
            configs: configs,
        });
    };
}
exports.setViewConfigs = setViewConfigs;
function showItem(feedId, item) {
    return (dispatch, getState) => {
        const state = getState();
        if (state.items.hasOwnProperty(item._id) &&
            state.sources.hasOwnProperty(item.source)) {
            dispatch({
                type: exports.SHOW_ITEM,
                feedId: feedId,
                item: item,
            });
        }
    };
}
exports.showItem = showItem;
function showItemFromId(iid) {
    return (dispatch, getState) => {
        const state = getState();
        const item = state.items[iid];
        if (!item.hasRead)
            dispatch((0, item_1.markRead)(item));
        if (item)
            dispatch(showItem(null, item));
    };
}
exports.showItemFromId = showItemFromId;
const dismissItem = () => ({ type: exports.DISMISS_ITEM });
exports.dismissItem = dismissItem;
const toggleSearch = () => {
    return (dispatch, getState) => {
        let state = getState();
        dispatch({ type: exports.TOGGLE_SEARCH });
        if (!(0, utils_1.getWindowBreakpoint)() && state.app.menu) {
            dispatch((0, app_1.toggleMenu)());
        }
        if (state.page.searchOn) {
            dispatch(applyFilter({
                ...state.page.filter,
                search: "",
            }));
        }
    };
};
exports.toggleSearch = toggleSearch;
function showOffsetItem(offset) {
    return (dispatch, getState) => {
        let state = getState();
        if (!state.page.itemFromFeed)
            return;
        let [itemId, feedId] = [state.page.itemId, state.page.feedId];
        let feed = state.feeds[feedId];
        let iids = feed.iids;
        let itemIndex = iids.indexOf(itemId);
        let newIndex = itemIndex + offset;
        if (itemIndex < 0) {
            let item = state.items[itemId];
            let prevs = feed.iids
                .map((id, index) => [state.items[id], index])
                .filter(([i, _]) => i.date > item.date);
            if (prevs.length > 0) {
                let prev = prevs[0];
                for (let j = 1; j < prevs.length; j += 1) {
                    if (prevs[j][0].date < prev[0].date)
                        prev = prevs[j];
                }
                newIndex = prev[1] + offset + (offset < 0 ? 1 : 0);
            }
            else {
                newIndex = offset - 1;
            }
        }
        if (newIndex >= 0) {
            if (newIndex < iids.length) {
                let item = state.items[iids[newIndex]];
                dispatch((0, item_1.markRead)(item));
                dispatch(showItem(feedId, item));
                return;
            }
            else if (!feed.allLoaded) {
                dispatch((0, feed_1.loadMore)(feed))
                    .then(() => {
                    dispatch(showOffsetItem(offset));
                })
                    .catch(() => dispatch((0, exports.dismissItem)()));
                return;
            }
        }
        dispatch((0, exports.dismissItem)());
    };
}
exports.showOffsetItem = showOffsetItem;
const applyFilterDone = (filter) => ({
    type: exports.APPLY_FILTER,
    filter: filter,
});
function applyFilter(filter) {
    return (dispatch, getState) => {
        const oldFilterType = getState().page.filter.type;
        if (filter.type !== oldFilterType)
            window.settings.setFilterType(filter.type);
        dispatch(applyFilterDone(filter));
        dispatch((0, feed_1.initFeeds)(true));
    };
}
function switchFilter(filter) {
    return (dispatch, getState) => {
        let oldFilter = getState().page.filter;
        let oldType = oldFilter.type;
        let newType = filter | (oldType & feed_1.FilterType.Toggles);
        if (oldType != newType) {
            dispatch(applyFilter({
                ...oldFilter,
                type: newType,
            }));
        }
    };
}
exports.switchFilter = switchFilter;
function toggleFilter(filter) {
    return (dispatch, getState) => {
        let nextFilter = { ...getState().page.filter };
        nextFilter.type ^= filter;
        dispatch(applyFilter(nextFilter));
    };
}
exports.toggleFilter = toggleFilter;
function performSearch(query) {
    return (dispatch, getState) => {
        let state = getState();
        if (state.page.searchOn) {
            dispatch(applyFilter({
                ...state.page.filter,
                search: query,
            }));
        }
    };
}
exports.performSearch = performSearch;
class PageState {
    constructor() {
        this.viewType = window.settings.getDefaultView();
        this.viewConfigs = window.settings.getViewConfigs(window.settings.getDefaultView());
        this.filter = new feed_1.FeedFilter();
        this.feedId = feed_1.ALL;
        this.itemId = null;
        this.itemFromFeed = true;
        this.searchOn = false;
    }
}
exports.PageState = PageState;
function pageReducer(state = new PageState(), action) {
    switch (action.type) {
        case exports.SELECT_PAGE:
            switch (action.pageType) {
                case PageType.AllArticles:
                    return {
                        ...state,
                        feedId: feed_1.ALL,
                        itemId: null,
                    };
                case PageType.Sources:
                    return {
                        ...state,
                        feedId: feed_1.SOURCE,
                        itemId: null,
                    };
                default:
                    return state;
            }
        case exports.SWITCH_VIEW:
            return {
                ...state,
                viewType: action.viewType,
                viewConfigs: window.settings.getViewConfigs(action.viewType),
                itemId: null,
            };
        case exports.SET_VIEW_CONFIGS:
            return {
                ...state,
                viewConfigs: action.configs,
            };
        case exports.APPLY_FILTER:
            return {
                ...state,
                filter: action.filter,
            };
        case exports.SHOW_ITEM:
            return {
                ...state,
                itemId: action.item._id,
                itemFromFeed: Boolean(action.feedId),
            };
        case feed_1.INIT_FEED:
            switch (action.status) {
                case utils_1.ActionStatus.Success:
                    return {
                        ...state,
                        itemId: action.feed._id === state.feedId &&
                            action.items.filter(i => i._id === state.itemId)
                                .length === 0
                            ? null
                            : state.itemId,
                    };
                default:
                    return state;
            }
        case source_1.DELETE_SOURCE:
        case exports.DISMISS_ITEM:
            return {
                ...state,
                itemId: null,
            };
        case exports.TOGGLE_SEARCH:
            return {
                ...state,
                searchOn: !state.searchOn,
            };
        default:
            return state;
    }
}
exports.pageReducer = pageReducer;
