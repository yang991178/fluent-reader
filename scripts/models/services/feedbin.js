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
exports.feedbinServiceHooks = void 0;
const react_intl_universal_1 = __importDefault(require("react-intl-universal"));
const db = __importStar(require("../../db"));
const lovefield_1 = __importDefault(require("lovefield"));
const group_1 = require("../group");
const source_1 = require("../source");
const utils_1 = require("../../utils");
const rule_1 = require("../rule");
async function fetchAPI(configs, params) {
    const headers = new Headers();
    headers.set("Authorization", "Basic " + btoa(configs.username + ":" + configs.password));
    return await fetch(configs.endpoint + params, { headers: headers });
}
async function markItems(configs, type, method, refs) {
    const headers = new Headers();
    headers.set("Authorization", "Basic " + btoa(configs.username + ":" + configs.password));
    headers.set("Content-Type", "application/json; charset=utf-8");
    const promises = new Array();
    while (refs.length > 0) {
        const batch = new Array();
        while (batch.length < 1000 && refs.length > 0) {
            batch.push(refs.pop());
        }
        const bodyObject = {};
        bodyObject[`${type}_entries`] = batch;
        promises.push(fetch(configs.endpoint + type + "_entries.json", {
            method: method,
            headers: headers,
            body: JSON.stringify(bodyObject),
        }));
    }
    return await Promise.all(promises);
}
const APIError = () => new Error(react_intl_universal_1.default.get("service.failure"));
exports.feedbinServiceHooks = {
    authenticate: async (configs) => {
        try {
            const result = await fetchAPI(configs, "authentication.json");
            return result.status === 200;
        }
        catch {
            return false;
        }
    },
    updateSources: () => async (dispatch, getState) => {
        const configs = getState().service;
        const response = await fetchAPI(configs, "subscriptions.json");
        if (response.status !== 200)
            throw APIError();
        const subscriptions = await response.json();
        let groupsMap;
        if (configs.importGroups) {
            const tagsResponse = await fetchAPI(configs, "taggings.json");
            if (tagsResponse.status !== 200)
                throw APIError();
            const tags = await tagsResponse.json();
            const tagsSet = new Set();
            groupsMap = new Map();
            for (let tag of tags) {
                const title = tag.name.trim();
                if (!tagsSet.has(title)) {
                    tagsSet.add(title);
                    dispatch((0, group_1.createSourceGroup)(title));
                }
                groupsMap.set(String(tag.feed_id), title);
            }
        }
        const sources = subscriptions.map(s => {
            const source = new source_1.RSSSource(s.feed_url, s.title);
            source.serviceRef = String(s.feed_id);
            return source;
        });
        return [sources, groupsMap];
    },
    syncItems: () => async (_, getState) => {
        const configs = getState().service;
        const [unreadResponse, starredResponse] = await Promise.all([
            fetchAPI(configs, "unread_entries.json"),
            fetchAPI(configs, "starred_entries.json"),
        ]);
        if (unreadResponse.status !== 200 || starredResponse.status !== 200)
            throw APIError();
        const unread = await unreadResponse.json();
        const starred = await starredResponse.json();
        return [
            new Set(unread.map(i => String(i))),
            new Set(starred.map(i => String(i))),
        ];
    },
    fetchItems: () => async (_, getState) => {
        const state = getState();
        const configs = state.service;
        const items = new Array();
        configs.lastId = configs.lastId || 0;
        let page = 1;
        let min = Number.MAX_SAFE_INTEGER;
        let lastFetched;
        do {
            try {
                const response = await fetchAPI(configs, "entries.json?mode=extended&per_page=125&page=" + page);
                if (response.status !== 200)
                    throw APIError();
                lastFetched = await response.json();
                items.push(...lastFetched.filter(i => i.id > configs.lastId && i.id < min));
                min = lastFetched.reduce((m, n) => Math.min(m, n.id), min);
                page += 1;
            }
            catch {
                break;
            }
        } while (min > configs.lastId &&
            lastFetched &&
            lastFetched.length >= 125 &&
            items.length < configs.fetchLimit);
        configs.lastId = items.reduce((m, n) => Math.max(m, n.id), configs.lastId);
        if (items.length > 0) {
            const fidMap = new Map();
            for (let source of Object.values(state.sources)) {
                if (source.serviceRef) {
                    fidMap.set(source.serviceRef, source);
                }
            }
            const [unreadResponse, starredResponse] = await Promise.all([
                fetchAPI(configs, "unread_entries.json"),
                fetchAPI(configs, "starred_entries.json"),
            ]);
            if (unreadResponse.status !== 200 || starredResponse.status !== 200)
                throw APIError();
            const unread = new Set(await unreadResponse.json());
            const starred = new Set(await starredResponse.json());
            const parsedItems = new Array();
            items.forEach(i => {
                if (i.content === null)
                    return;
                const source = fidMap.get(String(i.feed_id));
                const dom = utils_1.domParser.parseFromString(i.content, "text/html");
                const item = {
                    source: source.sid,
                    title: i.title,
                    link: i.url,
                    date: new Date(i.published),
                    fetchedDate: new Date(i.created_at),
                    content: i.content,
                    snippet: dom.documentElement.textContent.trim(),
                    creator: i.author,
                    hasRead: !unread.has(i.id),
                    starred: starred.has(i.id),
                    hidden: false,
                    notify: false,
                    serviceRef: String(i.id),
                };
                if (i.images && i.images.original_url) {
                    item.thumb = i.images.original_url;
                }
                else {
                    let baseEl = dom.createElement("base");
                    baseEl.setAttribute("href", item.link.split("/").slice(0, 3).join("/"));
                    dom.head.append(baseEl);
                    let img = dom.querySelector("img");
                    if (img && img.src)
                        item.thumb = img.src;
                }
                // Apply rules and sync back to the service
                if (source.rules)
                    rule_1.SourceRule.applyAll(source.rules, item);
                if (unread.has(i.id) === item.hasRead)
                    markItems(configs, "unread", item.hasRead ? "DELETE" : "POST", [i.id]);
                if (starred.has(i.id) !== Boolean(item.starred))
                    markItems(configs, "starred", item.starred ? "POST" : "DELETE", [i.id]);
                parsedItems.push(item);
            });
            return [parsedItems, configs];
        }
        else {
            return [[], configs];
        }
    },
    markAllRead: (sids, date, before) => async (_, getState) => {
        const state = getState();
        const configs = state.service;
        const predicates = [
            db.items.source.in(sids),
            db.items.hasRead.eq(false),
            db.items.serviceRef.isNotNull(),
        ];
        if (date) {
            predicates.push(before ? db.items.date.lte(date) : db.items.date.gte(date));
        }
        const query = lovefield_1.default.op.and.apply(null, predicates);
        const rows = await db.itemsDB
            .select(db.items.serviceRef)
            .from(db.items)
            .where(query)
            .exec();
        const refs = rows.map(row => parseInt(row["serviceRef"]));
        markItems(configs, "unread", "DELETE", refs);
    },
    markRead: (item) => async (_, getState) => {
        await markItems(getState().service, "unread", "DELETE", [parseInt(item.serviceRef)]);
    },
    markUnread: (item) => async (_, getState) => {
        await markItems(getState().service, "unread", "POST", [parseInt(item.serviceRef)]);
    },
    star: (item) => async (_, getState) => {
        await markItems(getState().service, "starred", "POST", [parseInt(item.serviceRef)]);
    },
    unstar: (item) => async (_, getState) => {
        await markItems(getState().service, "starred", "DELETE", [parseInt(item.serviceRef)]);
    },
};
