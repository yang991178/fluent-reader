import { SyncService, ServiceConfigs } from "../../schema-types"
import { AppThunk } from "../utils"
import { RSSItem } from "./item"

import { feverServiceHooks } from "./services/fever"

export interface ServiceHooks {
    authenticate?: (configs: ServiceConfigs) => Promise<boolean>
    updateSources?: () => AppThunk<Promise<void>>
    fetchItems?: () => AppThunk<Promise<void>>
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

export function syncWithService(): AppThunk<Promise<void>> {
    return async (dispatch) => {
        const hooks = dispatch(getServiceHooks())
        if (hooks.updateSources && hooks.fetchItems && hooks.syncItems) {
            await dispatch(hooks.updateSources())
            await dispatch(hooks.fetchItems())
            await dispatch(hooks.syncItems())
        }
    }
}

export const SAVE_SERVICE_CONFIGS = "SAVE_SERVICE_CONFIGS"

interface SaveServiceConfigsAction {
    type: typeof SAVE_SERVICE_CONFIGS
    configs: ServiceConfigs
}

export type ServiceActionTypes = SaveServiceConfigsAction

export function saveServiceConfigs(configs: ServiceConfigs): AppThunk {
    return (dispatch) => {
        window.settings.setServiceConfigs(configs)
        dispatch({
            type: SAVE_SERVICE_CONFIGS,
            configs: configs
        })
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