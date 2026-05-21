import intl from "react-intl-universal"
import { eq, and, max, count } from "drizzle-orm"
import { database, sourcesTable, itemsTable, init } from "../db"
import {
    fetchFavicon,
    ActionStatus,
    AppThunk,
    parseRSS,
    MyParserItem,
} from "../utils"
import {
    RSSItem,
    insertItems,
    ItemActionTypes,
    FETCH_ITEMS,
    MARK_READ,
    MARK_UNREAD,
    MARK_ALL_READ,
} from "./item"
import { saveSettings } from "./app"
import { SourceRule } from "./rule"
import { fixBrokenGroups } from "./group"

export const enum SourceOpenTarget {
    Local,
    Webpage,
    External,
    FullContent,
}

export const enum SourceTextDirection {
    LTR,
    RTL,
    Vertical,
}

export class RSSSource {
    sid: number
    url: string
    iconurl?: string
    name: string
    openTarget: SourceOpenTarget
    unreadCount: number
    lastFetched: Date
    serviceRef?: string
    fetchFrequency: number // in minutes
    rules?: SourceRule[]
    textDir: SourceTextDirection
    hidden: boolean

    constructor(url: string, name: string = null) {
        this.url = url
        this.name = name
        this.openTarget = SourceOpenTarget.Local
        this.lastFetched = new Date()
        this.fetchFrequency = 0
        this.textDir = SourceTextDirection.LTR
        this.hidden = false
    }

    static async fetchMetaData(source: RSSSource) {
        let feed = await parseRSS(source.url)
        if (!source.name) {
            if (feed.title) source.name = feed.title.trim()
            source.name = source.name || intl.get("sources.untitled")
        }
        return feed
    }

    private static async checkItem(
        source: RSSSource,
        item: MyParserItem
    ): Promise<RSSItem> {
        let i = new RSSItem(item, source)
        const existing = await database
            .select({ _id: itemsTable._id })
            .from(itemsTable)
            .where(
                and(
                    eq(itemsTable.source, i.source),
                    eq(itemsTable.title, i.title),
                    eq(itemsTable.date, i.date)
                )
            )
            .limit(1)
        if (existing.length === 0) {
            RSSItem.parseContent(i, item)
            if (source.rules) SourceRule.applyAll(source.rules, i)
            return i
        } else {
            return null
        }
    }

    static checkItems(
        source: RSSSource,
        items: MyParserItem[]
    ): Promise<RSSItem[]> {
        return new Promise<RSSItem[]>((resolve, reject) => {
            let p = new Array<Promise<RSSItem>>()
            for (let item of items) {
                p.push(this.checkItem(source, item))
            }
            Promise.all(p)
                .then(values => {
                    resolve(values.filter(v => v != null))
                })
                .catch(e => {
                    reject(e)
                })
        })
    }

    static async fetchItems(source: RSSSource) {
        let feed = await parseRSS(source.url)
        return await this.checkItems(source, feed.items)
    }
}

export type SourceState = {
    [sid: number]: RSSSource
}

export const INIT_SOURCES = "INIT_SOURCES"
export const ADD_SOURCE = "ADD_SOURCE"
export const UPDATE_SOURCE = "UPDATE_SOURCE"
export const UPDATE_UNREAD_COUNTS = "UPDATE_UNREAD_COUNTS"
export const DELETE_SOURCE = "DELETE_SOURCE"
export const HIDE_SOURCE = "HIDE_SOURCE"
export const UNHIDE_SOURCE = "UNHIDE_SOURCE"

interface InitSourcesAction {
    type: typeof INIT_SOURCES
    status: ActionStatus
    sources?: SourceState
    err?
}

interface AddSourceAction {
    type: typeof ADD_SOURCE
    status: ActionStatus
    batch: boolean
    source?: RSSSource
    err?
}

interface UpdateSourceAction {
    type: typeof UPDATE_SOURCE
    source: RSSSource
}

interface UpdateUnreadCountsAction {
    type: typeof UPDATE_UNREAD_COUNTS
    sources: SourceState
}

interface DeleteSourceAction {
    type: typeof DELETE_SOURCE
    source: RSSSource
}

interface ToggleSourceHiddenAction {
    type: typeof HIDE_SOURCE | typeof UNHIDE_SOURCE
    status: ActionStatus
    source: RSSSource
}

export type SourceActionTypes =
    | InitSourcesAction
    | AddSourceAction
    | UpdateSourceAction
    | UpdateUnreadCountsAction
    | DeleteSourceAction
    | ToggleSourceHiddenAction

export function initSourcesRequest(): SourceActionTypes {
    return {
        type: INIT_SOURCES,
        status: ActionStatus.Request,
    }
}

export function initSourcesSuccess(sources: SourceState): SourceActionTypes {
    return {
        type: INIT_SOURCES,
        status: ActionStatus.Success,
        sources: sources,
    }
}

export function initSourcesFailure(err): SourceActionTypes {
    return {
        type: INIT_SOURCES,
        status: ActionStatus.Failure,
        err: err,
    }
}

async function unreadCount(sources: SourceState): Promise<SourceState> {
    const rows = await database
        .select({
            source: itemsTable.source,
            count: count(itemsTable._id),
        })
        .from(itemsTable)
        .where(eq(itemsTable.hasRead, false))
        .groupBy(itemsTable.source)
    for (const row of rows) {
        if (sources[row.source]) {
            sources[row.source].unreadCount = row.count
        }
    }
    return sources
}

export function updateUnreadCounts(): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        const sources: SourceState = {}
        for (let source of Object.values(getState().sources)) {
            sources[source.sid] = {
                ...source,
                unreadCount: 0,
            }
        }
        dispatch({
            type: UPDATE_UNREAD_COUNTS,
            sources: await unreadCount(sources),
        })
    }
}

export function initSources(): AppThunk<Promise<void>> {
    return async dispatch => {
        dispatch(initSourcesRequest())
        await init()
        const sourcesData = await database.select().from(sourcesTable)
        const storedRules = globalThis.settings.getSourceRules()
        const state: SourceState = {}
        for (const source of sourcesData) {
            const rssSource = source as unknown as RSSSource
            rssSource.unreadCount = 0
            const sourceRules = storedRules.filter(
                r => r.target.type === "source" && r.target.sid === source.sid
            )
            if (sourceRules.length > 0) {
                rssSource.rules = sourceRules.map(r => SourceRule.fromStored(r))
            }
            state[source.sid] = rssSource
        }
        await unreadCount(state)
        dispatch(fixBrokenGroups(state))
        dispatch(initSourcesSuccess(state))
    }
}

export function addSourceRequest(batch: boolean): SourceActionTypes {
    return {
        type: ADD_SOURCE,
        batch: batch,
        status: ActionStatus.Request,
    }
}

export function addSourceSuccess(
    source: RSSSource,
    batch: boolean
): SourceActionTypes {
    return {
        type: ADD_SOURCE,
        batch: batch,
        status: ActionStatus.Success,
        source: source,
    }
}

export function addSourceFailure(err, batch: boolean): SourceActionTypes {
    return {
        type: ADD_SOURCE,
        batch: batch,
        status: ActionStatus.Failure,
        err: err,
    }
}

let insertPromises = Promise.resolve()
export function insertSource(source: RSSSource): AppThunk<Promise<RSSSource>> {
    return () => {
        return new Promise((resolve, reject) => {
            insertPromises = insertPromises.then(async () => {
                try {
                    const result = await database
                        .select({ maxSid: max(sourcesTable.sid) })
                        .from(sourcesTable)
                    source.sid = (result[0]?.maxSid ?? -1) + 1
                    await database.insert(sourcesTable).values({
                        sid: source.sid,
                        url: source.url,
                        iconurl: source.iconurl || null,
                        name: source.name,
                        openTarget: source.openTarget,
                        lastFetched: source.lastFetched,
                        serviceRef: source.serviceRef || null,
                        fetchFrequency: source.fetchFrequency || 0,
                        textDir: source.textDir || 0,
                        hidden: source.hidden || false,
                    })
                    resolve(source)
                } catch (err) {
                    if (
                        err instanceof Error &&
                        err.message.includes(
                            "UNIQUE constraint failed: sources.url"
                        )
                    ) {
                        reject(intl.get("sources.exist"))
                    } else {
                        reject(err)
                    }
                }
            })
        })
    }
}

export function addSource(
    url: string,
    name: string = null,
    batch = false
): AppThunk<Promise<number>> {
    return async (dispatch, getState) => {
        const app = getState().app
        if (app.sourceInit) {
            dispatch(addSourceRequest(batch))
            const source = new RSSSource(url, name)
            try {
                const feed = await RSSSource.fetchMetaData(source)
                const inserted = await dispatch(insertSource(source))
                inserted.unreadCount = feed.items.length
                dispatch(addSourceSuccess(inserted, batch))
                window.settings.saveGroups(getState().groups)
                dispatch(updateFavicon([inserted.sid]))
                const items = await RSSSource.checkItems(inserted, feed.items)
                await insertItems(items)
                return inserted.sid
            } catch (e) {
                dispatch(addSourceFailure(e, batch))
                if (!batch) {
                    window.utils.showErrorBox(
                        intl.get("sources.errorAdd"),
                        String(e),
                        intl.get("context.copy")
                    )
                }
                throw e
            }
        }
        throw new Error("Sources not initialized.")
    }
}

export function updateSourceDone(source: RSSSource): SourceActionTypes {
    return {
        type: UPDATE_SOURCE,
        source: source,
    }
}

export function updateSource(source: RSSSource): AppThunk<Promise<void>> {
    return async dispatch => {
        const dbValues = {
            sid: source.sid,
            url: source.url,
            iconurl: source.iconurl || null,
            name: source.name,
            openTarget: source.openTarget,
            lastFetched: source.lastFetched,
            serviceRef: source.serviceRef || null,
            fetchFrequency: source.fetchFrequency || 0,
            textDir: source.textDir || 0,
            hidden: source.hidden || false,
        }
        await database
            .insert(sourcesTable)
            .values(dbValues)
            .onConflictDoUpdate({
                target: sourcesTable.sid,
                set: dbValues,
            })
        dispatch(updateSourceDone(source))
    }
}

export function deleteSourceDone(source: RSSSource): SourceActionTypes {
    return {
        type: DELETE_SOURCE,
        source: source,
    }
}

export function deleteSource(
    source: RSSSource,
    batch = false
): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        if (!batch) dispatch(saveSettings())
        try {
            await database
                .delete(itemsTable)
                .where(eq(itemsTable.source, source.sid))
            await database
                .delete(sourcesTable)
                .where(eq(sourcesTable.sid, source.sid))
            dispatch(deleteSourceDone(source))
            window.settings.saveGroups(getState().groups)
        } catch (err) {
            console.log(err)
        } finally {
            if (!batch) dispatch(saveSettings())
        }
    }
}

export function deleteSources(sources: RSSSource[]): AppThunk<Promise<void>> {
    return async dispatch => {
        dispatch(saveSettings())
        for (let source of sources) {
            await dispatch(deleteSource(source, true))
        }
        dispatch(saveSettings())
    }
}

export function toggleSourceHidden(source: RSSSource): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        const sourceCopy: RSSSource = { ...getState().sources[source.sid] }
        sourceCopy.hidden = !sourceCopy.hidden
        dispatch({
            type: sourceCopy.hidden ? HIDE_SOURCE : UNHIDE_SOURCE,
            status: ActionStatus.Success,
            source: sourceCopy,
        })
        await dispatch(updateSource(sourceCopy))
    }
}

export function updateFavicon(
    sids?: number[],
    force = false
): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        const initSources = getState().sources
        if (!sids) {
            sids = Object.values(initSources)
                .filter(s => s.iconurl === undefined)
                .map(s => s.sid)
        } else {
            sids = sids.filter(sid => sid in initSources)
        }
        const promises = sids.map(async sid => {
            const url = initSources[sid].url
            let favicon = (await fetchFavicon(url)) || ""
            const source = getState().sources[sid]
            if (
                source &&
                source.url === url &&
                (force || source.iconurl === undefined)
            ) {
                source.iconurl = favicon
                await dispatch(updateSource(source))
            }
        })
        await Promise.all(promises)
    }
}

export function sourceReducer(
    state: SourceState = {},
    action: SourceActionTypes | ItemActionTypes
): SourceState {
    switch (action.type) {
        case INIT_SOURCES:
            switch (action.status) {
                case ActionStatus.Success:
                    return action.sources
                default:
                    return state
            }
        case UPDATE_UNREAD_COUNTS:
            return action.sources
        case ADD_SOURCE:
            switch (action.status) {
                case ActionStatus.Success:
                    return {
                        ...state,
                        [action.source.sid]: action.source,
                    }
                default:
                    return state
            }
        case UPDATE_SOURCE:
            return {
                ...state,
                [action.source.sid]: action.source,
            }
        case DELETE_SOURCE: {
            delete state[action.source.sid]
            return { ...state }
        }
        case FETCH_ITEMS: {
            switch (action.status) {
                case ActionStatus.Success: {
                    let updateMap = new Map<number, number>()
                    for (let item of action.items) {
                        if (!item.hasRead) {
                            updateMap.set(
                                item.source,
                                updateMap.has(item.source)
                                    ? updateMap.get(item.source) + 1
                                    : 1
                            )
                        }
                    }
                    let nextState = {} as SourceState
                    for (let [s, source] of Object.entries(state)) {
                        let sid = parseInt(s)
                        if (updateMap.has(sid)) {
                            nextState[sid] = {
                                ...source,
                                unreadCount:
                                    source.unreadCount + updateMap.get(sid),
                            } as RSSSource
                        } else {
                            nextState[sid] = source
                        }
                    }
                    return nextState
                }
                default:
                    return state
            }
        }
        case MARK_UNREAD:
        case MARK_READ:
            return {
                ...state,
                [action.item.source]: {
                    ...state[action.item.source],
                    unreadCount:
                        state[action.item.source].unreadCount +
                        (action.type === MARK_UNREAD ? 1 : -1),
                } as RSSSource,
            }
        case MARK_ALL_READ: {
            let nextState = { ...state }
            action.sids.forEach(sid => {
                nextState[sid] = {
                    ...state[sid],
                    unreadCount: action.time ? state[sid].unreadCount : 0,
                }
            })
            return nextState
        }
        default:
            return state
    }
}
