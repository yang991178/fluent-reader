"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feedReducer = exports.loadMore = exports.loadMoreFailure = exports.loadMoreSuccess = exports.loadMoreRequest = exports.initFeeds = exports.initFeedFailure = exports.initFeedSuccess = exports.initFeedsSuccess = exports.initFeedsRequest = exports.dismissItems = exports.DISMISS_ITEMS = exports.LOAD_MORE = exports.INIT_FEED = exports.INIT_FEEDS = exports.RSSFeed = exports.SOURCE = exports.ALL = exports.FeedFilter = exports.FilterType = void 0;
const db = __importStar(require("../db"));
const lovefield_1 = __importDefault(require("lovefield"));
const source_1 = require("./source");
const item_1 = require("./item");
const utils_1 = require("../utils");
const page_1 = require("./page");
var FilterType;
(function (FilterType) {
    FilterType[FilterType["None"] = 0] = "None";
    FilterType[FilterType["ShowRead"] = 1] = "ShowRead";
    FilterType[FilterType["ShowNotStarred"] = 2] = "ShowNotStarred";
    FilterType[FilterType["ShowHidden"] = 4] = "ShowHidden";
    FilterType[FilterType["FullSearch"] = 8] = "FullSearch";
    FilterType[FilterType["CaseInsensitive"] = 16] = "CaseInsensitive";
    FilterType[FilterType["CreatorSearch"] = 32] = "CreatorSearch";
    FilterType[FilterType["Default"] = 3] = "Default";
    FilterType[FilterType["UnreadOnly"] = 2] = "UnreadOnly";
    FilterType[FilterType["StarredOnly"] = 1] = "StarredOnly";
    FilterType[FilterType["Toggles"] = 28] = "Toggles";
})(FilterType = exports.FilterType || (exports.FilterType = {}));
class FeedFilter {
    constructor(type = null, search = "") {
        if (type === null &&
            (type = window.settings.getFilterType()) === null) {
            type = FilterType.Default | FilterType.CaseInsensitive;
        }
        this.type = type;
        this.search = search;
    }
    static toPredicates(filter) {
        let type = filter.type;
        const predicates = new Array();
        if (!(type & FilterType.ShowRead))
            predicates.push(db.items.hasRead.eq(false));
        if (!(type & FilterType.ShowNotStarred))
            predicates.push(db.items.starred.eq(true));
        if (!(type & FilterType.ShowHidden))
            predicates.push(db.items.hidden.eq(false));
        if (filter.search !== "") {
            const flags = type & FilterType.CaseInsensitive ? "i" : "";
            const regex = RegExp(filter.search, flags);
            if (type & FilterType.FullSearch) {
                predicates.push(lovefield_1.default.op.or(db.items.title.match(regex), db.items.snippet.match(regex)));
            }
            else {
                predicates.push(db.items.title.match(regex));
            }
        }
        return predicates;
    }
    static testItem(filter, item) {
        let type = filter.type;
        let flag = true;
        if (!(type & FilterType.ShowRead))
            flag = flag && !item.hasRead;
        if (!(type & FilterType.ShowNotStarred))
            flag = flag && item.starred;
        if (!(type & FilterType.ShowHidden))
            flag = flag && !item.hidden;
        if (filter.search !== "") {
            const flags = type & FilterType.CaseInsensitive ? "i" : "";
            const regex = RegExp(filter.search, flags);
            if (type & FilterType.FullSearch) {
                flag =
                    flag && (regex.test(item.title) || regex.test(item.snippet));
            }
            else if (type & FilterType.CreatorSearch) {
                flag = flag && regex.test(item.creator || "");
            }
            else {
                flag = flag && regex.test(item.title);
            }
        }
        return Boolean(flag);
    }
}
exports.FeedFilter = FeedFilter;
exports.ALL = "ALL";
exports.SOURCE = "SOURCE";
const LOAD_QUANTITY = 50;
class RSSFeed {
    constructor(id = null, sids = [], filter = null) {
        this._id = id;
        this.sids = sids;
        this.iids = [];
        this.loaded = false;
        this.allLoaded = false;
        this.filter = filter === null ? new FeedFilter() : filter;
    }
    static async loadFeed(feed, skip = 0) {
        const predicates = FeedFilter.toPredicates(feed.filter);
        predicates.push(db.items.source.in(feed.sids));
        return (await db.itemsDB
            .select()
            .from(db.items)
            .where(lovefield_1.default.op.and.apply(null, predicates))
            .orderBy(db.items.date, lovefield_1.default.Order.DESC)
            .skip(skip)
            .limit(LOAD_QUANTITY)
            .exec());
    }
}
exports.RSSFeed = RSSFeed;
exports.INIT_FEEDS = "INIT_FEEDS";
exports.INIT_FEED = "INIT_FEED";
exports.LOAD_MORE = "LOAD_MORE";
exports.DISMISS_ITEMS = "DISMISS_ITEMS";
function dismissItems() {
    return (dispatch, getState) => {
        const state = getState();
        let fid = state.page.feedId;
        let filter = state.feeds[fid].filter;
        let iids = new Set();
        for (let iid of state.feeds[fid].iids) {
            let item = state.items[iid];
            if (!FeedFilter.testItem(filter, item)) {
                iids.add(iid);
            }
        }
        dispatch({
            type: exports.DISMISS_ITEMS,
            fid: fid,
            iids: iids,
        });
    };
}
exports.dismissItems = dismissItems;
function initFeedsRequest() {
    return {
        type: exports.INIT_FEEDS,
        status: utils_1.ActionStatus.Request,
    };
}
exports.initFeedsRequest = initFeedsRequest;
function initFeedsSuccess() {
    return {
        type: exports.INIT_FEEDS,
        status: utils_1.ActionStatus.Success,
    };
}
exports.initFeedsSuccess = initFeedsSuccess;
function initFeedSuccess(feed, items) {
    return {
        type: exports.INIT_FEED,
        status: utils_1.ActionStatus.Success,
        items: items,
        feed: feed,
    };
}
exports.initFeedSuccess = initFeedSuccess;
function initFeedFailure(err) {
    return {
        type: exports.INIT_FEED,
        status: utils_1.ActionStatus.Failure,
        err: err,
    };
}
exports.initFeedFailure = initFeedFailure;
function initFeeds(force = false) {
    return (dispatch, getState) => {
        dispatch(initFeedsRequest());
        let promises = new Array();
        for (let feed of Object.values(getState().feeds)) {
            if (!feed.loaded || force) {
                let p = RSSFeed.loadFeed(feed)
                    .then(items => {
                    dispatch(initFeedSuccess(feed, items));
                })
                    .catch(err => {
                    console.log(err);
                    dispatch(initFeedFailure(err));
                });
                promises.push(p);
            }
        }
        return Promise.allSettled(promises).then(() => {
            dispatch(initFeedsSuccess());
        });
    };
}
exports.initFeeds = initFeeds;
function loadMoreRequest(feed) {
    return {
        type: exports.LOAD_MORE,
        status: utils_1.ActionStatus.Request,
        feed: feed,
    };
}
exports.loadMoreRequest = loadMoreRequest;
function loadMoreSuccess(feed, items) {
    return {
        type: exports.LOAD_MORE,
        status: utils_1.ActionStatus.Success,
        feed: feed,
        items: items,
    };
}
exports.loadMoreSuccess = loadMoreSuccess;
function loadMoreFailure(feed, err) {
    return {
        type: exports.LOAD_MORE,
        status: utils_1.ActionStatus.Failure,
        feed: feed,
        err: err,
    };
}
exports.loadMoreFailure = loadMoreFailure;
function loadMore(feed) {
    return (dispatch, getState) => {
        if (feed.loaded && !feed.loading && !feed.allLoaded) {
            dispatch(loadMoreRequest(feed));
            const state = getState();
            const skipNum = feed.iids.filter(i => FeedFilter.testItem(feed.filter, state.items[i])).length;
            return RSSFeed.loadFeed(feed, skipNum)
                .then(items => {
                dispatch(loadMoreSuccess(feed, items));
            })
                .catch(e => {
                console.log(e);
                dispatch(loadMoreFailure(feed, e));
            });
        }
        return new Promise((_, reject) => {
            reject();
        });
    };
}
exports.loadMore = loadMore;
function feedReducer(state = { [exports.ALL]: new RSSFeed(exports.ALL) }, action) {
    switch (action.type) {
        case source_1.INIT_SOURCES:
            switch (action.status) {
                case utils_1.ActionStatus.Success:
                    return {
                        ...state,
                        [exports.ALL]: new RSSFeed(exports.ALL, Object.values(action.sources).map(s => s.sid)),
                    };
                default:
                    return state;
            }
        case source_1.ADD_SOURCE:
            switch (action.status) {
                case utils_1.ActionStatus.Success:
                    return {
                        ...state,
                        [exports.ALL]: new RSSFeed(exports.ALL, [...state[exports.ALL].sids, action.source.sid], state[exports.ALL].filter),
                    };
                default:
                    return state;
            }
        case source_1.DELETE_SOURCE: {
            let nextState = {};
            for (let [id, feed] of Object.entries(state)) {
                nextState[id] = new RSSFeed(id, feed.sids.filter(sid => sid != action.source.sid), feed.filter);
            }
            return nextState;
        }
        case page_1.APPLY_FILTER: {
            let nextState = {};
            for (let [id, feed] of Object.entries(state)) {
                nextState[id] = {
                    ...feed,
                    filter: action.filter,
                };
            }
            return nextState;
        }
        case item_1.FETCH_ITEMS:
            switch (action.status) {
                case utils_1.ActionStatus.Success: {
                    let nextState = { ...state };
                    for (let feed of Object.values(state)) {
                        if (feed.loaded) {
                            let items = action.items.filter(i => feed.sids.includes(i.source) &&
                                FeedFilter.testItem(feed.filter, i));
                            if (items.length > 0) {
                                let oldItems = feed.iids.map(id => action.itemState[id]);
                                let nextItems = (0, utils_1.mergeSortedArrays)(oldItems, items, (a, b) => b.date.getTime() - a.date.getTime());
                                nextState[feed._id] = {
                                    ...feed,
                                    iids: nextItems.map(i => i._id),
                                };
                            }
                        }
                    }
                    return nextState;
                }
                default:
                    return state;
            }
        case exports.DISMISS_ITEMS:
            let nextState = { ...state };
            let feed = state[action.fid];
            nextState[action.fid] = {
                ...feed,
                iids: feed.iids.filter(iid => !action.iids.has(iid)),
            };
            return nextState;
        case exports.INIT_FEED:
            switch (action.status) {
                case utils_1.ActionStatus.Success:
                    return {
                        ...state,
                        [action.feed._id]: {
                            ...action.feed,
                            loaded: true,
                            allLoaded: action.items.length < LOAD_QUANTITY,
                            iids: action.items.map(i => i._id),
                        },
                    };
                default:
                    return state;
            }
        case exports.LOAD_MORE:
            switch (action.status) {
                case utils_1.ActionStatus.Request:
                    return {
                        ...state,
                        [action.feed._id]: {
                            ...action.feed,
                            loading: true,
                        },
                    };
                case utils_1.ActionStatus.Success:
                    return {
                        ...state,
                        [action.feed._id]: {
                            ...action.feed,
                            loading: false,
                            allLoaded: action.items.length < LOAD_QUANTITY,
                            iids: [
                                ...action.feed.iids,
                                ...action.items.map(i => i._id),
                            ],
                        },
                    };
                case utils_1.ActionStatus.Failure:
                    return {
                        ...state,
                        [action.feed._id]: {
                            ...action.feed,
                            loading: false,
                        },
                    };
                default:
                    return state;
            }
        case item_1.TOGGLE_HIDDEN: {
            let nextItem = (0, item_1.applyItemReduction)(action.item, action.type);
            let filteredFeeds = Object.values(state).filter(feed => feed.loaded && !FeedFilter.testItem(feed.filter, nextItem));
            if (filteredFeeds.length > 0) {
                let nextState = { ...state };
                for (let feed of filteredFeeds) {
                    nextState[feed._id] = {
                        ...feed,
                        iids: feed.iids.filter(id => id != nextItem._id),
                    };
                }
                return nextState;
            }
            else {
                return state;
            }
        }
        case page_1.SELECT_PAGE:
            switch (action.pageType) {
                case page_1.PageType.Sources:
                    return {
                        ...state,
                        [exports.SOURCE]: new RSSFeed(exports.SOURCE, action.sids, action.filter),
                    };
                case page_1.PageType.AllArticles:
                    return action.init
                        ? {
                            ...state,
                            [exports.ALL]: {
                                ...state[exports.ALL],
                                loaded: false,
                                filter: action.filter,
                            },
                        }
                        : state;
                default:
                    return state;
            }
        default:
            return state;
    }
}
exports.feedReducer = feedReducer;
