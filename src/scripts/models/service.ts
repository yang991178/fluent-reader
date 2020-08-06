import { SyncService, ServiceConfigs } from "../../schema-types"
import { AppThunk, ActionStatus } from "../utils"
import { RSSItem } from "./item"

import { feverServiceHooks } from "./services/fever"
import { saveSettings } from "./app"
import { deleteSource } from "./source"

export interface ServiceHooks {
    authenticate?: (configs: ServiceConfigs) => Promise<boolean>
    updateSources?: () => AppThunk<Promise<void>>
    fetchItems?: (background: boolean) => AppThunk<Promise<void>>
    syncItems?: () => AppThunk<Promise<void>>
    markRead?: (item: RSSItem) => AppThunk
    markUnread?: (item: RSSItem) => AppThunk
    markAllRead?: (sids?: number[], date?: Date, before?: boolean) => AppThunk
    star?: (item: RSSItem) => AppThunk
    unstar?: (item: RSSItem) => AppThunk
}

export function getServiceHooksFromType(type: SyncService): ServiceHooks {
    switch (type) {
        case SyncService.Fever: return feverServiceHooks
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
                await dispatch(hooks.updateSources())
                await dispatch(hooks.syncItems())
                await dispatch(hooks.fetchItems(background))
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
    unreadIds: number[]
    starredIds: number[]
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

export function syncLocalItems(unread: number[], starred: number[]): ServiceActionTypes {
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