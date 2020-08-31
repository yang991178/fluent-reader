import * as db from "../db"
import { SyncService, ServiceConfigs } from "../../schema-types"
import { AppThunk, ActionStatus } from "../utils"
import { RSSItem, insertItems, fetchItemsSuccess } from "./item"
import { saveSettings, pushNotification } from "./app"
import { deleteSource, updateUnreadCounts, RSSSource, insertSource, addSourceSuccess,
    updateSource, updateFavicon } from "./source"
import { FilterType, initFeeds } from "./feed"
import { createSourceGroup, addSourceToGroup } from "./group"

import { feverServiceHooks } from "./services/fever"
import { feedbinServiceHooks } from "./services/feedbin"

export interface ServiceHooks {
    authenticate?: (configs: ServiceConfigs) => Promise<boolean>
    updateSources?: () => AppThunk<Promise<[RSSSource[], Map<number | string, string>]>>
    fetchItems?: () => AppThunk<Promise<[RSSItem[], ServiceConfigs]>>
    syncItems?: () => AppThunk<Promise<[(number | string)[], (number | string)[]]>>
    markRead?: (item: RSSItem) => AppThunk
    markUnread?: (item: RSSItem) => AppThunk
    markAllRead?: (sids?: number[], date?: Date, before?: boolean) => AppThunk<Promise<void>>
    star?: (item: RSSItem) => AppThunk
    unstar?: (item: RSSItem) => AppThunk
}

export function getServiceHooksFromType(type: SyncService): ServiceHooks {
    switch (type) {
        case SyncService.Fever: return feverServiceHooks
        case SyncService.Feedbin: return feedbinServiceHooks
        default: return {}
    }
}

export function getServiceHooks(): AppThunk<ServiceHooks> {
    return (_, getState) => {
        return getServiceHooksFromType(getState().service.type)
    }
}

export function syncWithService(background = false): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        const hooks = dispatch(getServiceHooks())
        if (hooks.updateSources && hooks.fetchItems && hooks.syncItems) {
            try {
                dispatch({
                    type: SYNC_SERVICE,
                    status: ActionStatus.Request
                })
                await dispatch(updateSources(hooks.updateSources))
                await dispatch(syncItems(hooks.syncItems))
                await dispatch(fetchItems(hooks.fetchItems, background))
                dispatch({
                    type: SYNC_SERVICE,
                    status: ActionStatus.Success
                })
            } catch (err) {
                console.log(err)
                dispatch({
                    type: SYNC_SERVICE,
                    status: ActionStatus.Failure,
                    err: err
                })
            } finally {
                if (getState().app.settings.saving) dispatch(saveSettings())
            }
        }
    }
}

function updateSources(hook: ServiceHooks["updateSources"]): AppThunk<Promise<void>> {
    return async (dispatch, getState) => { 
        const [sources, groupsMap] = await dispatch(hook())
        const existing = new Map<number | string, RSSSource>()
        for (let source of Object.values(getState().sources)) {
            if (source.serviceRef) {
                existing.set(source.serviceRef, source)
            }
        }
        const forceSettings = () => {
            if (!(getState().app.settings.saving)) dispatch(saveSettings())
        }
        let promises = sources.map(async (s) =>  {
            if (existing.has(s.serviceRef)) {
                const doc = existing.get(s.serviceRef)
                existing.delete(s.serviceRef)
                return doc
            } else {
                const docs = (await db.sourcesDB.select().from(db.sources).where(
                    db.sources.url.eq(s.url)
                ).exec()) as RSSSource[]
                if (docs.length === 0) {
                    // Create a new source
                    forceSettings()
                    const inserted = await dispatch(insertSource(s))
                    inserted.unreadCount = 0
                    dispatch(addSourceSuccess(inserted, true))
                    window.settings.saveGroups(getState().groups)
                    dispatch(updateFavicon([inserted.sid]))
                    return inserted
                } else if (docs[0].serviceRef !== s.serviceRef) {
                    // Mark an existing source as remote and remove all items
                    const doc = docs[0]
                    forceSettings()
                    doc.serviceRef = s.serviceRef
                    doc.unreadCount = 0
                    await dispatch(updateSource(doc))
                    await new Promise((resolve, reject) => {
                        db.idb.remove({ source: doc.sid }, { multi: true }, (err) => {
                            if (err) reject(err)
                            else resolve(doc)
                        })
                    })
                } else {
                    return docs[0]
                }
            }
        })
        for (let [_, source] of existing) {
            // Delete sources removed from the service side
            forceSettings()
            promises.push(dispatch(deleteSource(source, true)).then(() => null))
        }
        let sourcesResults = (await Promise.all(promises)).filter(s => s)
        if (groupsMap) {
            // Add sources to imported groups
            forceSettings()
            for (let source of sourcesResults) {
                if (groupsMap.has(source.serviceRef)) {
                    const gid = dispatch(createSourceGroup(groupsMap.get(source.serviceRef)))
                    dispatch(addSourceToGroup(gid, source.sid))
                }
            }
            const configs = getState().service
            delete configs.importGroups
            dispatch(saveServiceConfigs(configs))
        }
    }
}

function syncItems(hook: ServiceHooks["syncItems"]): AppThunk<Promise<void>> {
    return async (dispatch, getState) => { 
        const state = getState()
        const [unreadRefs, starredRefs] = await dispatch(hook())
        const promises = new Array<Promise<number>>()
        promises.push(new Promise((resolve) => {
            db.idb.update({ 
                serviceRef: { $exists: true, $in: unreadRefs }, 
                hasRead: true 
            }, { $set: { hasRead: false } }, { multi: true }, (_, num) => resolve(num))
        }))
        promises.push(new Promise((resolve) => {
            db.idb.update({ 
                serviceRef: { $exists: true, $nin: unreadRefs }, 
                hasRead: false 
            }, { $set: { hasRead: true } }, { multi: true }, (_, num) => resolve(num))
        }))
        promises.push(new Promise((resolve) => {
            db.idb.update({ 
                serviceRef: { $exists: true, $in: starredRefs }, 
                starred: { $exists: false } 
            }, { $set: { starred: true } }, { multi: true }, (_, num) => resolve(num))
        }))
        promises.push(new Promise((resolve) => {
            db.idb.update({ 
                serviceRef: { $exists: true, $nin: starredRefs }, 
                starred: true 
            }, { $unset: { starred: true } }, { multi: true }, (_, num) => resolve(num))
        }))
        const affected = (await Promise.all(promises)).reduce((a, b) => a + b, 0)
        if (affected > 0) {
            dispatch(syncLocalItems(unreadRefs, starredRefs))
            if (!(state.page.filter.type & FilterType.ShowRead) || !(state.page.filter.type & FilterType.ShowNotStarred)) {
                dispatch(initFeeds(true))
            }
            await dispatch(updateUnreadCounts())
        }
    }
}

function fetchItems(hook: ServiceHooks["fetchItems"], background: boolean): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        const [items, configs] = await dispatch(hook())
        if (items.length > 0) {
            const inserted = await insertItems(items)
            dispatch(fetchItemsSuccess(inserted.reverse(), getState().items))
            if (background) {
                for (let item of inserted) {
                    if (item.notify) dispatch(pushNotification(item))
                }
                if (inserted.length > 0) window.utils.requestAttention()
            }
            dispatch(saveServiceConfigs(configs))
        }
    }
}

export function importGroups(): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        const configs = getState().service
        if (configs.type !== SyncService.None) {
            dispatch(saveSettings())
            configs.importGroups = true
            dispatch(saveServiceConfigs(configs))
            await dispatch(syncWithService())
        }
    }
}

export function removeService(): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        dispatch(saveSettings())
        const state = getState()
        const promises = Object.values(state.sources).filter(s => s.serviceRef).map(async s => {
            await dispatch(deleteSource(s, true))
        })
        await Promise.all(promises)
        dispatch(saveServiceConfigs({ type: SyncService.None }))
        dispatch(saveSettings())
    }
}

export const SAVE_SERVICE_CONFIGS = "SAVE_SERVICE_CONFIGS"
export const SYNC_SERVICE = "SYNC_SERVICE"
export const SYNC_LOCAL_ITEMS = "SYNC_LOCAL_ITEMS"

interface SaveServiceConfigsAction {
    type: typeof SAVE_SERVICE_CONFIGS
    configs: ServiceConfigs
}

interface SyncWithServiceAction {
    type: typeof SYNC_SERVICE
    status: ActionStatus
    err?
}

interface SyncLocalItemsAction {
    type: typeof SYNC_LOCAL_ITEMS
    unreadIds: (string | number)[]
    starredIds: (string | number)[]
}

export type ServiceActionTypes = SaveServiceConfigsAction | SyncWithServiceAction | SyncLocalItemsAction

export function saveServiceConfigs(configs: ServiceConfigs): AppThunk {
    return (dispatch) => {
        window.settings.setServiceConfigs(configs)
        dispatch({
            type: SAVE_SERVICE_CONFIGS,
            configs: configs
        })
    }
}

function syncLocalItems(unread: (string | number)[], starred: (string | number)[]): ServiceActionTypes {
    return {
        type: SYNC_LOCAL_ITEMS,
        unreadIds: unread,
        starredIds: starred
    }
}

export function serviceReducer(
    state = window.settings.getServiceConfigs(),
    action: ServiceActionTypes
): ServiceConfigs {
    switch (action.type) {
        case SAVE_SERVICE_CONFIGS: return action.configs
        default: return state
    }
}