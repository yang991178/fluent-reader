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

export interface NextcloudConfigs extends ServiceConfigs {
    type: SyncService.Nextcloud
    endpoint: string
    username: string
    password: string
    fetchLimit: number
    lastModified?: number
    lastId?: number
}

async function fetchAPI(configs: NextcloudConfigs, params: string) {
    const headers = new Headers()
    headers.set(
        "Authorization",
        "Basic " + btoa(configs.username + ":" + configs.password)
    )
    return await fetch(configs.endpoint + params, { headers: headers })
}

async function markItems(
    configs: NextcloudConfigs,
    type: string,
    method: string,
    refs: number[]
) {
    const headers = new Headers()
    headers.set(
        "Authorization",
        "Basic " + btoa(configs.username + ":" + configs.password)
    )
    headers.set("Content-Type", "application/json; charset=utf-8")
    const promises = new Array<Promise<Response>>()
    while (refs.length > 0) {
        const batch = new Array<number>()
        while (batch.length < 1000 && refs.length > 0) {
            batch.push(refs.pop())
        }
        const bodyObject: any = {}
        bodyObject["itemIds"] = batch
        promises.push(
            fetch(configs.endpoint + "/items/" + type + "/multiple", {
                method: method,
                headers: headers,
                body: JSON.stringify(bodyObject),
            })
        )
    }
    return await Promise.all(promises)
}

const APIError = () => new Error(intl.get("service.failure"))

export const nextcloudServiceHooks: ServiceHooks = {
    authenticate: async (configs: NextcloudConfigs) => {
        try {
            const result = await fetchAPI(configs, "/version")
            return result.status === 200
        } catch {
            return false
        }
    },

    updateSources: () => async (dispatch, getState) => {
        const configs = getState().service as NextcloudConfigs
        const response = await fetchAPI(configs, "/feeds")
        if (response.status !== 200) throw APIError()
        const feeds = await response.json()
        let groupsMap: Map<string, string>
        let groupsByTagId: Map<string, string> = new Map()
        if (configs.importGroups) {
            const foldersResponse = await fetchAPI(configs, "/folders")
            if (foldersResponse.status !== 200) throw APIError()
            const folders = await foldersResponse.json()
            const foldersSet = new Set<string>()
            groupsMap = new Map()
            for (let folder of folders.folders) {
                const title = folder.name.trim()
                if (!foldersSet.has(title)) {
                    foldersSet.add(title)
                    dispatch(createSourceGroup(title))
                }
                groupsByTagId.set(String(folder.id), title)
            }
        }
        const sources = feeds.feeds.map(s => {
            const source = new RSSSource(s.url, s.title)
            source.iconurl = s.faviconLink
            source.serviceRef = String(s.id)
            if (s.folderId && groupsByTagId.has(String(s.folderId))) {
                groupsMap.set(
                    String(s.id),
                    groupsByTagId.get(String(s.folderId))
                )
            }
            return source
        })
        return [sources, groupsMap]
    },

    syncItems: () => async (_, getState) => {
        const configs = getState().service as NextcloudConfigs
        const [unreadResponse, starredResponse] = await Promise.all([
            fetchAPI(configs, "/items?getRead=false&type=3&batchSize=-1"),
            fetchAPI(configs, "/items?getRead=true&type=2&batchSize=-1"),
        ])
        if (unreadResponse.status !== 200 || starredResponse.status !== 200)
            throw APIError()
        const unread = await unreadResponse.json()
        const starred = await starredResponse.json()
        return [
            new Set(unread.items.map(i => String(i.id))),
            new Set(starred.items.map(i => String(i.id))),
        ]
    },

    fetchItems: () => async (_, getState) => {
        const state = getState()
        const configs = state.service as NextcloudConfigs
        let items = new Array()
        configs.lastModified = configs.lastModified || 0
        configs.lastId = configs.lastId || 0
        let lastFetched: any

        if (!configs.lastModified || configs.lastModified == 0) {
            //first sync
            let min = Number.MAX_SAFE_INTEGER
            do {
                const response = await fetchAPI(
                    configs,
                    "/items?getRead=true&type=3&batchSize=125&offset=" + min
                )
                if (response.status !== 200) throw APIError()
                lastFetched = await response.json()
                items = [...items, ...lastFetched.items]
                min = lastFetched.items.reduce((m, n) => Math.min(m, n.id), min)
            } while (
                lastFetched.items &&
                lastFetched.items.length >= 125 &&
                items.length < configs.fetchLimit
            )
        } else {
            //incremental sync
            const response = await fetchAPI(
                configs,
                "/items/updated?lastModified=" +
                    configs.lastModified +
                    "&type=3"
            )
            if (response.status !== 200) throw APIError()
            lastFetched = (await response.json()).items
            items.push(...lastFetched.filter(i => i.id > configs.lastId))
        }
        configs.lastModified = items.reduce(
            (m, n) => Math.max(m, n.lastModified),
            configs.lastModified
        )
        configs.lastId = items.reduce(
            (m, n) => Math.max(m, n.id),
            configs.lastId
        )
        configs.lastModified++ //+1 to avoid fetching articles with same lastModified next time
        if (items.length > 0) {
            const fidMap = new Map<string, RSSSource>()
            for (let source of Object.values(state.sources)) {
                if (source.serviceRef) {
                    fidMap.set(source.serviceRef, source)
                }
            }

            const parsedItems = new Array<RSSItem>()
            items.forEach(i => {
                if (i.body === null || i.url === null) return
                const unreadItem = i.unread
                const starredItem = i.starred
                const source = fidMap.get(String(i.feedId))
                const dom = domParser.parseFromString(i.body, "text/html")
                const item = {
                    source: source.sid,
                    title: i.title,
                    link: i.url,
                    date: new Date(i.pubDate * 1000),
                    fetchedDate: new Date(),
                    content: i.body,
                    snippet: dom.documentElement.textContent.trim(),
                    creator: i.author,
                    hasRead: !i.unread,
                    starred: i.starred,
                    hidden: false,
                    notify: false,
                    serviceRef: String(i.id),
                } as RSSItem
                if (i.enclosureLink) {
                    item.thumb = i.enclosureLink
                } else {
                    let baseEl = dom.createElement("base")
                    baseEl.setAttribute(
                        "href",
                        item.link.split("/").slice(0, 3).join("/")
                    )
                    dom.head.append(baseEl)
                    let img = dom.querySelector("img")
                    if (img && img.src) item.thumb = img.src
                }
                // Apply rules and sync back to the service
                if (source.rules) SourceRule.applyAll(source.rules, item)
                if (unreadItem && item.hasRead)
                    markItems(
                        configs,
                        item.hasRead ? "read" : "unread",
                        "POST",
                        [i.id]
                    )
                if (starredItem !== Boolean(item.starred))
                    markItems(
                        configs,
                        item.starred ? "star" : "unstar",
                        "POST",
                        [i.id]
                    )

                parsedItems.push(item)
            })
            return [parsedItems, configs]
        } else {
            return [[], configs]
        }
    },

    markAllRead: (sids, date, before) => async (_, getState) => {
        const state = getState()
        const configs = state.service as NextcloudConfigs
        const predicates: lf.Predicate[] = [
            db.items.source.in(sids),
            db.items.hasRead.eq(false),
            db.items.serviceRef.isNotNull(),
        ]
        if (date) {
            predicates.push(
                before ? db.items.date.lte(date) : db.items.date.gte(date)
            )
        }
        const query = lf.op.and.apply(null, predicates)
        const rows = await db.itemsDB
            .select(db.items.serviceRef)
            .from(db.items)
            .where(query)
            .exec()
        const refs = rows.map(row => parseInt(row["serviceRef"]))
        markItems(configs, "unread", "POST", refs)
    },

    markRead: (item: RSSItem) => async (_, getState) => {
        await markItems(
            getState().service as NextcloudConfigs,
            "read",
            "POST",
            [parseInt(item.serviceRef)]
        )
    },

    markUnread: (item: RSSItem) => async (_, getState) => {
        await markItems(
            getState().service as NextcloudConfigs,
            "unread",
            "POST",
            [parseInt(item.serviceRef)]
        )
    },

    star: (item: RSSItem) => async (_, getState) => {
        await markItems(
            getState().service as NextcloudConfigs,
            "star",
            "POST",
            [parseInt(item.serviceRef)]
        )
    },

    unstar: (item: RSSItem) => async (_, getState) => {
        await markItems(
            getState().service as NextcloudConfigs,
            "unstar",
            "POST",
            [parseInt(item.serviceRef)]
        )
    },
}
