import Parser from "@yang991178/rss-parser"
import intl from "react-intl-universal"
import * as db from "../db"
import { fetchFavicon, ActionStatus, AppThunk, parseRSS } from "../utils"
import { RSSItem, insertItems, ItemActionTypes, FETCH_ITEMS, MARK_READ, MARK_UNREAD, MARK_ALL_READ } from "./item"
import { saveSettings } from "./app"
import { SourceRule } from "./rule"

export const enum SourceOpenTarget {
    Local, Webpage, External, FullContent
}

export class RSSSource {
    sid: number
    url: string
    iconurl?: string
    name: string
    openTarget: SourceOpenTarget
    unreadCount: number
    lastFetched: Date
    serviceRef?: string | number
    fetchFrequency: number // in minutes
    rules?: SourceRule[]

    constructor(url: string, name: string = null) {
        this.url = url
        this.name = name
        this.openTarget = SourceOpenTarget.Local
        this.lastFetched = new Date()
        this.fetchFrequency = 0
    }

    static async fetchMetaData(source: RSSSource) {
        let feed = await parseRSS(source.url)
        if (!source.name) {
            if (feed.title) source.name = feed.title.trim()
            source.name = source.name || intl.get("sources.untitled")
        }
        return feed
    }

    private static checkItem(source: RSSSource, item: Parser.Item): Promise<RSSItem> {
        return new Promise<RSSItem>((resolve, reject) => {
            let i = new RSSItem(item, source)
            db.idb.findOne({
                source: i.source,
                title: i.title,
                date: i.date
            },
            (err, doc) => {
                if (err) {
                    reject(err)
                } else if (doc === null) {
                    RSSItem.parseContent(i, item)
                    if (source.rules) SourceRule.applyAll(source.rules, i)
                    resolve(i)
                } else {
                    resolve(null)
                }
            }) 
        })
    }

    static checkItems(source: RSSSource, items: Parser.Item[]): Promise<RSSItem[]> {
        return new Promise<RSSItem[]>((resolve, reject) => {
            let p = new Array<Promise<RSSItem>>()
            for (let item of items) {
                p.push(this.checkItem(source, item))
            }
            Promise.all(p).then(values => {
                resolve(values.filter(v => v != null))
            }).catch(e => { reject(e) })
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
export const DELETE_SOURCE = "DELETE_SOURCE"

interface InitSourcesAction {
    type: typeof INIT_SOURCES
    status: ActionStatus
    sources?: RSSSource[]
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

interface DeleteSourceAction {
    type: typeof DELETE_SOURCE,
    source: RSSSource
}

export type SourceActionTypes = InitSourcesAction | AddSourceAction | UpdateSourceAction | DeleteSourceAction

export function initSourcesRequest(): SourceActionTypes {
    return {
        type: INIT_SOURCES,
        status: ActionStatus.Request
    }
}

export function initSourcesSuccess(sources: RSSSource[]): SourceActionTypes {
    return {
        type: INIT_SOURCES,
        status: ActionStatus.Success,
        sources: sources
    }
}

export function initSourcesFailure(err): SourceActionTypes {
    return {
        type: INIT_SOURCES,
        status: ActionStatus.Failure,
        err: err
    }
}

function unreadCount(source: RSSSource): Promise<RSSSource> {
    return new Promise<RSSSource>((resolve, reject) => {
        db.idb.count({ source: source.sid, hasRead: false }, (err, n) => {
            if (err) {
                reject(err)
            } else {
                source.unreadCount = n
                resolve(source)
            }
        })
    })
}

export function updateUnreadCounts(): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        await Promise.all(Object.values(getState().sources).map(async s => {
            dispatch(updateSourceDone(await unreadCount(s)))
        }))
    }
}

export function initSources(): AppThunk<Promise<void>> {
    return async (dispatch) => {
        dispatch(initSourcesRequest())
        await db.init()
        const sources = (await db.sourcesDB.select().from(db.sources).exec()) as RSSSource[]
        const promises = sources.map(s => unreadCount(s))
        const counted = await Promise.all(promises)
        dispatch(initSourcesSuccess(counted))
    }
}

export function addSourceRequest(batch: boolean): SourceActionTypes {
    return {
        type: ADD_SOURCE,
        batch: batch,
        status: ActionStatus.Request
    }
}

export function addSourceSuccess(source: RSSSource, batch: boolean): SourceActionTypes {
    return {
        type: ADD_SOURCE,
        batch: batch,
        status: ActionStatus.Success,
        source: source
    }
}

export function addSourceFailure(err, batch: boolean): SourceActionTypes {
    return {
        type: ADD_SOURCE,
        batch: batch,
        status: ActionStatus.Failure,
        err: err
    }
}

let insertPromises = Promise.resolve()
export function insertSource(source: RSSSource): AppThunk<Promise<RSSSource>> {
    return (_, getState) => {
        return new Promise((resolve, reject) => {
            insertPromises = insertPromises.then(async () => {
                let sids = Object.values(getState().sources).map(s => s.sid)
                source.sid = Math.max(...sids, -1) + 1
                const row = db.sources.createRow(source)
                try {
                    const inserted = (await db.sourcesDB.insert().into(db.sources).values([row]).exec()) as RSSSource[]
                    resolve(inserted[0])
                } catch {
                    reject(intl.get("sources.exist"))
                }
            })
        })
    }
}

export function addSource(url: string, name: string = null, batch = false): AppThunk<Promise<number>> {
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
                    window.utils.showErrorBox(intl.get("sources.errorAdd"), String(e))
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
        source: source
    }
}

export function updateSource(source: RSSSource): AppThunk<Promise<void>> {
    return async (dispatch) => {
        let sourceCopy = { ...source }
        delete sourceCopy.unreadCount
        const row = db.sources.createRow(sourceCopy)
        await db.sourcesDB.insertOrReplace().into(db.sources).values([row]).exec()
        dispatch(updateSourceDone(source))
    }
}

export function deleteSourceDone(source: RSSSource): SourceActionTypes {
    return {
        type: DELETE_SOURCE,
        source: source
    }
}

export function deleteSource(source: RSSSource, batch = false): AppThunk<Promise<void>> {
    return (dispatch, getState) => {
        return new Promise((resolve) => {
            if (!batch) dispatch(saveSettings())
            db.idb.remove({ source: source.sid }, { multi: true }, (err) => {
                if (err) {
                    console.log(err)
                    if (!batch) dispatch(saveSettings())
                    resolve()
                } else {
                    db.sourcesDB.delete().from(db.sources).where(
                        db.sources.sid.eq(source.sid)
                    ).exec().then(() => {
                        dispatch(deleteSourceDone(source))
                        window.settings.saveGroups(getState().groups)
                        if (!batch) dispatch(saveSettings())
                        resolve()
                    }).catch(err => {
                        console.log(err)
                        if (!batch) dispatch(saveSettings())
                        resolve()
                    })
                }
            })
        })
    }
}

export function deleteSources(sources: RSSSource[]): AppThunk<Promise<void>> {
    return async (dispatch) => {
        dispatch(saveSettings())
        for (let source of sources) {
            await dispatch(deleteSource(source, true))
        }
        dispatch(saveSettings())
    }
}

export function updateFavicon(sids?: number[], force=false): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        const initSources = getState().sources
        if (!sids) {
            sids = Object.values(initSources).filter(s => s.iconurl === undefined).map(s => s.sid)
        } else {
            sids = sids.filter(sid => sid in initSources)
        }
        const promises = sids.map(async sid => {
            const url = initSources[sid].url
            let favicon = (await fetchFavicon(url)) || ""
            const source = getState().sources[sid]
            if (source && source.url === url && (force || source.iconurl === undefined)) {
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
                case ActionStatus.Success: {
                    let newState: SourceState = {}
                    for (let source of action.sources) {
                        newState[source.sid] = source
                    }
                    return newState
                }
                default: return state
            }
        case ADD_SOURCE:
            switch (action.status) {
                case ActionStatus.Success: return {
                    ...state,
                    [action.source.sid]: action.source
                }
                default: return state
            }
        case UPDATE_SOURCE: return {
            ...state,
            [action.source.sid]: action.source
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
                        if (!item.hasRead) { updateMap.set(
                            item.source, 
                            updateMap.has(item.source) ? (updateMap.get(item.source) + 1) : 1
                        )}
                    }
                    let nextState = {} as SourceState
                    for (let [s, source] of Object.entries(state)) {
                        let sid = parseInt(s)
                        if (updateMap.has(sid)) {
                            nextState[sid] = {
                                ...source,
                                unreadCount: source.unreadCount + updateMap.get(sid)
                            } as RSSSource
                        } else {
                            nextState[sid] = source
                        }
                    }
                    return nextState
                }
                default: return state
            }
        }
        case MARK_UNREAD:
        case MARK_READ: return {
            ...state,
            [action.item.source]: {
                ...state[action.item.source],
                unreadCount: state[action.item.source].unreadCount + (action.type === MARK_UNREAD ? 1 : -1)
            } as RSSSource
        }
        case MARK_ALL_READ: {
            let nextState = { ...state }
            action.sids.map((sid, i) => {
                nextState[sid] = {
                    ...state[sid],
                    unreadCount: action.counts 
                        ? state[sid].unreadCount - action.counts[i]
                        : 0
                }
            })
            return nextState
        }
        default: return state
    }
}