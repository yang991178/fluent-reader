import * as db from "../db"
import intl from "react-intl-universal"
import { domParser, htmlDecode, ActionStatus, AppThunk, platformCtrl } from "../utils"
import { RSSSource, updateSource } from "./source"
import { FeedActionTypes, INIT_FEED, LOAD_MORE, FilterType, initFeeds } from "./feed"
import Parser from "@yang991178/rss-parser"
import { pushNotification, setupAutoFetch } from "./app"
import { getServiceHooks, syncWithService, ServiceActionTypes, SYNC_LOCAL_ITEMS } from "./service"

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
    starred?: boolean
    hidden?: boolean
    notify?: boolean
    serviceRef?: string | number

    constructor (item: Parser.Item, source: RSSSource) {
        for (let field of ["title", "link", "creator"]) {
            const content = item[field]
            if (content && typeof content !== "string") delete item[field]
        }
        this.source = source.sid
        this.title = item.title || intl.get("article.untitled")
        this.link = item.link || ""
        this.fetchedDate = new Date()
        this.date = item.isoDate ? new Date(item.isoDate) : this.fetchedDate
        this.creator = item.creator
        this.hasRead = false
    }

    static parseContent(item: RSSItem, parsed: Parser.Item) {
        for (let field of ["thumb", "content", "fullContent"]) {
            const content = parsed[field]
            if (content && typeof content !== "string") delete parsed[field]
        }
        if (parsed.fullContent) {
            item.content = parsed.fullContent
            item.snippet = htmlDecode(parsed.fullContent)
        } else {
            item.content = parsed.content || ""
            item.snippet = htmlDecode(parsed.contentSnippet || "")
        }
        if (parsed.thumb) { 
            item.thumb = parsed.thumb
        } else if (parsed.image && parsed.image.$ && parsed.image.$.url) {
            item.thumb = parsed.image.$.url
        } else if (parsed.image && typeof parsed.image === "string") {
            item.thumb = parsed.image
        } else if (parsed.mediaContent) {
            let images = parsed.mediaContent.filter(c => c.$ && c.$.medium === "image" && c.$.url)
            if (images.length > 0) item.thumb = images[0].$.url
        }
        if (!item.thumb) {
            let dom = domParser.parseFromString(item.content, "text/html")
            let baseEl = dom.createElement('base')
            baseEl.setAttribute('href', item.link.split("/").slice(0, 3).join("/"))
            dom.head.append(baseEl)
            let img = dom.querySelector("img")
            if (img && img.src) item.thumb = img.src
        }
        if (item.thumb && !item.thumb.startsWith("https://") && !item.thumb.startsWith("http://")) {
            delete item.thumb
        }
    }
}

export type ItemState = {
    [_id: string]: RSSItem
}

export const FETCH_ITEMS = "FETCH_ITEMS"
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
    counts?: number[]
    time?: number
    before?: boolean
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

export function fetchItems(background = false, sids: number[] = null): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        let promises = new Array<Promise<RSSItem[]>>()
        const initState = getState()
        if (!initState.app.fetchingItems && !initState.app.syncing) {
            if (sids === null || sids.filter(sid => initState.sources[sid].serviceRef !== undefined).length > 0)
                await dispatch(syncWithService(background))
            let timenow = new Date().getTime()
            const sourcesState = getState().sources
            let sources = (sids === null)
                ? Object.values(sourcesState).filter(s => {
                    let last = s.lastFetched ? s.lastFetched.getTime() : 0
                    return !s.serviceRef && ((last > timenow) || (last + (s.fetchFrequency || 0) * 60000 <= timenow))
                })
                : sids.map(sid => sourcesState[sid]).filter(s => !s.serviceRef)
            for (let source of sources) {
                let promise = RSSSource.fetchItems(source)
                promise.then(() => dispatch(updateSource({ ...source, lastFetched: new Date() })))
                promise.finally(() => dispatch(fetchItemsIntermediate()))
                promises.push(promise)
            }
            dispatch(fetchItemsRequest(promises.length))
            const results = await Promise.allSettled(promises)
            return await new Promise<void>((resolve, reject) => {
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
                    if (background) {
                        for (let item of inserted) {
                            if (item.notify) {
                                dispatch(pushNotification(item))
                            }
                        }
                        if (inserted.length > 0) {
                            window.utils.requestAttention()
                        }
                    }
                    dispatch(setupAutoFetch())
                })
                .catch(err => {
                    dispatch(fetchItemsSuccess([], getState().items))
                    window.utils.showErrorBox("A database error has occurred.", String(err))
                    console.log(err)
                    reject(err)
                })
            })
        }
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
        if (!item.hasRead) {
            db.idb.update({ _id: item._id }, { $set: { hasRead: true } })
            dispatch(markReadDone(item))
            if (item.serviceRef) {
                dispatch(dispatch(getServiceHooks()).markRead?.(item))
            }
        }
    }
}

export function markAllRead(sids: number[] = null, date: Date = null, before = true): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        let state = getState()
        if (sids === null) {
            let feed = state.feeds[state.page.feedId]
            sids = feed.sids
        }
        const action = dispatch(getServiceHooks()).markAllRead?.(sids, date, before)
        if (action) await dispatch(action)
        let query = { 
            source: { $in: sids },
            hasRead: false,
         } as any
        if (date) {
            query.date = before ? { $lte: date } : { $gte: date }
        }
        const callback = (items: RSSItem[] = null) => {
            if (items) {
                const counts = new Map<number, number>()
                for (let sid of sids) {
                    counts.set(sid, 0)
                }
                for (let item of items) {
                    counts.set(item.source, counts.get(item.source) + 1)
                }
                dispatch({
                    type: MARK_ALL_READ,
                    sids: sids,
                    counts: sids.map(i => counts.get(i)),
                    time: date.getTime(),
                    before: before
                })
            } else {
                dispatch({
                    type: MARK_ALL_READ,
                    sids: sids
                })
            }
            if (!(state.page.filter.type & FilterType.ShowRead)) {
                dispatch(initFeeds(true))
            }
        }
        db.idb.update(query, { $set: { hasRead: true } }, { multi: true, returnUpdatedDocs: Boolean(date) }, 
            (err, _, affectedDocuments) => {
                if (err) console.log(err)
                if (date) callback(affectedDocuments as unknown as RSSItem[])
        })
        if (!date) callback()
    }
}

export function markUnread(item: RSSItem): AppThunk {
    return (dispatch) => {
        if (item.hasRead) {
            db.idb.update({ _id: item._id }, { $set: { hasRead: false } })
            dispatch(markUnreadDone(item))
            if (item.serviceRef) {
                dispatch(dispatch(getServiceHooks()).markUnread?.(item))
            }
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
        if (item.serviceRef) {
            const hooks = dispatch(getServiceHooks())
            if (item.starred) dispatch(hooks.unstar?.(item))
            else dispatch(hooks.star?.(item))
        }
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

export function itemShortcuts(item: RSSItem, e: KeyboardEvent): AppThunk {
    return (dispatch) => {
        switch (e.key) {
            case "m": case "M":
                if (item.hasRead) dispatch(markUnread(item))
                else dispatch(markRead(item))
                break
            case "b": case "B":
                if (!item.hasRead) dispatch(markRead(item))
                window.utils.openExternal(item.link, platformCtrl(e))
                break
            case "s": case "S":
                dispatch(toggleStarred(item))
                break
            case "h": case "H":
                if (!item.hasRead) dispatch(markRead(item))
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
    action: ItemActionTypes | FeedActionTypes | ServiceActionTypes
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
                [action.item._id]: applyItemReduction(state[action.item._id], action.type)
            }
        }
        case MARK_ALL_READ: {
            let nextState = { ...state }
            let sids = new Set(action.sids)
            for (let [id, item] of Object.entries(state)) {
                if (sids.has(item.source) && !item.hasRead) {
                    if (!action.time || (action.before 
                        ? item.date.getTime() <= action.time 
                        : item.date.getTime() >= action.time)
                    ) {
                        nextState[id] = {
                            ...item,
                            hasRead: true
                        }
                    }
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
        case SYNC_LOCAL_ITEMS: {
            const unreadSet = new Set(action.unreadIds)
            const starredSet = new Set(action.starredIds)
            let nextState = { ...state }
            for (let [id, item] of Object.entries(state)) {
                if (item.hasOwnProperty("serviceRef")) {
                    const nextItem = { ...item }
                    nextItem.hasRead = !unreadSet.has(nextItem.serviceRef as number)
                    if (starredSet.has(item.serviceRef as number)) {
                        nextItem.starred = true
                    } else {
                        delete nextItem.starred
                    }
                    nextState[id] = nextItem
                }
            }
            return nextState
        }
        default: return state
    }
}