import * as db from "../db"
import { SourceActionTypes, INIT_SOURCES, ADD_SOURCE, DELETE_SOURCE } from "./source"
import { ItemActionTypes, FETCH_ITEMS, RSSItem } from "./item"
import { ActionStatus, AppThunk } from "../utils"
import { PageActionTypes, SELECT_PAGE, PageType } from "./page"

export const ALL = "ALL"
export const SOURCE = "SOURCE"
export type FeedIdType = number | string

const LOAD_QUANTITY = 50

export class RSSFeed {
    id: FeedIdType
    loaded: boolean
    loading: boolean
    allLoaded: boolean
    sids: number[]
    iids: number[]

    constructor (id: FeedIdType, sids=[]) {
        this.id = id
        this.sids = sids
        this.iids = []
        this.loaded = false
        this.allLoaded = false
    }

    static loadFeed(feed: RSSFeed, init = false): Promise<RSSItem[]> {
        return new Promise<RSSItem[]>((resolve, reject) => {
            db.idb.find({ source: { $in: feed.sids } })
                .sort({ date: -1 })
                .skip(init ? 0 : feed.iids.length)
                .limit(LOAD_QUANTITY)
                .exec((err, docs) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(docs)
                    }
                })
        })
    }
}

export type FeedState = {
    [id in FeedIdType]: RSSFeed
}

export const INIT_FEEDS = 'INIT_FEEDS'
export const INIT_FEED = 'INIT_FEED'
export const LOAD_MORE = 'LOAD_MORE'

interface initFeedsAction {
    type: typeof INIT_FEEDS
    status: ActionStatus
}

interface initFeedAction {
    type: typeof INIT_FEED
    status: ActionStatus
    feed?: RSSFeed
    items?: RSSItem[]
    err?
}

interface loadMoreAction {
    type: typeof LOAD_MORE
    status: ActionStatus
    feed: RSSFeed
    items?: RSSItem[]
    err?
}

export type FeedActionTypes = initFeedAction | initFeedsAction | loadMoreAction

export function initFeedsRequest(): FeedActionTypes {
    return {
        type: INIT_FEEDS,
        status: ActionStatus.Request
    }
}
export function initFeedsSuccess(): FeedActionTypes {
    return {
        type: INIT_FEEDS,
        status: ActionStatus.Success
    }
}

export function initFeedSuccess(feed: RSSFeed, items: RSSItem[]): FeedActionTypes {
    return {
        type: INIT_FEED,
        status: ActionStatus.Success,
        items: items,
        feed: feed
    }
}

export function initFeedFailure(err): FeedActionTypes {
    return {
        type: INIT_FEED,
        status: ActionStatus.Failure,
        err: err
    }
}

export function initFeeds(force = false): AppThunk<Promise<void>> {
    return (dispatch, getState) => {
        dispatch(initFeedsRequest())
        let promises = new Array<Promise<void>>()
        for (let feed of Object.values(getState().feeds)) {
            if (!feed.loaded || force) {
                let p = RSSFeed.loadFeed(feed, force).then(items => {
                    dispatch(initFeedSuccess(feed, items))
                }).catch(err => { 
                    console.log(err)
                    dispatch(initFeedFailure(err)) 
                })
                promises.push(p)
            }
        }
        return Promise.allSettled(promises).then(() => {
            dispatch(initFeedsSuccess())
        })
    }
}

export function loadMoreRequest(feed: RSSFeed): FeedActionTypes {
    return {
        type: LOAD_MORE,
        status: ActionStatus.Request,
        feed: feed
    }
}

export function loadMoreSuccess(feed: RSSFeed, items: RSSItem[]): FeedActionTypes {
    return {
        type: LOAD_MORE,
        status: ActionStatus.Success,
        feed: feed,
        items: items
    }
}

export function loadMoreFailure(feed: RSSFeed, err): FeedActionTypes {
    return {
        type: LOAD_MORE,
        status: ActionStatus.Failure,
        feed: feed,
        err: err
    }
}

export function loadMore(feed: RSSFeed): AppThunk<Promise<void>> {
    return (dispatch) => {
        if (feed.loaded && !feed.loading && !feed.allLoaded) {
            dispatch(loadMoreRequest(feed))
            return RSSFeed.loadFeed(feed).then(items => {
                dispatch(loadMoreSuccess(feed, items))
            }).catch(e => { 
                console.log(e)
                dispatch(loadMoreFailure(feed, e)) 
            })
        }
        return new Promise((_, reject) => { reject() })
    }
}

export function feedReducer(
    state: FeedState = { [ALL]: new RSSFeed(ALL) },
    action: SourceActionTypes | ItemActionTypes | FeedActionTypes | PageActionTypes
): FeedState {
    switch (action.type) {
        case INIT_SOURCES:
            switch (action.status) {
                case ActionStatus.Success: return {
                    ...state,
                    [ALL]: new RSSFeed(ALL, action.sources.map(s => s.sid))
                }
                default: return state
            }
        case ADD_SOURCE:
            switch (action.status) {
                case ActionStatus.Success: return {
                    ...state,
                    [ALL]: new RSSFeed(ALL, [...state[ALL].sids, action.source.sid])
                }
                default: return state
            }
        case DELETE_SOURCE: {
            let nextState = {}
            for (let [id, feed] of Object.entries(state)) {
                nextState[id] = new RSSFeed(id, feed.sids.filter(sid => sid != action.source.sid))
            }
            return nextState
        }
        case FETCH_ITEMS:
            switch (action.status) {
                case ActionStatus.Success: {
                    let nextState = { ...state }
                    for (let k of Object.keys(state)) {
                        if (state[k].loaded) {
                            let iids = action.items.filter(i => state[k].sids.includes(i.source)).map(i => i.id)
                            if (iids.length > 0) {
                                nextState[k] = { 
                                    ...nextState[k], 
                                    iids: [...iids, ...nextState[k].iids]
                                }
                            }
                        }
                    }
                    return nextState
                }
                default: return state
            }
        case INIT_FEED: 
            switch (action.status) {
                case ActionStatus.Success: return {
                    ...state,
                    [action.feed.id]: {
                        ...action.feed,
                        loaded: true,
                        allLoaded: action.items.length < LOAD_QUANTITY,
                        iids: action.items.map(i => i.id)
                    }
                }
                default: return state
            }
        case LOAD_MORE:
            switch (action.status) {
                case ActionStatus.Request: return {
                    ...state,
                    [action.feed.id] : {
                        ...action.feed,
                        loading: true
                    }
                }
                case ActionStatus.Success: return {
                    ...state,
                    [action.feed.id] : {
                        ...action.feed,
                        loading: false,
                        allLoaded: action.items.length < LOAD_QUANTITY,
                        iids: [...action.feed.iids, ...action.items.map(i => i.id)]
                    }
                }
                case ActionStatus.Failure: return {
                    ...state,
                    [action.feed.id] : {
                        ...action.feed,
                        loading: false
                    }
                }
            }
        case SELECT_PAGE:
            switch (action.pageType) {
                case PageType.Sources: return {
                    ...state,
                    [SOURCE]: new RSSFeed(SOURCE, action.sids)
                }
                case PageType.AllArticles: return action.init ? {
                    ...state,
                    [ALL]: {
                        ...state[ALL],
                        loaded: false
                    }
                } : state
                default: return state
            }
        default: return state
    }
}