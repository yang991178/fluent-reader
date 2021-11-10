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
exports.serviceReducer = exports.saveServiceConfigs = exports.SYNC_LOCAL_ITEMS = exports.SYNC_SERVICE = exports.SAVE_SERVICE_CONFIGS = exports.removeService = exports.importGroups = exports.syncWithService = exports.getServiceHooks = exports.getServiceHooksFromType = void 0;
const db = __importStar(require("../db"));
const lovefield_1 = __importDefault(require("lovefield"));
const utils_1 = require("../utils");
const item_1 = require("./item");
const app_1 = require("./app");
const source_1 = require("./source");
const group_1 = require("./group");
const fever_1 = require("./services/fever");
const feedbin_1 = require("./services/feedbin");
const greader_1 = require("./services/greader");
function getServiceHooksFromType(type) {
    switch (type) {
        case 1 /* Fever */:
            return fever_1.feverServiceHooks;
        case 2 /* Feedbin */:
            return feedbin_1.feedbinServiceHooks;
        case 3 /* GReader */:
        case 4 /* Inoreader */:
            return greader_1.gReaderServiceHooks;
        default:
            return {};
    }
}
exports.getServiceHooksFromType = getServiceHooksFromType;
function getServiceHooks() {
    return (_, getState) => {
        return getServiceHooksFromType(getState().service.type);
    };
}
exports.getServiceHooks = getServiceHooks;
function syncWithService(background = false) {
    return async (dispatch, getState) => {
        const hooks = dispatch(getServiceHooks());
        if (hooks.updateSources && hooks.fetchItems && hooks.syncItems) {
            try {
                dispatch({
                    type: exports.SYNC_SERVICE,
                    status: utils_1.ActionStatus.Request,
                });
                if (hooks.reauthenticate)
                    await dispatch(reauthenticate(hooks));
                await dispatch(updateSources(hooks.updateSources));
                await dispatch(syncItems(hooks.syncItems));
                await dispatch(fetchItems(hooks.fetchItems, background));
                dispatch({
                    type: exports.SYNC_SERVICE,
                    status: utils_1.ActionStatus.Success,
                });
            }
            catch (err) {
                console.log(err);
                dispatch({
                    type: exports.SYNC_SERVICE,
                    status: utils_1.ActionStatus.Failure,
                    err: err,
                });
            }
            finally {
                if (getState().app.settings.saving)
                    dispatch((0, app_1.saveSettings)());
            }
        }
    };
}
exports.syncWithService = syncWithService;
function reauthenticate(hooks) {
    return async (dispatch, getState) => {
        let configs = getState().service;
        if (!(await hooks.authenticate(configs))) {
            configs = await hooks.reauthenticate(configs);
            dispatch(saveServiceConfigs(configs));
        }
    };
}
function updateSources(hook) {
    return async (dispatch, getState) => {
        const [sources, groupsMap] = await dispatch(hook());
        const existing = new Map();
        for (let source of Object.values(getState().sources)) {
            if (source.serviceRef) {
                existing.set(source.serviceRef, source);
            }
        }
        const forceSettings = () => {
            if (!getState().app.settings.saving)
                dispatch((0, app_1.saveSettings)());
        };
        let promises = sources.map(async (s) => {
            if (existing.has(s.serviceRef)) {
                const doc = existing.get(s.serviceRef);
                existing.delete(s.serviceRef);
                return doc;
            }
            else {
                const docs = (await db.sourcesDB
                    .select()
                    .from(db.sources)
                    .where(db.sources.url.eq(s.url))
                    .exec());
                if (docs.length === 0) {
                    // Create a new source
                    forceSettings();
                    const inserted = await dispatch((0, source_1.insertSource)(s));
                    inserted.unreadCount = 0;
                    dispatch((0, source_1.addSourceSuccess)(inserted, true));
                    window.settings.saveGroups(getState().groups);
                    dispatch((0, source_1.updateFavicon)([inserted.sid]));
                    return inserted;
                }
                else if (docs[0].serviceRef !== s.serviceRef) {
                    // Mark an existing source as remote and remove all items
                    const doc = docs[0];
                    forceSettings();
                    doc.serviceRef = s.serviceRef;
                    doc.unreadCount = 0;
                    await dispatch((0, source_1.updateSource)(doc));
                    await db.itemsDB
                        .delete()
                        .from(db.items)
                        .where(db.items.source.eq(doc.sid))
                        .exec();
                    return doc;
                }
                else {
                    return docs[0];
                }
            }
        });
        for (let [_, source] of existing) {
            // Delete sources removed from the service side
            forceSettings();
            promises.push(dispatch((0, source_1.deleteSource)(source, true)).then(() => null));
        }
        let sourcesResults = (await Promise.all(promises)).filter(s => s);
        if (groupsMap) {
            // Add sources to imported groups
            forceSettings();
            for (let source of sourcesResults) {
                if (groupsMap.has(source.serviceRef)) {
                    const gid = dispatch((0, group_1.createSourceGroup)(groupsMap.get(source.serviceRef)));
                    dispatch((0, group_1.addSourceToGroup)(gid, source.sid));
                }
            }
            const configs = getState().service;
            delete configs.importGroups;
            dispatch(saveServiceConfigs(configs));
        }
    };
}
function syncItems(hook) {
    return async (dispatch, getState) => {
        const state = getState();
        const [unreadRefs, starredRefs] = await dispatch(hook());
        const unreadCopy = new Set(unreadRefs);
        const starredCopy = new Set(starredRefs);
        const rows = await db.itemsDB
            .select(db.items.serviceRef, db.items.hasRead, db.items.starred)
            .from(db.items)
            .where(lovefield_1.default.op.and(db.items.serviceRef.isNotNull(), lovefield_1.default.op.or(db.items.hasRead.eq(false), db.items.starred.eq(true))))
            .exec();
        const updates = new Array();
        for (let row of rows) {
            const serviceRef = row["serviceRef"];
            if (row["hasRead"] === false && !unreadRefs.delete(serviceRef)) {
                updates.push(db.itemsDB
                    .update(db.items)
                    .set(db.items.hasRead, true)
                    .where(db.items.serviceRef.eq(serviceRef)));
            }
            if (row["starred"] === true && !starredRefs.delete(serviceRef)) {
                updates.push(db.itemsDB
                    .update(db.items)
                    .set(db.items.starred, false)
                    .where(db.items.serviceRef.eq(serviceRef)));
            }
        }
        for (let unread of unreadRefs) {
            updates.push(db.itemsDB
                .update(db.items)
                .set(db.items.hasRead, false)
                .where(db.items.serviceRef.eq(unread)));
        }
        for (let starred of starredRefs) {
            updates.push(db.itemsDB
                .update(db.items)
                .set(db.items.starred, true)
                .where(db.items.serviceRef.eq(starred)));
        }
        if (updates.length > 0) {
            await db.itemsDB.createTransaction().exec(updates);
            await dispatch((0, source_1.updateUnreadCounts)());
            dispatch(syncLocalItems(unreadCopy, starredCopy));
        }
    };
}
function fetchItems(hook, background) {
    return async (dispatch, getState) => {
        const [items, configs] = await dispatch(hook());
        if (items.length > 0) {
            const inserted = await (0, item_1.insertItems)(items);
            dispatch((0, item_1.fetchItemsSuccess)(inserted.reverse(), getState().items));
            if (background) {
                for (let item of inserted) {
                    if (item.notify)
                        dispatch((0, app_1.pushNotification)(item));
                }
                if (inserted.length > 0)
                    window.utils.requestAttention();
            }
            dispatch(saveServiceConfigs(configs));
        }
    };
}
function importGroups() {
    return async (dispatch, getState) => {
        const configs = getState().service;
        if (configs.type !== 0 /* None */) {
            dispatch((0, app_1.saveSettings)());
            configs.importGroups = true;
            dispatch(saveServiceConfigs(configs));
            await dispatch(syncWithService());
        }
    };
}
exports.importGroups = importGroups;
function removeService() {
    return async (dispatch, getState) => {
        dispatch((0, app_1.saveSettings)());
        const state = getState();
        const promises = Object.values(state.sources)
            .filter(s => s.serviceRef)
            .map(async (s) => {
            await dispatch((0, source_1.deleteSource)(s, true));
        });
        await Promise.all(promises);
        dispatch(saveServiceConfigs({ type: 0 /* None */ }));
        dispatch((0, app_1.saveSettings)());
    };
}
exports.removeService = removeService;
exports.SAVE_SERVICE_CONFIGS = "SAVE_SERVICE_CONFIGS";
exports.SYNC_SERVICE = "SYNC_SERVICE";
exports.SYNC_LOCAL_ITEMS = "SYNC_LOCAL_ITEMS";
function saveServiceConfigs(configs) {
    return dispatch => {
        window.settings.setServiceConfigs(configs);
        dispatch({
            type: exports.SAVE_SERVICE_CONFIGS,
            configs: configs,
        });
    };
}
exports.saveServiceConfigs = saveServiceConfigs;
function syncLocalItems(unread, starred) {
    return {
        type: exports.SYNC_LOCAL_ITEMS,
        unreadIds: unread,
        starredIds: starred,
    };
}
function serviceReducer(state = window.settings.getServiceConfigs(), action) {
    switch (action.type) {
        case exports.SAVE_SERVICE_CONFIGS:
            return action.configs;
        default:
            return state;
    }
}
exports.serviceReducer = serviceReducer;
