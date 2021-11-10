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
exports.sourceReducer = exports.updateFavicon = exports.deleteSources = exports.deleteSource = exports.deleteSourceDone = exports.updateSource = exports.updateSourceDone = exports.addSource = exports.insertSource = exports.addSourceFailure = exports.addSourceSuccess = exports.addSourceRequest = exports.initSources = exports.updateUnreadCounts = exports.initSourcesFailure = exports.initSourcesSuccess = exports.initSourcesRequest = exports.DELETE_SOURCE = exports.UPDATE_UNREAD_COUNTS = exports.UPDATE_SOURCE = exports.ADD_SOURCE = exports.INIT_SOURCES = exports.RSSSource = void 0;
const react_intl_universal_1 = __importDefault(require("react-intl-universal"));
const db = __importStar(require("../db"));
const lovefield_1 = __importDefault(require("lovefield"));
const utils_1 = require("../utils");
const item_1 = require("./item");
const app_1 = require("./app");
const rule_1 = require("./rule");
const group_1 = require("./group");
class RSSSource {
    constructor(url, name = null) {
        this.url = url;
        this.name = name;
        this.openTarget = 0 /* Local */;
        this.lastFetched = new Date();
        this.fetchFrequency = 0;
    }
    static async fetchMetaData(source) {
        let feed = await (0, utils_1.parseRSS)(source.url);
        if (!source.name) {
            if (feed.title)
                source.name = feed.title.trim();
            source.name = source.name || react_intl_universal_1.default.get("sources.untitled");
        }
        return feed;
    }
    static async checkItem(source, item) {
        let i = new item_1.RSSItem(item, source);
        const items = (await db.itemsDB
            .select()
            .from(db.items)
            .where(lovefield_1.default.op.and(db.items.source.eq(i.source), db.items.title.eq(i.title), db.items.date.eq(i.date)))
            .limit(1)
            .exec());
        if (items.length === 0) {
            item_1.RSSItem.parseContent(i, item);
            if (source.rules)
                rule_1.SourceRule.applyAll(source.rules, i);
            return i;
        }
        else {
            return null;
        }
    }
    static checkItems(source, items) {
        return new Promise((resolve, reject) => {
            let p = new Array();
            for (let item of items) {
                p.push(this.checkItem(source, item));
            }
            Promise.all(p)
                .then(values => {
                resolve(values.filter(v => v != null));
            })
                .catch(e => {
                reject(e);
            });
        });
    }
    static async fetchItems(source) {
        let feed = await (0, utils_1.parseRSS)(source.url);
        return await this.checkItems(source, feed.items);
    }
}
exports.RSSSource = RSSSource;
exports.INIT_SOURCES = "INIT_SOURCES";
exports.ADD_SOURCE = "ADD_SOURCE";
exports.UPDATE_SOURCE = "UPDATE_SOURCE";
exports.UPDATE_UNREAD_COUNTS = "UPDATE_UNREAD_COUNTS";
exports.DELETE_SOURCE = "DELETE_SOURCE";
function initSourcesRequest() {
    return {
        type: exports.INIT_SOURCES,
        status: utils_1.ActionStatus.Request,
    };
}
exports.initSourcesRequest = initSourcesRequest;
function initSourcesSuccess(sources) {
    return {
        type: exports.INIT_SOURCES,
        status: utils_1.ActionStatus.Success,
        sources: sources,
    };
}
exports.initSourcesSuccess = initSourcesSuccess;
function initSourcesFailure(err) {
    return {
        type: exports.INIT_SOURCES,
        status: utils_1.ActionStatus.Failure,
        err: err,
    };
}
exports.initSourcesFailure = initSourcesFailure;
async function unreadCount(sources) {
    const rows = await db.itemsDB
        .select(db.items.source, lovefield_1.default.fn.count(db.items._id))
        .from(db.items)
        .where(db.items.hasRead.eq(false))
        .groupBy(db.items.source)
        .exec();
    for (let row of rows) {
        sources[row["source"]].unreadCount = row["COUNT(_id)"];
    }
    return sources;
}
function updateUnreadCounts() {
    return async (dispatch, getState) => {
        const sources = {};
        for (let source of Object.values(getState().sources)) {
            sources[source.sid] = {
                ...source,
                unreadCount: 0,
            };
        }
        dispatch({
            type: exports.UPDATE_UNREAD_COUNTS,
            sources: await unreadCount(sources),
        });
    };
}
exports.updateUnreadCounts = updateUnreadCounts;
function initSources() {
    return async (dispatch) => {
        dispatch(initSourcesRequest());
        await db.init();
        const sources = (await db.sourcesDB
            .select()
            .from(db.sources)
            .exec());
        const state = {};
        for (let source of sources) {
            source.unreadCount = 0;
            state[source.sid] = source;
        }
        await unreadCount(state);
        dispatch((0, group_1.fixBrokenGroups)(state));
        dispatch(initSourcesSuccess(state));
    };
}
exports.initSources = initSources;
function addSourceRequest(batch) {
    return {
        type: exports.ADD_SOURCE,
        batch: batch,
        status: utils_1.ActionStatus.Request,
    };
}
exports.addSourceRequest = addSourceRequest;
function addSourceSuccess(source, batch) {
    return {
        type: exports.ADD_SOURCE,
        batch: batch,
        status: utils_1.ActionStatus.Success,
        source: source,
    };
}
exports.addSourceSuccess = addSourceSuccess;
function addSourceFailure(err, batch) {
    return {
        type: exports.ADD_SOURCE,
        batch: batch,
        status: utils_1.ActionStatus.Failure,
        err: err,
    };
}
exports.addSourceFailure = addSourceFailure;
let insertPromises = Promise.resolve();
function insertSource(source) {
    return (_, getState) => {
        return new Promise((resolve, reject) => {
            insertPromises = insertPromises.then(async () => {
                let sids = Object.values(getState().sources).map(s => s.sid);
                source.sid = Math.max(...sids, -1) + 1;
                const row = db.sources.createRow(source);
                try {
                    const inserted = (await db.sourcesDB
                        .insert()
                        .into(db.sources)
                        .values([row])
                        .exec());
                    resolve(inserted[0]);
                }
                catch (err) {
                    if (err.code === 201)
                        reject(react_intl_universal_1.default.get("sources.exist"));
                    else
                        reject(err);
                }
            });
        });
    };
}
exports.insertSource = insertSource;
function addSource(url, name = null, batch = false) {
    return async (dispatch, getState) => {
        const app = getState().app;
        if (app.sourceInit) {
            dispatch(addSourceRequest(batch));
            const source = new RSSSource(url, name);
            try {
                const feed = await RSSSource.fetchMetaData(source);
                const inserted = await dispatch(insertSource(source));
                inserted.unreadCount = feed.items.length;
                dispatch(addSourceSuccess(inserted, batch));
                window.settings.saveGroups(getState().groups);
                dispatch(updateFavicon([inserted.sid]));
                const items = await RSSSource.checkItems(inserted, feed.items);
                await (0, item_1.insertItems)(items);
                return inserted.sid;
            }
            catch (e) {
                dispatch(addSourceFailure(e, batch));
                if (!batch) {
                    window.utils.showErrorBox(react_intl_universal_1.default.get("sources.errorAdd"), String(e));
                }
                throw e;
            }
        }
        throw new Error("Sources not initialized.");
    };
}
exports.addSource = addSource;
function updateSourceDone(source) {
    return {
        type: exports.UPDATE_SOURCE,
        source: source,
    };
}
exports.updateSourceDone = updateSourceDone;
function updateSource(source) {
    return async (dispatch) => {
        let sourceCopy = { ...source };
        delete sourceCopy.unreadCount;
        const row = db.sources.createRow(sourceCopy);
        await db.sourcesDB
            .insertOrReplace()
            .into(db.sources)
            .values([row])
            .exec();
        dispatch(updateSourceDone(source));
    };
}
exports.updateSource = updateSource;
function deleteSourceDone(source) {
    return {
        type: exports.DELETE_SOURCE,
        source: source,
    };
}
exports.deleteSourceDone = deleteSourceDone;
function deleteSource(source, batch = false) {
    return async (dispatch, getState) => {
        if (!batch)
            dispatch((0, app_1.saveSettings)());
        try {
            await db.itemsDB
                .delete()
                .from(db.items)
                .where(db.items.source.eq(source.sid))
                .exec();
            await db.sourcesDB
                .delete()
                .from(db.sources)
                .where(db.sources.sid.eq(source.sid))
                .exec();
            dispatch(deleteSourceDone(source));
            window.settings.saveGroups(getState().groups);
        }
        catch (err) {
            console.log(err);
        }
        finally {
            if (!batch)
                dispatch((0, app_1.saveSettings)());
        }
    };
}
exports.deleteSource = deleteSource;
function deleteSources(sources) {
    return async (dispatch) => {
        dispatch((0, app_1.saveSettings)());
        for (let source of sources) {
            await dispatch(deleteSource(source, true));
        }
        dispatch((0, app_1.saveSettings)());
    };
}
exports.deleteSources = deleteSources;
function updateFavicon(sids, force = false) {
    return async (dispatch, getState) => {
        const initSources = getState().sources;
        if (!sids) {
            sids = Object.values(initSources)
                .filter(s => s.iconurl === undefined)
                .map(s => s.sid);
        }
        else {
            sids = sids.filter(sid => sid in initSources);
        }
        const promises = sids.map(async (sid) => {
            const url = initSources[sid].url;
            let favicon = (await (0, utils_1.fetchFavicon)(url)) || "";
            const source = getState().sources[sid];
            if (source &&
                source.url === url &&
                (force || source.iconurl === undefined)) {
                source.iconurl = favicon;
                await dispatch(updateSource(source));
            }
        });
        await Promise.all(promises);
    };
}
exports.updateFavicon = updateFavicon;
function sourceReducer(state = {}, action) {
    switch (action.type) {
        case exports.INIT_SOURCES:
            switch (action.status) {
                case utils_1.ActionStatus.Success:
                    return action.sources;
                default:
                    return state;
            }
        case exports.UPDATE_UNREAD_COUNTS:
            return action.sources;
        case exports.ADD_SOURCE:
            switch (action.status) {
                case utils_1.ActionStatus.Success:
                    return {
                        ...state,
                        [action.source.sid]: action.source,
                    };
                default:
                    return state;
            }
        case exports.UPDATE_SOURCE:
            return {
                ...state,
                [action.source.sid]: action.source,
            };
        case exports.DELETE_SOURCE: {
            delete state[action.source.sid];
            return { ...state };
        }
        case item_1.FETCH_ITEMS: {
            switch (action.status) {
                case utils_1.ActionStatus.Success: {
                    let updateMap = new Map();
                    for (let item of action.items) {
                        if (!item.hasRead) {
                            updateMap.set(item.source, updateMap.has(item.source)
                                ? updateMap.get(item.source) + 1
                                : 1);
                        }
                    }
                    let nextState = {};
                    for (let [s, source] of Object.entries(state)) {
                        let sid = parseInt(s);
                        if (updateMap.has(sid)) {
                            nextState[sid] = {
                                ...source,
                                unreadCount: source.unreadCount + updateMap.get(sid),
                            };
                        }
                        else {
                            nextState[sid] = source;
                        }
                    }
                    return nextState;
                }
                default:
                    return state;
            }
        }
        case item_1.MARK_UNREAD:
        case item_1.MARK_READ:
            return {
                ...state,
                [action.item.source]: {
                    ...state[action.item.source],
                    unreadCount: state[action.item.source].unreadCount +
                        (action.type === item_1.MARK_UNREAD ? 1 : -1),
                },
            };
        case item_1.MARK_ALL_READ: {
            let nextState = { ...state };
            action.sids.map((sid, i) => {
                nextState[sid] = {
                    ...state[sid],
                    unreadCount: action.time ? state[sid].unreadCount : 0,
                };
            });
            return nextState;
        }
        default:
            return state;
    }
}
exports.sourceReducer = sourceReducer;
