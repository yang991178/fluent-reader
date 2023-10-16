import * as db from "../db"
import lf from "lovefield"
import intl from "react-intl-universal"
import type { MyParserItem } from "../utils"
import {
    domParser,
    htmlDecode,
    ActionStatus,
    AppThunk,
    platformCtrl,
} from "../utils"
import { RSSSource, updateSource, updateUnreadCounts } from "./source"
import { FeedActionTypes, INIT_FEED, LOAD_MORE, dismissItems } from "./feed"
import {
    pushNotification,
    setupAutoFetch,
    SettingsActionTypes,
    FREE_MEMORY,
} from "./app"
import {
    getServiceHooks,
    syncWithService,
    ServiceActionTypes,
    SYNC_LOCAL_ITEMS,
} from "./service"

export class RSSItem {
    _id: number
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
    starred: boolean
    hidden: boolean
    notify: boolean
    serviceRef?: string

    constructor(item: MyParserItem, source: RSSSource) {
        for (let field of ["title", "link", "creator"]) {
            const content = item[field]
            if (content && typeof content !== "string") delete item[field]
        }
        this.source = source.sid
        this.title = item.title || intl.get("article.untitled")
        this.link = item.link || ""
        this.fetchedDate = new Date()
        this.date = new Date(item.isoDate ?? item.pubDate ?? this.fetchedDate)
        this.creator = item.creator
        this.hasRead = false
        this.starred = false
        this.hidden = false
        this.notify = false
    }

    static parseContent(item: RSSItem, parsed: MyParserItem) {
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
        } else if (parsed.image?.$?.url) {
            item.thumb = parsed.image.$.url
        } else if (parsed.image && typeof parsed.image === "string") {
            item.thumb = parsed.image
        } else if (parsed.mediaContent) {
            let images = parsed.mediaContent.filter(
                c => c.$ && c.$.medium === "image" && c.$.url
            )
            if (images.length > 0) item.thumb = images[0].$.url
        }
        if (!item.thumb) {
            let dom = domParser.parseFromString(item.content, "text/html")
            let baseEl = dom.createElement("base")
            baseEl.setAttribute(
                "href",
                item.link.split("/").slice(0, 3).join("/")
            )
            dom.head.append(baseEl)
            let img = dom.querySelector("img")
            if (img && img.src) item.thumb = img.src
        }
        if (
            item.thumb &&
            !item.thumb.startsWith("https://") &&
            !item.thumb.startsWith("http://")
        ) {
            delete item.thumb
        }
    }
}

export type ItemState = {
    [_id: number]: RSSItem
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
    type: typeof MARK_ALL_READ
    sids: number[]
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

export type ItemActionTypes =
    | FetchItemsAction
    | MarkReadAction
    | MarkAllReadAction
    | MarkUnreadAction
    | ToggleStarredAction
    | ToggleHiddenAction

export function fetchItemsRequest(fetchCount = 0): ItemActionTypes {
    return {
        type: FETCH_ITEMS,
        status: ActionStatus.Request,
        fetchCount: fetchCount,
    }
}

export function fetchItemsSuccess(
    items: RSSItem[],
    itemState: ItemState
): ItemActionTypes {
    return {
        type: FETCH_ITEMS,
        status: ActionStatus.Success,
        items: items,
        itemState: itemState,
    }
}

export function fetchItemsFailure(source: RSSSource, err): ItemActionTypes {
    return {
        type: FETCH_ITEMS,
        status: ActionStatus.Failure,
        errSource: source,
        err: err,
    }
}

export function fetchItemsIntermediate(): ItemActionTypes {
    return {
        type: FETCH_ITEMS,
        status: ActionStatus.Intermediate,
    }
}

export async function insertItems(items: RSSItem[]): Promise<RSSItem[]> {
    items.sort((a, b) => a.date.getTime() - b.date.getTime())
    const rows = items.map(item => db.items.createRow(item))
    return (await db.itemsDB
        .insert()
        .into(db.items)
        .values(rows)
        .exec()) as RSSItem[]
}

export function fetchItems(
    background = false,
    sids: number[] = null
): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        let promises = new Array<Promise<RSSItem[]>>()
        const initState = getState()
        if (!initState.app.fetchingItems && !initState.app.syncing) {
            if (
                sids === null ||
                sids.filter(
                    sid => initState.sources[sid].serviceRef !== undefined
                ).length > 0
            )
                await dispatch(syncWithService(background))
            let timenow = new Date().getTime()
            const sourcesState = getState().sources
            let sources =
                sids === null
                    ? Object.values(sourcesState).filter(s => {
                          let last = s.lastFetched ? s.lastFetched.getTime() : 0
                          return (
                              !s.serviceRef &&
                              (last > timenow ||
                                  last + (s.fetchFrequency || 0) * 60000 <=
                                      timenow)
                          )
                      })
                    : sids
                          .map(sid => sourcesState[sid])
                          .filter(s => !s.serviceRef)
            for (let source of sources) {
                let promise = RSSSource.fetchItems(source)
                promise.then(() =>
                    dispatch(
                        updateSource({ ...source, lastFetched: new Date() })
                    )
                )
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
                        dispatch(
                            fetchItemsSuccess(
                                inserted.reverse(),
                                getState().items
                            )
                        )
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
                        } else {
                            dispatch(dismissItems())
                        }
                        dispatch(setupAutoFetch())
                    })
                    .catch(err => {
                        dispatch(fetchItemsSuccess([], getState().items))
                        window.utils.showErrorBox(
                            "A database error has occurred.",
                            String(err)
                        )
                        console.log(err)
                        reject(err)
                    })
            })
        }
    }
}

const markReadDone = (item: RSSItem): ItemActionTypes => ({
    type: MARK_READ,
    item: item,
})

const markUnreadDone = (item: RSSItem): ItemActionTypes => ({
    type: MARK_UNREAD,
    item: item,
})

export function markRead(item: RSSItem): AppThunk {
    return (dispatch, getState) => {
        item = getState().items[item._id]
        if (!item.hasRead) {
            db.itemsDB
                .update(db.items)
                .where(db.items._id.eq(item._id))
                .set(db.items.hasRead, true)
                .exec()
            dispatch(markReadDone(item))
            if (item.serviceRef) {
                dispatch(dispatch(getServiceHooks()).markRead?.(item))
            }
        }
    }
}

export function markAllRead(
    sids: number[] = null,
    date: Date = null,
    before = true
): AppThunk<Promise<void>> {
    return async (dispatch, getState) => {
        let state = getState()
        if (sids === null) {
            let feed = state.feeds[state.page.feedId]
            sids = feed.sids
        }
        const action = dispatch(getServiceHooks()).markAllRead?.(
            sids,
            date,
            before
        )
        if (action) await dispatch(action)
        const predicates: lf.Predicate[] = [
            db.items.source.in(sids),
            db.items.hasRead.eq(false),
        ]
        if (date) {
            predicates.push(
                before ? db.items.date.lte(date) : db.items.date.gte(date)
            )
        }
        const query = lf.op.and.apply(null, predicates)
        await db.itemsDB
            .update(db.items)
            .set(db.items.hasRead, true)
            .where(query)
            .exec()
        if (date) {
            dispatch({
                type: MARK_ALL_READ,
                sids: sids,
                time: date.getTime(),
                before: before,
            })
            dispatch(updateUnreadCounts())
        } else {
            dispatch({
                type: MARK_ALL_READ,
                sids: sids,
            })
        }
    }
}

export function markUnread(item: RSSItem): AppThunk {
    return (dispatch, getState) => {
        item = getState().items[item._id]
        if (item.hasRead) {
            db.itemsDB
                .update(db.items)
                .where(db.items._id.eq(item._id))
                .set(db.items.hasRead, false)
                .exec()
            dispatch(markUnreadDone(item))
            if (item.serviceRef) {
                dispatch(dispatch(getServiceHooks()).markUnread?.(item))
            }
        }
    }
}

const toggleStarredDone = (item: RSSItem): ItemActionTypes => ({
    type: TOGGLE_STARRED,
    item: item,
})

export function toggleStarred(item: RSSItem): AppThunk {
    return dispatch => {
        db.itemsDB
            .update(db.items)
            .where(db.items._id.eq(item._id))
            .set(db.items.starred, !item.starred)
            .exec()
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
    item: item,
})

export function toggleHidden(item: RSSItem): AppThunk {
    return dispatch => {
        db.itemsDB
            .update(db.items)
            .where(db.items._id.eq(item._id))
            .set(db.items.hidden, !item.hidden)
            .exec()
        dispatch(toggleHiddenDone(item))
    }
}

export function itemShortcuts(item: RSSItem, e: KeyboardEvent): AppThunk {
    return dispatch => {
        if (e.metaKey) return
        switch (e.key) {
            case "m":
            case "M":
                if (item.hasRead) dispatch(markUnread(item))
                else dispatch(markRead(item))
                break
            case "b":
            case "B":
                if (!item.hasRead) dispatch(markRead(item))
                window.utils.openExternal(item.link, platformCtrl(e))
                break
            case "s":
            case "S":
                dispatch(toggleStarred(item))
                break
            case "h":
            case "H":
                if (!item.hasRead && !item.hidden) dispatch(markRead(item))
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
            nextItem.starred = !item.starred
            break
        }
        case TOGGLE_HIDDEN: {
            nextItem.hidden = !item.hidden
            break
        }
    }
    return nextItem
}

export function itemReducer(
    state: ItemState = {},
    action:
        | ItemActionTypes
        | FeedActionTypes
        | ServiceActionTypes
        | SettingsActionTypes
): ItemState {
    switch (action.type) {
        case FETCH_ITEMS:
            switch (action.status) {
                case ActionStatus.Success: {
                    let newMap = {}
                    for (let i of action.items) {
                        newMap[i._id] = i
                    }
                    return { ...newMap, ...state }
                }
                default:
                    return state
            }
        case MARK_UNREAD:
        case MARK_READ:
        case TOGGLE_STARRED:
        case TOGGLE_HIDDEN: {
            return {
                ...state,
                [action.item._id]: applyItemReduction(
                    state[action.item._id],
                    action.type
                ),
            }
        }
        case MARK_ALL_READ: {
            let nextState = { ...state }
            let sids = new Set(action.sids)
            for (let item of Object.values(state)) {
                if (sids.has(item.source) && !item.hasRead) {
                    if (
                        !action.time ||
                        (action.before
                            ? item.date.getTime() <= action.time
                            : item.date.getTime() >= action.time)
                    ) {
                        nextState[item._id] = {
                            ...item,
                            hasRead: true,
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
                default:
                    return state
            }
        }
        case SYNC_LOCAL_ITEMS: {
            let nextState = { ...state }
            for (let item of Object.values(state)) {
                if (item.hasOwnProperty("serviceRef")) {
                    const nextItem = { ...item }
                    nextItem.hasRead = !action.unreadIds.has(item.serviceRef)
                    nextItem.starred = action.starredIds.has(item.serviceRef)
                    nextState[item._id] = nextItem
                }
            }
            return nextState
        }
        case FREE_MEMORY: {
            const nextState: ItemState = {}
            for (let item of Object.values(state)) {
                if (action.iids.has(item._id)) nextState[item._id] = item
            }
            return nextState
        }
        default:
            return state
    }
}
