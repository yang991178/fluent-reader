import Parser = require("@yang991178/rss-parser")
import intl = require("react-intl-universal")
import * as db from "../db"
import { fetchFavicon, ActionStatus, AppThunk, parseRSS } from "../utils"
import { RSSItem, insertItems, ItemActionTypes, FETCH_ITEMS, MARK_READ, MARK_UNREAD, MARK_ALL_READ } from "./item"
import { SourceGroup } from "./group"
import { saveSettings } from "./app"
import { remote } from "electron"

export enum SourceOpenTarget {
    Local, Webpage, External
}

export class RSSSource {
    sid: number
    url: string
    iconurl: string
    name: string
    openTarget: SourceOpenTarget
    unreadCount: number
    lastFetched: Date
    fetchFrequency?: number // in minutes

    constructor(url: string, name: string = null) {
        this.url = url
        this.name = name
        this.openTarget = SourceOpenTarget.Local
        this.lastFetched = new Date()
    }

    static async fetchMetaData(source: RSSSource) {
        let feed = await parseRSS(source.url)
        if (!source.name) {
            if (feed.title) source.name = feed.title.trim()
            source.name = source.name || intl.get("sources.untitled")
        }
        let domain = source.url.split("/").slice(0, 3).join("/")
        try {
            let f = await fetchFavicon(domain)
            if (f !== null) source.iconurl = f
        } finally {
            return feed
        }
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
        db.sdb.update({ sid: source.sid }, { $set: { lastFetched: new Date() } })
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

export function initSources(): AppThunk<Promise<void>> {
    return (dispatch) => {
        dispatch(initSourcesRequest())
        return new Promise<void>((resolve, reject) => {
            db.sdb.find({}).sort({ sid: 1 }).exec((err, sources) => {
                if (err) {
                    dispatch(initSourcesFailure(err))
                    reject(err)
                } else {
                    let p = sources.map(s => unreadCount(s))
                    Promise.all(p)
                        .then(values => {
                            dispatch(initSourcesSuccess(values))
                            resolve()
                        })
                        .catch(err => reject(err))
                }
            })
        }) 
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

function insertSource(source: RSSSource, trials = 0): AppThunk<Promise<RSSSource>> {
    return (dispatch, getState) => {
        return new Promise((resolve, reject) => {
            if (trials >= 25) {
                reject("Failed to insert the source into NeDB.")
                return
            }
            let sids = Object.values(getState().sources).map(s => s.sid)
            source.sid = Math.max(...sids, -1) + 1
            db.sdb.insert(source, (err, inserted) => {
                if (err) {
                    if (/^Can't insert key [0-9]+,/.test(err.message)) {
                        console.log("sid conflict")
                        dispatch(insertSource(source, trials + 1))
                            .then(inserted => resolve(inserted))
                            .catch(err => reject(err))
                    } else {
                        reject(err)
                    }
                } else {
                    resolve(inserted)
                }
            })
        })
    }

}

export function addSource(url: string, name: string = null, batch = false): AppThunk<Promise<number>> {
    return (dispatch, getState) => {
        let app = getState().app
        if (app.sourceInit) {
            dispatch(addSourceRequest(batch))
            let source = new RSSSource(url, name)
            return RSSSource.fetchMetaData(source)
                .then(feed => {
                    return dispatch(insertSource(source))
                        .then(inserted => {
                            inserted.unreadCount = feed.items.length
                            dispatch(addSourceSuccess(inserted, batch))
                            return RSSSource.checkItems(inserted, feed.items)
                                .then(items => insertItems(items))
                                .then(() => {
                                    SourceGroup.save(getState().groups)
                                    return inserted.sid
                                })
                        })
                })
                .catch(e => {
                    dispatch(addSourceFailure(e, batch))
                    if (!batch) {
                        remote.dialog.showErrorBox(intl.get("sources.errorAdd"), String(e))
                    }
                    return Promise.reject(e)
                })
        }
        return new Promise((_, reject) => { reject("Sources not initialized.") })
    }
}

export function updateSourceDone(source: RSSSource): SourceActionTypes {
    return {
        type: UPDATE_SOURCE,
        source: source
    }
}

export function updateSource(source: RSSSource): AppThunk {
    return (dispatch) => {
        let sourceCopy = { ...source }
        delete sourceCopy.sid
        delete sourceCopy.unreadCount
        db.sdb.update({ sid: source.sid }, { $set: { ...sourceCopy }}, {}, err => {
            if (!err) {
                dispatch(updateSourceDone(source))
            }
        })
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
                    db.sdb.remove({ sid: source.sid }, {}, (err) => {
                        if (err) {
                            console.log(err)
                            if (!batch) dispatch(saveSettings())
                            resolve()
                        } else {
                            dispatch(deleteSourceDone(source))
                            SourceGroup.save(getState().groups)
                            if (!batch) dispatch(saveSettings())
                            resolve()
                        }
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
                        updateMap.set(
                            item.source, 
                            updateMap.has(item.source) ? (updateMap.get(item.source) + 1) : 1)
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
            let nextState = {} as SourceState
            let sids = new Set(action.sids)
            for (let [s, source] of Object.entries(state)) {
                let sid = parseInt(s)
                if (sids.has(sid) && source.unreadCount > 0) {
                    nextState[sid] = {
                        ...source,
                        unreadCount: 0
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