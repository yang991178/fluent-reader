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
exports.itemReducer = exports.applyItemReduction = exports.itemShortcuts = exports.toggleHidden = exports.toggleStarred = exports.markUnread = exports.markAllRead = exports.markRead = exports.fetchItems = exports.insertItems = exports.fetchItemsIntermediate = exports.fetchItemsFailure = exports.fetchItemsSuccess = exports.fetchItemsRequest = exports.TOGGLE_HIDDEN = exports.TOGGLE_STARRED = exports.MARK_UNREAD = exports.MARK_ALL_READ = exports.MARK_READ = exports.FETCH_ITEMS = exports.RSSItem = void 0;
const db = __importStar(require("../db"));
const lovefield_1 = __importDefault(require("lovefield"));
const react_intl_universal_1 = __importDefault(require("react-intl-universal"));
const utils_1 = require("../utils");
const source_1 = require("./source");
const feed_1 = require("./feed");
const app_1 = require("./app");
const service_1 = require("./service");
class RSSItem {
    constructor(item, source) {
        var _a, _b;
        for (let field of ["title", "link", "creator"]) {
            const content = item[field];
            if (content && typeof content !== "string")
                delete item[field];
        }
        this.source = source.sid;
        this.title = item.title || react_intl_universal_1.default.get("article.untitled");
        this.link = item.link || "";
        this.fetchedDate = new Date();
        this.date = new Date((_b = (_a = item.isoDate) !== null && _a !== void 0 ? _a : item.pubDate) !== null && _b !== void 0 ? _b : this.fetchedDate);
        this.creator = item.creator;
        this.hasRead = false;
        this.starred = false;
        this.hidden = false;
        this.notify = false;
    }
    static parseContent(item, parsed) {
        for (let field of ["thumb", "content", "fullContent"]) {
            const content = parsed[field];
            if (content && typeof content !== "string")
                delete parsed[field];
        }
        if (parsed.fullContent) {
            item.content = parsed.fullContent;
            item.snippet = (0, utils_1.htmlDecode)(parsed.fullContent);
        }
        else {
            item.content = parsed.content || "";
            item.snippet = (0, utils_1.htmlDecode)(parsed.contentSnippet || "");
        }
        if (parsed.thumb) {
            item.thumb = parsed.thumb;
        }
        else if (parsed.image && parsed.image.$ && parsed.image.$.url) {
            item.thumb = parsed.image.$.url;
        }
        else if (parsed.image && typeof parsed.image === "string") {
            item.thumb = parsed.image;
        }
        else if (parsed.mediaContent) {
            let images = parsed.mediaContent.filter(c => c.$ && c.$.medium === "image" && c.$.url);
            if (images.length > 0)
                item.thumb = images[0].$.url;
        }
        if (!item.thumb) {
            let dom = utils_1.domParser.parseFromString(item.content, "text/html");
            let baseEl = dom.createElement("base");
            baseEl.setAttribute("href", item.link.split("/").slice(0, 3).join("/"));
            dom.head.append(baseEl);
            let img = dom.querySelector("img");
            if (img && img.src)
                item.thumb = img.src;
        }
        if (item.thumb &&
            !item.thumb.startsWith("https://") &&
            !item.thumb.startsWith("http://")) {
            delete item.thumb;
        }
    }
}
exports.RSSItem = RSSItem;
exports.FETCH_ITEMS = "FETCH_ITEMS";
exports.MARK_READ = "MARK_READ";
exports.MARK_ALL_READ = "MARK_ALL_READ";
exports.MARK_UNREAD = "MARK_UNREAD";
exports.TOGGLE_STARRED = "TOGGLE_STARRED";
exports.TOGGLE_HIDDEN = "TOGGLE_HIDDEN";
function fetchItemsRequest(fetchCount = 0) {
    return {
        type: exports.FETCH_ITEMS,
        status: utils_1.ActionStatus.Request,
        fetchCount: fetchCount,
    };
}
exports.fetchItemsRequest = fetchItemsRequest;
function fetchItemsSuccess(items, itemState) {
    return {
        type: exports.FETCH_ITEMS,
        status: utils_1.ActionStatus.Success,
        items: items,
        itemState: itemState,
    };
}
exports.fetchItemsSuccess = fetchItemsSuccess;
function fetchItemsFailure(source, err) {
    return {
        type: exports.FETCH_ITEMS,
        status: utils_1.ActionStatus.Failure,
        errSource: source,
        err: err,
    };
}
exports.fetchItemsFailure = fetchItemsFailure;
function fetchItemsIntermediate() {
    return {
        type: exports.FETCH_ITEMS,
        status: utils_1.ActionStatus.Intermediate,
    };
}
exports.fetchItemsIntermediate = fetchItemsIntermediate;
async function insertItems(items) {
    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    const rows = items.map(item => db.items.createRow(item));
    return (await db.itemsDB
        .insert()
        .into(db.items)
        .values(rows)
        .exec());
}
exports.insertItems = insertItems;
function fetchItems(background = false, sids = null) {
    return async (dispatch, getState) => {
        let promises = new Array();
        const initState = getState();
        if (!initState.app.fetchingItems && !initState.app.syncing) {
            if (sids === null ||
                sids.filter(sid => initState.sources[sid].serviceRef !== undefined).length > 0)
                await dispatch((0, service_1.syncWithService)(background));
            let timenow = new Date().getTime();
            const sourcesState = getState().sources;
            let sources = sids === null
                ? Object.values(sourcesState).filter(s => {
                    let last = s.lastFetched ? s.lastFetched.getTime() : 0;
                    return (!s.serviceRef &&
                        (last > timenow ||
                            last + (s.fetchFrequency || 0) * 60000 <=
                                timenow));
                })
                : sids
                    .map(sid => sourcesState[sid])
                    .filter(s => !s.serviceRef);
            for (let source of sources) {
                let promise = source_1.RSSSource.fetchItems(source);
                promise.then(() => dispatch((0, source_1.updateSource)({ ...source, lastFetched: new Date() })));
                promise.finally(() => dispatch(fetchItemsIntermediate()));
                promises.push(promise);
            }
            dispatch(fetchItemsRequest(promises.length));
            const results = await Promise.allSettled(promises);
            return await new Promise((resolve, reject) => {
                let items = new Array();
                results.map((r, i) => {
                    if (r.status === "fulfilled")
                        items.push(...r.value);
                    else {
                        console.log(r.reason);
                        dispatch(fetchItemsFailure(sources[i], r.reason));
                    }
                });
                insertItems(items)
                    .then(inserted => {
                    dispatch(fetchItemsSuccess(inserted.reverse(), getState().items));
                    resolve();
                    if (background) {
                        for (let item of inserted) {
                            if (item.notify) {
                                dispatch((0, app_1.pushNotification)(item));
                            }
                        }
                        if (inserted.length > 0) {
                            window.utils.requestAttention();
                        }
                    }
                    else {
                        dispatch((0, feed_1.dismissItems)());
                    }
                    dispatch((0, app_1.setupAutoFetch)());
                })
                    .catch(err => {
                    dispatch(fetchItemsSuccess([], getState().items));
                    window.utils.showErrorBox("A database error has occurred.", String(err));
                    console.log(err);
                    reject(err);
                });
            });
        }
    };
}
exports.fetchItems = fetchItems;
const markReadDone = (item) => ({
    type: exports.MARK_READ,
    item: item,
});
const markUnreadDone = (item) => ({
    type: exports.MARK_UNREAD,
    item: item,
});
function markRead(item) {
    return dispatch => {
        var _a, _b;
        if (!item.hasRead) {
            db.itemsDB
                .update(db.items)
                .where(db.items._id.eq(item._id))
                .set(db.items.hasRead, true)
                .exec();
            dispatch(markReadDone(item));
            if (item.serviceRef) {
                dispatch((_b = (_a = dispatch((0, service_1.getServiceHooks)())).markRead) === null || _b === void 0 ? void 0 : _b.call(_a, item));
            }
        }
    };
}
exports.markRead = markRead;
function markAllRead(sids = null, date = null, before = true) {
    return async (dispatch, getState) => {
        var _a, _b;
        let state = getState();
        if (sids === null) {
            let feed = state.feeds[state.page.feedId];
            sids = feed.sids;
        }
        const action = (_b = (_a = dispatch((0, service_1.getServiceHooks)())).markAllRead) === null || _b === void 0 ? void 0 : _b.call(_a, sids, date, before);
        if (action)
            await dispatch(action);
        const predicates = [
            db.items.source.in(sids),
            db.items.hasRead.eq(false),
        ];
        if (date) {
            predicates.push(before ? db.items.date.lte(date) : db.items.date.gte(date));
        }
        const query = lovefield_1.default.op.and.apply(null, predicates);
        await db.itemsDB
            .update(db.items)
            .set(db.items.hasRead, true)
            .where(query)
            .exec();
        if (date) {
            dispatch({
                type: exports.MARK_ALL_READ,
                sids: sids,
                time: date.getTime(),
                before: before,
            });
            dispatch((0, source_1.updateUnreadCounts)());
        }
        else {
            dispatch({
                type: exports.MARK_ALL_READ,
                sids: sids,
            });
        }
    };
}
exports.markAllRead = markAllRead;
function markUnread(item) {
    return dispatch => {
        var _a, _b;
        if (item.hasRead) {
            db.itemsDB
                .update(db.items)
                .where(db.items._id.eq(item._id))
                .set(db.items.hasRead, false)
                .exec();
            dispatch(markUnreadDone(item));
            if (item.serviceRef) {
                dispatch((_b = (_a = dispatch((0, service_1.getServiceHooks)())).markUnread) === null || _b === void 0 ? void 0 : _b.call(_a, item));
            }
        }
    };
}
exports.markUnread = markUnread;
const toggleStarredDone = (item) => ({
    type: exports.TOGGLE_STARRED,
    item: item,
});
function toggleStarred(item) {
    return dispatch => {
        var _a, _b;
        db.itemsDB
            .update(db.items)
            .where(db.items._id.eq(item._id))
            .set(db.items.starred, !item.starred)
            .exec();
        dispatch(toggleStarredDone(item));
        if (item.serviceRef) {
            const hooks = dispatch((0, service_1.getServiceHooks)());
            if (item.starred)
                dispatch((_a = hooks.unstar) === null || _a === void 0 ? void 0 : _a.call(hooks, item));
            else
                dispatch((_b = hooks.star) === null || _b === void 0 ? void 0 : _b.call(hooks, item));
        }
    };
}
exports.toggleStarred = toggleStarred;
const toggleHiddenDone = (item) => ({
    type: exports.TOGGLE_HIDDEN,
    item: item,
});
function toggleHidden(item) {
    return dispatch => {
        db.itemsDB
            .update(db.items)
            .where(db.items._id.eq(item._id))
            .set(db.items.hidden, !item.hidden)
            .exec();
        dispatch(toggleHiddenDone(item));
    };
}
exports.toggleHidden = toggleHidden;
function itemShortcuts(item, e) {
    return dispatch => {
        if (e.metaKey)
            return;
        switch (e.key) {
            case "m":
            case "M":
                if (item.hasRead)
                    dispatch(markUnread(item));
                else
                    dispatch(markRead(item));
                break;
            case "b":
            case "B":
                if (!item.hasRead)
                    dispatch(markRead(item));
                window.utils.openExternal(item.link, (0, utils_1.platformCtrl)(e));
                break;
            case "s":
            case "S":
                dispatch(toggleStarred(item));
                break;
            case "h":
            case "H":
                if (!item.hasRead && !item.hidden)
                    dispatch(markRead(item));
                dispatch(toggleHidden(item));
                break;
        }
    };
}
exports.itemShortcuts = itemShortcuts;
function applyItemReduction(item, type) {
    let nextItem = { ...item };
    switch (type) {
        case exports.MARK_READ:
        case exports.MARK_UNREAD: {
            nextItem.hasRead = type === exports.MARK_READ;
            break;
        }
        case exports.TOGGLE_STARRED: {
            nextItem.starred = !item.starred;
            break;
        }
        case exports.TOGGLE_HIDDEN: {
            nextItem.hidden = !item.hidden;
            break;
        }
    }
    return nextItem;
}
exports.applyItemReduction = applyItemReduction;
function itemReducer(state = {}, action) {
    switch (action.type) {
        case exports.FETCH_ITEMS:
            switch (action.status) {
                case utils_1.ActionStatus.Success: {
                    let newMap = {};
                    for (let i of action.items) {
                        newMap[i._id] = i;
                    }
                    return { ...newMap, ...state };
                }
                default:
                    return state;
            }
        case exports.MARK_UNREAD:
        case exports.MARK_READ:
        case exports.TOGGLE_STARRED:
        case exports.TOGGLE_HIDDEN: {
            return {
                ...state,
                [action.item._id]: applyItemReduction(state[action.item._id], action.type),
            };
        }
        case exports.MARK_ALL_READ: {
            let nextState = { ...state };
            let sids = new Set(action.sids);
            for (let item of Object.values(state)) {
                if (sids.has(item.source) && !item.hasRead) {
                    if (!action.time ||
                        (action.before
                            ? item.date.getTime() <= action.time
                            : item.date.getTime() >= action.time)) {
                        nextState[item._id] = {
                            ...item,
                            hasRead: true,
                        };
                    }
                }
            }
            return nextState;
        }
        case feed_1.LOAD_MORE:
        case feed_1.INIT_FEED: {
            switch (action.status) {
                case utils_1.ActionStatus.Success: {
                    let nextState = { ...state };
                    for (let i of action.items) {
                        nextState[i._id] = i;
                    }
                    return nextState;
                }
                default:
                    return state;
            }
        }
        case service_1.SYNC_LOCAL_ITEMS: {
            let nextState = { ...state };
            for (let item of Object.values(state)) {
                if (item.hasOwnProperty("serviceRef")) {
                    const nextItem = { ...item };
                    nextItem.hasRead = !action.unreadIds.has(item.serviceRef);
                    nextItem.starred = action.starredIds.has(item.serviceRef);
                    nextState[item._id] = nextItem;
                }
            }
            return nextState;
        }
        case app_1.FREE_MEMORY: {
            const nextState = {};
            for (let item of Object.values(state)) {
                if (action.iids.has(item._id))
                    nextState[item._id] = item;
            }
            return nextState;
        }
        default:
            return state;
    }
}
exports.itemReducer = itemReducer;
