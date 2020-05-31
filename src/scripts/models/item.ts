import * as db from "../db"
import { rssParser, rssProxyParser, domParser, htmlDecode, ActionStatus, AppThunk } from "../utils"
import { RSSSource } from "./source"
import { FeedActionTypes, INIT_FEED, LOAD_MORE } from "./feed"
import Parser = require("rss-parser")

export class RSSItem {
    id: number
    source: number
    title: string
    link: string
    date: Date
    fetchedDate: Date
    thumb?: string
    content: string
    snippet: string
    creator: string
    categories: string[]
    hasRead: boolean

    constructor (item: Parser.Item, source: RSSSource) {
        this.source = source.sid
        this.title = item.title
        this.link = item.link
        this.date = new Date(item.isoDate)
        this.fetchedDate = new Date()
        if (item.thumb) this.thumb = item.thumb
        else if (item.image) this.thumb = item.image
        else {
            let dom = domParser.parseFromString(item.content, "text/html")
            let img = dom.querySelector("img")
            if (img && img.src) this.thumb = img.src
        }
        if (item.fullContent) {
            this.content = item.fullContent
            this.snippet = htmlDecode(item.fullContent)
        } else {
            this.content = item.content
            this.snippet = htmlDecode(item.contentSnippet)
        }
        this.creator = item.creator
        this.categories = item.categories
        this.hasRead = false
    }
}

export type ItemState = {
    [id: number]: RSSItem
}

export const FETCH_ITEMS = 'FETCH_ITEMS'
export const MARK_READ = "MARK_READ"
export const MARK_UNREAD = "MARK_UNREAD"

interface FetchItemsAction {
    type: typeof FETCH_ITEMS
    status: ActionStatus
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

export type ItemActionTypes = FetchItemsAction | MarkReadAction | MarkUnreadAction

export function fetchItemsRequest(): ItemActionTypes {
    return {
        type: FETCH_ITEMS,
        status: ActionStatus.Request
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

export function fetchItems(): AppThunk<Promise<void>> {
    return (dispatch, getState) => {
        let p = new Array<Promise<RSSItem[]>>()
        if (!getState().app.fetchingItems) {
            for (let source of <RSSSource[]>Object.values(getState().sources)) {
                p.push(RSSSource.fetchItems(source, rssParser, db.idb))
            }
            dispatch(fetchItemsRequest())
            return Promise.allSettled(p).then(results => new Promise<void>((resolve, reject) => { 
                db.idb.count({}, (err, count) => {
                    if (err) {
                        console.log(err)
                        reject(err)
                    }
                    let items = new Array<RSSItem>()
                    results.map((r, i) => {
                        if (r.status === "fulfilled") items.push(...r.value)
                        else {
                            console.log(r.reason)
                            dispatch(fetchItemsFailure(getState().sources[i], r.reason))
                        }
                    })
                    items.sort((a, b) => a.date.getTime() - b.date.getTime())
                    for (let i of items) i.id = count++
                    db.idb.insert(items, (err) => {
                        if (err) {
                            console.log(err)
                            reject(err)
                        } else {
                            dispatch(fetchItemsSuccess(items.reverse()))
                            resolve()
                        }
                    })
                })
            }))
        }
        return new Promise((resolve) => { resolve() })
    }
}

export const markReadDone = (item: RSSItem): ItemActionTypes => ({ 
    type: MARK_READ, 
    item: item 
})

export const markUnreadDone = (item: RSSItem): ItemActionTypes => ({ 
    type: MARK_UNREAD, 
    item: item 
})

export function markRead(item: RSSItem): AppThunk {
    return (dispatch) => {
        db.idb.update({ id: item.id }, { $set: { hasRead: true } })
        dispatch(markReadDone(item))
    }
}

export function markUnread(item: RSSItem): AppThunk {
    return (dispatch) => {
        db.idb.update({ id: item.id }, { $set: { hasRead: false } })
        dispatch(markUnreadDone(item))
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
                        newMap[i.id] = i
                    }
                    return {...newMap, ...state}
                }
                default: return state
            }
        case MARK_READ: return {
            ...state,
            [action.item.id] : {
                ...action.item,
                hasRead: true
            }
        }
        case MARK_UNREAD: return {
            ...state,
            [action.item.id] : {
                ...action.item,
                hasRead: false
            }
        }
        case LOAD_MORE:
        case INIT_FEED: {
            switch (action.status) {
                case ActionStatus.Success: {
                    let nextState = { ...state }
                    for (let i of action.items) {
                        nextState[i.id] = i
                    }
                    return nextState
                }
                default: return state
            }
        }
        default: return state
    }
}