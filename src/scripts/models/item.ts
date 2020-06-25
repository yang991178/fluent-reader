import * as db from "../db"
import intl = require("react-intl-universal")
import { domParser, htmlDecode, ActionStatus, AppThunk, openExternal } from "../utils"
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
    hasRead: boolean
    starred?: true
    hidden?: true

    constructor (item: Parser.Item, source: RSSSource) {
        this.source = source.sid
        this.title = item.title || intl.get("article.untitled")
        this.link = item.link || ""
        this.fetchedDate = new Date()
        this.date = item.isoDate ? new Date(item.isoDate) : this.fetchedDate
        this.creator = item.creator
        this.hasRead = false
    }

    static parseContent(item: RSSItem, parsed: Parser.Item) {
        if (parsed.fullContent) {
            item.content = parsed.fullContent
            item.snippet = htmlDecode(parsed.fullContent)
        } else {
            item.content = parsed.content || ""
            item.snippet = htmlDecode(parsed.contentSnippet || "")
        }
        if (parsed.thumb) item.thumb = parsed.thumb
        else if (parsed.image) item.thumb = parsed.image
        else if (parsed.mediaContent) {
            let images = parsed.mediaContent.filter(c => c.$ && c.$.medium === "image" && c.$.url)
            if (images.length > 0) item.thumb = images[0].$.url
        }
        if(!item.thumb) {
            let dom = domParser.parseFromString(item.content, "text/html")
            let baseEl = dom.createElement('base')
            baseEl.setAttribute('href', item.link.split("/").slice(0, 3).join("/"))
            dom.head.append(baseEl)
            let img = dom.querySelector("img")
            if (img && img.src) item.thumb = img.src
        }
    }
}

export type ItemState = {
    [_id: string]: RSSItem
}

export const FETCH_ITEMS = 'FETCH_ITEMS'
export const MARK_READ = "MARK_READ"
export const MARK_ALL_READ = "MARK_ALL_READ"
export const MARK_UNREAD = "MARK_UNREAD"
export const TOGGLE_STARRED = "TOGGLE_STARRED"
export const TOGGLE_HIDDEN = "TOGGLE_HIDDEN"

interface FetchItemsAction {
    type: typeof FETCH_ITEMS
    status: ActionStatus
    fetchCount?: number
    items?: RSSItem[]
    itemState?: ItemState
    errSource?: RSSSource
    err?
}

interface MarkReadAction {
    type: typeof MARK_READ
    item: RSSItem
}

interface MarkAllReadAction {
    type: typeof MARK_ALL_READ,
    sids: number[]
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

export type ItemActionTypes = FetchItemsAction | MarkReadAction | MarkAllReadAction | MarkUnreadAction 
    | ToggleStarredAction | ToggleHiddenAction

export function fetchItemsRequest(fetchCount = 0): ItemActionTypes {
    return {
        type: FETCH_ITEMS,
        status: ActionStatus.Request,
        fetchCount: fetchCount
    }
}

export function fetchItemsSuccess(items: RSSItem[], itemState: ItemState): ItemActionTypes {
    return {
        type: FETCH_ITEMS,
        status: ActionStatus.Success,
        items: items,
        itemState: itemState
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
            let timenow = new Date().getTime()
            let sources = <RSSSource[]>Object.values(getState().sources).filter(s =>
                ((s.lastFetched ? s.lastFetched.getTime() : 0) + (s.fetchFrequency || 0) * 60000) <= timenow
            )
            for (let source of sources) {
                let promise = RSSSource.fetchItems(source)
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
                        dispatch(fetchItemsFailure(sources[i], r.reason))
                    }
                })
                insertItems(items)
                .then(inserted => {
                    dispatch(fetchItemsSuccess(inserted.reverse(), getState().items))
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

const markAllReadDone = (sids: number[]): ItemActionTypes => ({
    type: MARK_ALL_READ,
    sids: sids
})

const markUnreadDone = (item: RSSItem): ItemActionTypes => ({ 
    type: MARK_UNREAD, 
    item: item 
})

export function markRead(item: RSSItem): AppThunk {
    return (dispatch) => {
        if (!item.hasRead) {
            db.idb.update({ _id: item._id }, { $set: { hasRead: true } })
            dispatch(markReadDone(item))
        }
    }
}

export function markAllRead(sids: number[] = null): AppThunk {
    return (dispatch, getState) => {
        if (sids === null) {
            let state = getState()
            let feed = state.feeds[state.page.feedId]
            sids = feed.sids
        }
        let query = { source: { $in: sids } }
        db.idb.update(query, { $set: { hasRead: true } }, { multi: true }, (err) => {
            if (err) {
                console.log(err)
            }
        })
        dispatch(markAllReadDone(sids))
    }
}

export function markUnread(item: RSSItem): AppThunk {
    return (dispatch) => {
        if (item.hasRead) {
            db.idb.update({ _id: item._id }, { $set: { hasRead: false } })
            dispatch(markUnreadDone(item))
        }
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

export function itemShortcuts(item: RSSItem, key: string): AppThunk {
    return (dispatch) => {
        switch (key) {
            case "m": case "M":
                if (item.hasRead) dispatch(markUnread(item))
                else dispatch(markRead(item))
                break
            case "b": case "B":
                if (!item.hasRead) dispatch(markRead(item))
                openExternal(item.link)
                break
            case "s": case "S":
                dispatch(toggleStarred(item))
                break
            case "h": case "H":
                dispatch(toggleHidden(item))
                break
        }
    }
}

export function applyItemReduction(item: RSSItem, type: string) {
    let nextItem = { ...item }
    switch (type) {
        case MARK_READ:
        case MARK_UNREAD: {
            nextItem.hasRead = type === MARK_READ
            break
        }
        case TOGGLE_STARRED: {
            if (item.starred === true) delete nextItem.starred
            else nextItem.starred = true
            break
        }
        case TOGGLE_HIDDEN: {
            if (item.hidden === true) delete nextItem.hidden
            else nextItem.hidden = true
            break
        }
    }
    return nextItem
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
        case MARK_READ:
        case TOGGLE_STARRED:
        case TOGGLE_HIDDEN: {
            return {
                ...state,
                [action.item._id]: applyItemReduction(action.item, action.type)
            }
        }
        case MARK_ALL_READ: {
            let nextState = {} as ItemState
            let sids = new Set(action.sids)
            for (let [id, item] of Object.entries(state)) {
                if (sids.has(item.source) && !item.hasRead) {
                    nextState[id] = {
                        ...item,
                        hasRead: true
                    }
                } else {
                    nextState[id] = item
                }
            }
            return nextState
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