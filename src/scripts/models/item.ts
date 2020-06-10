import * as db from "../db"
import { rssParser, domParser, htmlDecode, ActionStatus, AppThunk } from "../utils"
import { RSSSource } from "./source"
import { FeedActionTypes, INIT_FEED, LOAD_MORE } from "./feed"
import Parser = require("@yang991178/rss-parser")

export class RSSItem {
    _id: string
    source: number
    title: string
    link: string
    date: Date
    fetchedDate: Date
    thumb?: string
    content: string
    snippet: string
    creator?: string
    categories?: string[]
    hasRead: boolean
    starred?: true
    hidden?: true

    constructor (item: Parser.Item, source: RSSSource) {
        this.source = source.sid
        this.title = item.title || ""
        this.link = item.link || ""
        this.fetchedDate = new Date()
        this.date = item.isoDate ? new Date(item.isoDate) : this.fetchedDate
        if (item.thumb) this.thumb = item.thumb
        else if (item.image) this.thumb = item.image
        else {
            let dom = domParser.parseFromString(item.content, "text/html")
            let baseEl = dom.createElement('base')
            baseEl.setAttribute('href', this.link.split("/").slice(0, 3).join("/"))
            dom.head.append(baseEl)
            let img = dom.querySelector("img")
            if (img && img.src) this.thumb = img.src
        }
        if (item.fullContent) {
            this.content = item.fullContent
            this.snippet = htmlDecode(item.fullContent)
        } else {
            this.content = item.content || ""
            this.snippet = htmlDecode(item.contentSnippet || "")
        }
        this.creator = item.creator
        this.categories = item.categories
        this.hasRead = false
    }
}

export type ItemState = {
    [_id: string]: RSSItem
}

export const FETCH_ITEMS = 'FETCH_ITEMS'
export const MARK_READ = "MARK_READ"
export const MARK_UNREAD = "MARK_UNREAD"
export const TOGGLE_STARRED = "TOGGLE_STARRED"
export const TOGGLE_HIDDEN = "TOGGLE_HIDDEN"

interface FetchItemsAction {
    type: typeof FETCH_ITEMS
    status: ActionStatus
    fetchCount?: number
    items?: RSSItem[]
    errSource?: RSSSource
    err?
}

interface MarkReadAction {
    type: typeof MARK_READ
    item: RSSItem
}

interface MarkUnreadAction {
    type: typeof MARK_UNREAD
    item: RSSItem
}

interface ToggleStarredAction {
    type: typeof TOGGLE_STARRED
    item: RSSItem
}

interface ToggleHiddenAction {
    type: typeof TOGGLE_HIDDEN
    item: RSSItem
}

export type ItemActionTypes = FetchItemsAction | MarkReadAction | MarkUnreadAction | ToggleStarredAction | ToggleHiddenAction

export function fetchItemsRequest(fetchCount = 0): ItemActionTypes {
    return {
        type: FETCH_ITEMS,
        status: ActionStatus.Request,
        fetchCount: fetchCount
    }
}

export function fetchItemsSuccess(items: RSSItem[]): ItemActionTypes {
    return {
        type: FETCH_ITEMS,
        status: ActionStatus.Success,
        items: items
    }
}

export function fetchItemsFailure(source: RSSSource, err): ItemActionTypes {
    return {
        type: FETCH_ITEMS,
        status: ActionStatus.Failure,
        errSource: source,
        err: err
    }
}

export function fetchItemsIntermediate(): ItemActionTypes {
    return {
        type: FETCH_ITEMS,
        status: ActionStatus.Intermediate
    }
}

export function insertItems(items: RSSItem[]): Promise<RSSItem[]> {
    return new Promise<RSSItem[]>((resolve, reject) => {
        items.sort((a, b) => a.date.getTime() - b.date.getTime())
        db.idb.insert(items, (err, inserted) => {
            if (err) {
                reject(err)
            } else {
                resolve(inserted)
            }
        })
    })
}

export function fetchItems(): AppThunk<Promise<void>> {
    return (dispatch, getState) => {
        let promises = new Array<Promise<RSSItem[]>>()
        if (!getState().app.fetchingItems) {
            for (let source of <RSSSource[]>Object.values(getState().sources)) {
                let promise = RSSSource.fetchItems(source, rssParser, db.idb)
                promise.finally(() => dispatch(fetchItemsIntermediate()))
                promises.push(promise)
            }
            dispatch(fetchItemsRequest(promises.length))
            return Promise.allSettled(promises).then(results => new Promise<void>((resolve, reject) => { 
                let items = new Array<RSSItem>()
                results.map((r, i) => {
                    if (r.status === "fulfilled") items.push(...r.value)
                    else {
                        console.log(r.reason)
                        dispatch(fetchItemsFailure(getState().sources[i], r.reason))
                    }
                })
                insertItems(items)
                .then(inserted => {
                    dispatch(fetchItemsSuccess(inserted.reverse()))
                    resolve()
                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                })
            }))
        }
        return new Promise((resolve) => { resolve() })
    }
}

const markReadDone = (item: RSSItem): ItemActionTypes => ({ 
    type: MARK_READ, 
    item: item 
})

const markUnreadDone = (item: RSSItem): ItemActionTypes => ({ 
    type: MARK_UNREAD, 
    item: item 
})

export function markRead(item: RSSItem): AppThunk {
    return (dispatch) => {
        db.idb.update({ _id: item._id }, { $set: { hasRead: true } })
        dispatch(markReadDone(item))
    }
}

export function markUnread(item: RSSItem): AppThunk {
    return (dispatch) => {
        db.idb.update({ _id: item._id }, { $set: { hasRead: false } })
        dispatch(markUnreadDone(item))
    }
}

const toggleStarredDone = (item: RSSItem): ItemActionTypes => ({ 
    type: TOGGLE_STARRED, 
    item: item 
})

export function toggleStarred(item: RSSItem): AppThunk {
    return (dispatch) => {
        if (item.starred === true) {
            db.idb.update({ _id: item._id }, { $unset: { starred: true } })
        } else {
            db.idb.update({ _id: item._id }, { $set: { starred: true } })
        }
        dispatch(toggleStarredDone(item))
    }
}

const toggleHiddenDone = (item: RSSItem): ItemActionTypes => ({ 
    type: TOGGLE_HIDDEN, 
    item: item 
})

export function toggleHidden(item: RSSItem): AppThunk {
    return (dispatch) => {
        if (item.hidden === true) {
            db.idb.update({ _id: item._id }, { $unset: { hidden: true } })
        } else {
            db.idb.update({ _id: item._id }, { $set: { hidden: true } })
        }
        dispatch(toggleHiddenDone(item))
    }
}

export function itemReducer(
    state: ItemState = {},
    action: ItemActionTypes | FeedActionTypes
): ItemState {
    switch (action.type) {
        case FETCH_ITEMS:
            switch (action.status) {
                case ActionStatus.Success: {
                    let newMap = {}
                    for (let i of action.items) {
                        newMap[i._id] = i
                    }
                    return {...newMap, ...state}
                }
                default: return state
            }
        case MARK_UNREAD:
        case MARK_READ: return {
            ...state,
            [action.item._id] : {
                ...action.item,
                hasRead: action.type === MARK_READ
            }
        }
        case TOGGLE_STARRED: {
            let newItem = { ...action.item }
            if (newItem.starred === true) delete newItem.starred
            else newItem.starred = true
            return {
                ...state,
                [newItem._id]: newItem
            }
        }
        case TOGGLE_HIDDEN: {
            let newItem = { ...action.item }
            if (newItem.hidden === true) delete newItem.hidden
            else newItem.hidden = true
            return {
                ...state,
                [newItem._id]: newItem
            }
        }
        case LOAD_MORE:
        case INIT_FEED: {
            switch (action.status) {
                case ActionStatus.Success: {
                    let nextState = { ...state }
                    for (let i of action.items) {
                        nextState[i._id] = i
                    }
                    return nextState
                }
                default: return state
            }
        }
        default: return state
    }
}