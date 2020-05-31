import Parser = require("rss-parser")
import * as db from "../db"
import { rssParser, faviconPromise, ActionStatus, AppThunk } from "../utils"
import { RSSItem } from "./item"

export class RSSSource {
    sid: number
    url: string
    iconurl: string
    name: string
    description: string
    useProxy: boolean

    constructor(url: string, useProxy=false) {
        this.url = url
        this.useProxy = useProxy
    }

    async fetchMetaData(parser: Parser) {
        let feed = await parser.parseURL(this.url)
        this.name = feed.title
        this.description = feed.description
        let domain = this.url.split("/").slice(0, 3).join("/")
        this.iconurl = await faviconPromise(domain)
        if (this.iconurl === null) {
            let f = domain + "/favicon.ico"
            let result = await fetch(f)
            if (result.status == 200) this.iconurl = f
        }
    }

    private static checkItem(source:RSSSource, item: Parser.Item, db: Nedb<RSSItem>): Promise<RSSItem> {
        return new Promise<RSSItem>((resolve, reject) => {
            let i = new RSSItem(item, source)
            db.findOne({
                source: i.source,
                title: i.title,
                date: i.date
            },
            (err, doc) => {
                if (err) {
                    reject(err)
                } else if (doc === null) {
                    resolve(i)
                } else {
                    resolve(null)
                }
            }) 
        })
    }

    static fetchItems(source:RSSSource, parser: Parser, db: Nedb<RSSItem>): Promise<RSSItem[]> {
        return new Promise<RSSItem[]>((resolve, reject) => {
            parser.parseURL(source.url)
                .then(feed => {
                    let p = new Array<Promise<RSSItem>>()
                    for (let item of feed.items) {
                        p.push(this.checkItem(source, item, db))
                    }
                    Promise.all(p).then(values => {
                        resolve(values.filter(v => v != null))
                    }).catch(e => { reject(e) })
                })
                .catch(e => { reject(e) })
        })
    }
}

export type SourceState = {
    [sid: number]: RSSSource
}

export const INIT_SOURCES = 'INIT_SOURCES'
export const ADD_SOURCE = 'ADD_SOURCE'
export const UPDATE_SOURCE = 'UPDATE_SOURCE'

interface InitSourcesAction {
    type: typeof INIT_SOURCES
    status: ActionStatus
    sources?: RSSSource[]
    err?
}

interface AddSourceAction {
    type: typeof ADD_SOURCE
    status: ActionStatus
    source?: RSSSource
    err?
}

interface UpdateSourceAction {
    type: typeof UPDATE_SOURCE
    status: ActionStatus
    source?: RSSSource
    err?
}

export type SourceActionTypes = InitSourcesAction | AddSourceAction | UpdateSourceAction

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

export function initSources(): AppThunk<Promise<void>> {
    return (dispatch) => {
        dispatch(initSourcesRequest())
        return new Promise<void>((resolve, reject) => {
            db.sdb.find({}).sort({ sid: 1 }).exec((err, docs) => {
                if (err) {
                    dispatch(initSourcesFailure(err))
                    reject(err)
                } else {
                    dispatch(initSourcesSuccess(docs))
                    resolve()
                }
            })
        }) 
    }
}

export function addSourceRequest(): SourceActionTypes {
    return {
        type: ADD_SOURCE,
        status: ActionStatus.Request
    }
}

export function addSourceSuccess(source: RSSSource): SourceActionTypes {
    return {
        type: ADD_SOURCE,
        status: ActionStatus.Success,
        source: source
    }
}

export function addSourceFailure(err): SourceActionTypes {
    return {
        type: ADD_SOURCE,
        status: ActionStatus.Failure,
        err: err
    }
}

export function addSource(url: string): AppThunk<Promise<void>> {
    return (dispatch, getState) => {
        if (getState().app.sourceInit) {
            dispatch(addSourceRequest())
            let source = new RSSSource(url)
            return source.fetchMetaData(rssParser)
                .then(() => {
                    let sids = Object.values(getState().sources).map(s=>s.sid)
                    source.sid = Math.max(...sids, -1) + 1
                    return new Promise<void>((resolve, reject) => { 
                        db.sdb.insert(source, (err) => {
                            if (err) {
                                console.log(err)
                                dispatch(addSourceFailure(err))
                                reject(err)
                            } else {
                                dispatch(addSourceSuccess(source))
                                /* dispatch(fetchItems()).then(() => {
                                    dispatch(initFeeds())
                                }) */
                                resolve()
                            }
                        })
                    })
                })
                .catch(e => {
                    console.log(e)
                    dispatch(addSourceFailure(e))
                })
        }
        return new Promise((_, reject) => { reject("Need to init sources before adding.") })
    }
}

export function sourceReducer(
    state: SourceState = {},
    action: SourceActionTypes
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
        default: return state
    }
}