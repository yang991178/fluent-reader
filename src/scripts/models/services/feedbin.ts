import intl from "react-intl-universal"
import * as db from "../../db"
import lf from "lovefield"
import { ServiceHooks } from "../service"
import { ServiceConfigs, SyncService } from "../../../schema-types"
import { createSourceGroup } from "../group"
import { RSSSource } from "../source"
import { domParser } from "../../utils"
import { RSSItem } from "../item"
import { SourceRule } from "../rule"

export interface FeedbinConfigs extends ServiceConfigs {
    type: SyncService.Feedbin
    endpoint: string
    username: string
    password: string
    fetchLimit: number
    lastId?: number
}

async function fetchAPI(configs: FeedbinConfigs, params: string) {
    const headers = new Headers()
    headers.set("Authorization", "Basic " + btoa(configs.username + ":" + configs.password))
    return await fetch(configs.endpoint + params, { headers: headers })
}

async function markItems(configs: FeedbinConfigs, type: string, method: string, refs: number[]) {
    const headers = new Headers()
    headers.set("Authorization", "Basic " + btoa(configs.username + ":" + configs.password))
    headers.set("Content-Type", "application/json; charset=utf-8")
    const promises = new Array<Promise<Response>>()
    while (refs.length > 0) {
        const batch = new Array<number>()
        while (batch.length < 1000 && refs.length > 0) {
            batch.push(refs.pop())
        }
        const bodyObject: any = {}
        bodyObject[`${type}_entries`] = batch
        promises.push(fetch(configs.endpoint + type + "_entries.json", {
            method: method,
            headers: headers,
            body: JSON.stringify(bodyObject)
        }))
    }
    return await Promise.all(promises)
}

const APIError = () => new Error(intl.get("service.failure")) 

export const feedbinServiceHooks: ServiceHooks = {
    authenticate: async (configs: FeedbinConfigs) => {
        try {
            const result = await fetchAPI(configs, "authentication.json")
            return result.status === 200
        } catch {
            return false
        }
    },

    updateSources: () => async (dispatch, getState) => {
        const configs = getState().service as FeedbinConfigs
        const response = await fetchAPI(configs, "subscriptions.json")
        if (response.status !== 200) throw APIError()
        const subscriptions: any[] = await response.json()
        let groupsMap: Map<number, string>
        if (configs.importGroups) {
            const tagsResponse = await fetchAPI(configs, "taggings.json")
            if (tagsResponse.status !== 200) throw APIError()
            const tags: any[] = await tagsResponse.json()
            const tagsSet = new Set<string>()
            groupsMap = new Map()
            for (let tag of tags) {
                const title = tag.name.trim()
                if (!tagsSet.has(title)) {
                    tagsSet.add(title)
                    dispatch(createSourceGroup(title))
                }
                groupsMap.set(tag.feed_id, title)
            }
        }
        const sources = subscriptions.map(s => {
            const source = new RSSSource(s.feed_url, s.title)
            source.serviceRef = s.feed_id
            return source
        })
        return [sources, groupsMap]
    },

    syncItems: () => async (_, getState) => {
        const configs = getState().service as FeedbinConfigs
        const [unreadResponse, starredResponse] = await Promise.all([
            fetchAPI(configs, "unread_entries.json"), 
            fetchAPI(configs, "starred_entries.json")
        ])
        if (unreadResponse.status !== 200 || starredResponse.status !== 200) throw APIError()
        const unread = await unreadResponse.json()
        const starred = await starredResponse.json()
        return [unread, starred]
    },

    fetchItems: () => async (_, getState) => {
        const state = getState()
        const configs = state.service as FeedbinConfigs
        const items = new Array()
        configs.lastId = configs.lastId || 0
        let page = 1
        let min = Number.MAX_SAFE_INTEGER
        let lastFetched: any[]
        do {
            const response = await fetchAPI(configs, "entries.json?mode=extended&per_page=125&page=" + page)
            if (response.status !== 200) throw APIError()
            lastFetched = await response.json()
            items.push(...lastFetched.filter(i => i.id > configs.lastId && i.id < min))
            min = lastFetched.reduce((m, n) => Math.min(m, n.id), min)
            page += 1
        } while (
            min > configs.lastId &&
            lastFetched && lastFetched.length >= 125 &&
            items.length < configs.fetchLimit
        )
        configs.lastId = items.reduce((m, n) => Math.max(m, n.id), configs.lastId)
        if (items.length > 0) {
            const fidMap = new Map<number, RSSSource>()
            for (let source of Object.values(state.sources)) {
                if (source.serviceRef) {
                    fidMap.set(source.serviceRef as number, source)
                }
            }
            const [unreadResponse, starredResponse] = await Promise.all([
                fetchAPI(configs, "unread_entries.json"), 
                fetchAPI(configs, "starred_entries.json")
            ])
            if (unreadResponse.status !== 200 || starredResponse.status !== 200) throw APIError()
            const unread: Set<number> = new Set(await unreadResponse.json())
            const starred: Set<number> = new Set(await starredResponse.json())
            const parsedItems = items.map(i => {
                const source = fidMap.get(i.feed_id)
                const dom = domParser.parseFromString(i.content, "text/html")
                const item = {
                    source: source.sid,
                    title: i.title,
                    link: i.url,
                    date: new Date(i.published),
                    fetchedDate: new Date(i.created_at),
                    content: i.content,
                    snippet: dom.documentElement.textContent.trim(),
                    creator: i.author,
                    hasRead: !unread.has(i.id),
                    starred: starred.has(i.id),
                    hidden: false,
                    notify: false,
                    serviceRef: i.id,
                } as RSSItem
                if (i.images && i.images.original_url) {
                    item.thumb = i.images.original_url
                } else {
                    let baseEl = dom.createElement('base')
                    baseEl.setAttribute('href', item.link.split("/").slice(0, 3).join("/"))
                    dom.head.append(baseEl)
                    let img = dom.querySelector("img")
                    if (img && img.src) item.thumb = img.src
                }
                // Apply rules and sync back to the service
                if (source.rules) SourceRule.applyAll(source.rules, item)
                if (unread.has(i.id) === item.hasRead)
                    markItems(configs, "unread", item.hasRead ? "DELETE" : "POST", [i.id])
                if (starred.has(i.id) !== Boolean(item.starred))
                    markItems(configs, "starred", item.starred ? "POST" : "DELETE", [i.id])
                return item
            })
            return [parsedItems, configs]
        } else {
            return [[], configs]
        }
    },

    markAllRead: (sids, date, before) => async (_, getState) => {
        const state = getState()
        const configs = state.service as FeedbinConfigs
        const predicates: lf.Predicate[] = [
            db.items.source.in(sids),
            db.items.hasRead.eq(false),
            db.items.serviceRef.isNotNull()
        ]
        if (date) {
            predicates.push(before ? db.items.date.lte(date) : db.items.date.gte(date))
        }
        const rows = await db.itemsDB.select(db.items.serviceRef).where(lf.op.and.apply(null, predicates)).exec()
        const refs = rows.map(row => row["serviceRef"]) as number[]
        markItems(configs, "unread", "DELETE", refs)
    },

    markRead: (item: RSSItem) => async (_, getState) => {
        await markItems(getState().service as FeedbinConfigs, "unread", "DELETE", [item.serviceRef as number])
    },

    markUnread: (item: RSSItem) => async (_, getState) => {
        await markItems(getState().service as FeedbinConfigs, "unread", "POST", [item.serviceRef as number])
    },

    star: (item: RSSItem) => async (_, getState) => {
        await markItems(getState().service as FeedbinConfigs, "starred", "POST", [item.serviceRef as number])
    },

    unstar: (item: RSSItem) => async (_, getState) => {
        await markItems(getState().service as FeedbinConfigs, "starred", "DELETE", [item.serviceRef as number])
    },
}