import * as db from "../db"
import { SourceActionTypes, INIT_SOURCES, ADD_SOURCE, DELETE_SOURCE } from "./source"
import { ItemActionTypes, FETCH_ITEMS, RSSItem, MARK_READ, MARK_UNREAD, TOGGLE_STARRED, TOGGLE_HIDDEN, applyItemReduction, ItemState, MARK_ALL_READ } from "./item"
import { ActionStatus, AppThunk, mergeSortedArrays } from "../utils"
import { PageActionTypes, SELECT_PAGE, PageType, APPLY_FILTER } from "./page"

export enum FilterType {
    None,
    ShowRead = 1 << 0,
    ShowNotStarred = 1 << 1,
    ShowHidden = 1 << 2,
    FullSearch = 1 << 3,

    Default = ShowRead | ShowNotStarred,
    UnreadOnly = ShowNotStarred,
    StarredOnly = ShowRead,
    Toggles = ShowHidden | FullSearch
}
export class FeedFilter {
    type: FilterType
    search: string

    constructor(type=FilterType.Default, search="") {
        this.type = type
        this.search = search
    }

    static toQueryObject(filter: FeedFilter) {
        let type = filter.type
        let query = {
            hasRead: false,
            starred: true,
            hidden: { $exists: false }
        } as any
        if (type & FilterType.ShowRead) delete query.hasRead
        if (type & FilterType.ShowNotStarred) delete query.starred
        if (type & FilterType.ShowHidden) delete query.hidden
        if (filter.search !== "") {
            let regex = RegExp(filter.search, 'i')
            if (type & FilterType.FullSearch) {
                query.$or = [
                    { title: { $regex: regex } },
                    { snippet: { $regex: regex } }
                ]
            } else {
                query.title = { $regex: regex }
            }
        }
        return query
    }

    static testItem(filter: FeedFilter, item: RSSItem) {
        let type = filter.type
        let flag = true
        if (!(type & FilterType.ShowRead)) flag = flag && !item.hasRead
        if (!(type & FilterType.ShowNotStarred)) flag = flag && item.starred
        if (!(type & FilterType.ShowHidden)) flag = flag && !item.hidden
        if (filter.search !== "") { 
            let regex = RegExp(filter.search)
            if (type & FilterType.FullSearch) {
                flag = flag && (regex.test(item.title) || regex.test(item.snippet))
            } else {
                flag = flag && regex.test(item.title)
            }
        }
        return Boolean(flag)
    }
}

export const ALL = "ALL"
export const SOURCE = "SOURCE"

const LOAD_QUANTITY = 50

export class RSSFeed {
    _id: string
    loaded: boolean
    loading: boolean
    allLoaded: boolean
    sids: number[]
    iids: string[]
    filter: FeedFilter

    constructor (id: string = null, sids=[], filter=null) {
        this._id = id
        this.sids = sids
        this.iids = []
        this.loaded = false
        this.allLoaded = false
        this.filter = filter === null ? new FeedFilter() : filter
    }

    static loadFeed(feed: RSSFeed, init = false): Promise<RSSItem[]> {
        return new Promise<RSSItem[]>((resolve, reject) => {
            let query = {
                source: { $in: feed.sids },
                ...FeedFilter.toQueryObject(feed.filter)
            }
            db.idb.find(query)
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
    [_id: string]: RSSFeed
}

export const INIT_FEEDS = "INIT_FEEDS"
export const INIT_FEED = "INIT_FEED"
export const LOAD_MORE = "LOAD_MORE"

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
                    [ALL]: new RSSFeed(ALL, [...state[ALL].sids, action.source.sid], state[ALL].filter)
                }
                default: return state
            }
        case DELETE_SOURCE: {
            let nextState = {}
            for (let [id, feed] of Object.entries(state)) {
                nextState[id] = new RSSFeed(id, feed.sids.filter(sid => sid != action.source.sid), feed.filter)
            }
            return nextState
        }
        case APPLY_FILTER: {
            let nextState = {}
            for (let [id, feed] of Object.entries(state)) {
                nextState[id] = {
                    ...feed,
                    filter: action.filter
                }
            }
            return nextState
        }
        case FETCH_ITEMS:
            switch (action.status) {
                case ActionStatus.Success: {
                    let nextState = { ...state }
                    for (let feed of Object.values(state)) {
                        if (feed.loaded) {
                            let items = action.items
                                .filter(i => feed.sids.includes(i.source) && FeedFilter.testItem(feed.filter, i))
                            if (items.length > 0) {
                                let oldItems = feed.iids.map(id => action.itemState[id])
                                let nextItems = mergeSortedArrays(oldItems, items, (a, b) => b.date.getTime() - a.date.getTime())
                                nextState[feed._id] = { 
                                    ...feed, 
                                    iids: nextItems.map(i => i._id)
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
                    [action.feed._id]: {
                        ...action.feed,
                        loaded: true,
                        allLoaded: action.items.length < LOAD_QUANTITY,
                        iids: action.items.map(i => i._id)
                    }
                }
                default: return state
            }
        case LOAD_MORE:
            switch (action.status) {
                case ActionStatus.Request: return {
                    ...state,
                    [action.feed._id] : {
                        ...action.feed,
                        loading: true
                    }
                }
                case ActionStatus.Success: return {
                    ...state,
                    [action.feed._id] : {
                        ...action.feed,
                        loading: false,
                        allLoaded: action.items.length < LOAD_QUANTITY,
                        iids: [...action.feed.iids, ...action.items.map(i => i._id)]
                    }
                }
                case ActionStatus.Failure: return {
                    ...state,
                    [action.feed._id] : {
                        ...action.feed,
                        loading: false
                    }
                }
                default: return state
            }
        case MARK_READ:
        case MARK_UNREAD:
        case TOGGLE_STARRED:
        case TOGGLE_HIDDEN: {
            let nextItem = applyItemReduction(action.item, action.type)
            let filteredFeeds = Object.values(state).filter(feed => feed.loaded && !FeedFilter.testItem(feed.filter, nextItem))
            if (filteredFeeds.length > 0) {
                let nextState = { ...state }
                for (let feed of filteredFeeds) {
                    nextState[feed._id] = {
                        ...feed,
                        iids: feed.iids.filter(id => id != nextItem._id)
                    }
                }
                return nextState
            } else {
                return state
            }
        }
        case SELECT_PAGE:
            switch (action.pageType) {
                case PageType.Sources: return {
                    ...state,
                    [SOURCE]: new RSSFeed(SOURCE, action.sids, action.filter)
                }
                case PageType.AllArticles: return action.init ? {
                    ...state,
                    [ALL]: {
                        ...state[ALL],
                        loaded: false,
                        filter: action.filter
                    }
                } : state
                default: return state
            }
        default: return state
    }
}