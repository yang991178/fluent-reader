import intl from "react-intl-universal"
import * as db from "../../db"
import lf from "lovefield"
import { ServiceHooks } from "../service"
import { ServiceConfigs, SyncService } from "../../../schema-types"
import { createSourceGroup } from "../group"
import { RSSSource } from "../source"
import { domParser, htmlDecode } from "../../utils"
import { RSSItem } from "../item"
import { SourceRule } from "../rule"

// miniflux service configs
export interface MinifluxConfigs extends ServiceConfigs {
    type: SyncService.Miniflux
    endpoint: string
    apiKeyAuth: boolean
    authKey: string
    fetchLimit: number
    lastId?: number
}

// partial api schema
interface Feed {
    id: number
    feed_url: string
    title: string
    category: { title: string }
}

interface Category {
    title: string
}

interface Entry {
    id: number
    status: "unread" | "read" | "removed"
    title: string
    url: string
    published_at: string
    created_at: string
    content: string
    author: string
    starred: boolean
    feed: Feed
}

interface Entries {
    total: number
    entries: Entry[]
}

const APIError = () => new Error(intl.get("service.failure"))

// base endpoint, authorization with dedicated token or http basic user/pass pair
async function fetchAPI(
    configs: MinifluxConfigs,
    endpoint: string = "",
    method: string = "GET",
    body: string = null
): Promise<Response> {
    try {
        const headers = new Headers()
        headers.append("content-type", "application/x-www-form-urlencoded")

        configs.apiKeyAuth
            ? headers.append("X-Auth-Token", configs.authKey)
            : headers.append("Authorization", `Basic ${configs.authKey}`)

        let baseUrl = configs.endpoint
        if (!baseUrl.endsWith("/")) baseUrl = baseUrl + "/"
        if (!baseUrl.endsWith("/v1/")) baseUrl = baseUrl + "v1/"
        const response = await fetch(baseUrl + endpoint, {
            method: method,
            body: body,
            headers: headers,
        })

        return response
    } catch (error) {
        console.log(error)
        throw APIError()
    }
}

export const minifluxServiceHooks: ServiceHooks = {
    // poll service info endpoint to verify auth
    authenticate: async (configs: MinifluxConfigs) => {
        const response = await fetchAPI(configs, "me")

        if (await response.json().then(json => json.error_message)) return false

        return true
    },

    // collect sources from service, along with associated groups/categories
    updateSources: () => async (dispatch, getState) => {
        const configs = getState().service as MinifluxConfigs

        // fetch and create groups in redux
        if (configs.importGroups) {
            const groups: Category[] = await fetchAPI(
                configs,
                "categories"
            ).then(response => response.json())
            groups.forEach(group => dispatch(createSourceGroup(group.title)))
        }

        // fetch all feeds
        const feedResponse = await fetchAPI(configs, "feeds")
        const feeds = await feedResponse.json()

        if (feeds === undefined) throw APIError()

        // go through feeds, create typed source while also mapping by group
        let sources: RSSSource[] = new Array<RSSSource>()
        let groupsMap: Map<string, string> = new Map<string, string>()
        for (let feed of feeds) {
            let source = new RSSSource(feed.feed_url, feed.title)
            // associate service christened id to match in other request
            source.serviceRef = feed.id.toString()
            sources.push(source)
            groupsMap.set(feed.id.toString(), feed.category.title)
        }

        return [sources, configs.importGroups ? groupsMap : undefined]
    },

    // fetch entries from after the last fetched id (if exists)
    // limit by quantity and maximum safe integer (id)
    // NOTE: miniflux endpoint /entries default order with "published at", and does not offer "created_at"
    //          but does offer id sort, directly correlated with "created". some feeds give strange published_at.

    fetchItems: () => async (_, getState) => {
        const state = getState()
        const configs = state.service as MinifluxConfigs
        const items: Entry[] = new Array()
        let entriesResponse: Entries

        // parameters
        configs.lastId = configs.lastId ?? 0
        // intermediate
        const quantity = 125
        let continueId: number

        do {
            try {
                if (continueId) {
                    entriesResponse = await fetchAPI(
                        configs,
                        `entries?order=id&direction=desc&after_entry_id=${configs.lastId}&before_entry_id=${continueId}&limit=${quantity}`
                    ).then(response => response.json())
                } else {
                    entriesResponse = await fetchAPI(
                        configs,
                        `entries?order=id&direction=desc&after_entry_id=${configs.lastId}&limit=${quantity}`
                    ).then(response => response.json())
                }

                items.push(...entriesResponse.entries)
                continueId = items[items.length - 1].id
            } catch {
                break
            }
        } while (
            entriesResponse.entries &&
            entriesResponse.total >= quantity &&
            items.length < configs.fetchLimit
        )

        // break/return nothing if no new items acquired
        if (items.length === 0) return [[], configs]
        configs.lastId = items[0].id

        // get sources that possess ref/id given by service, associate new items
        const sourceMap = new Map<string, RSSSource>()
        for (let source of Object.values(state.sources)) {
            if (source.serviceRef) {
                sourceMap.set(source.serviceRef, source)
            }
        }

        // map item objects to rssitem type while appling rules (if exist)
        const parsedItems = items.map(item => {
            const source = sourceMap.get(item.feed.id.toString())

            let parsedItem = {
                source: source.sid,
                title: item.title,
                link: item.url,
                date: new Date(item.published_at ?? item.created_at),
                fetchedDate: new Date(),
                content: item.content,
                snippet: htmlDecode(item.content).trim(),
                creator: item.author,
                hasRead: Boolean(item.status === "read"),
                starred: Boolean(item.starred),
                hidden: false,
                notify: false,
                serviceRef: String(item.id),
            } as RSSItem

            // Try to get the thumbnail of the item
            let dom = domParser.parseFromString(item.content, "text/html")
            let baseEl = dom.createElement("base")
            baseEl.setAttribute(
                "href",
                parsedItem.link.split("/").slice(0, 3).join("/")
            )
            dom.head.append(baseEl)
            let img = dom.querySelector("img")
            if (img && img.src) parsedItem.thumb = img.src

            if (source.rules) {
                SourceRule.applyAll(source.rules, parsedItem)
                if ((item.status === "read") !== parsedItem.hasRead)
                    minifluxServiceHooks.markRead(parsedItem)
                if (item.starred !== parsedItem.starred)
                    minifluxServiceHooks.markUnread(parsedItem)
            }

            return parsedItem
        })

        return [parsedItems, configs]
    },

    // get remote read and star state of articles, for local sync
    syncItems: () => async (_, getState) => {
        const configs = getState().service as MinifluxConfigs

        const unreadPromise: Promise<Entries> = fetchAPI(
            configs,
            "entries?status=unread"
        ).then(response => response.json())
        const starredPromise: Promise<Entries> = fetchAPI(
            configs,
            "entries?starred=true"
        ).then(response => response.json())
        const [unread, starred] = await Promise.all([
            unreadPromise,
            starredPromise,
        ])

        return [
            new Set(unread.entries.map((entry: Entry) => String(entry.id))),
            new Set(starred.entries.map((entry: Entry) => String(entry.id))),
        ]
    },

    markRead: (item: RSSItem) => async (_, getState) => {
        if (!item.serviceRef) return

        const body = `{
            "entry_ids": [${item.serviceRef}],
            "status": "read"
        }`

        const response = await fetchAPI(
            getState().service as MinifluxConfigs,
            "entries",
            "PUT",
            body
        )

        if (response.status !== 204) throw APIError()
    },

    markUnread: (item: RSSItem) => async (_, getState) => {
        if (!item.serviceRef) return

        const body = `{
            "entry_ids": [${item.serviceRef}],
            "status": "unread"
        }`
        await fetchAPI(
            getState().service as MinifluxConfigs,
            "entries",
            "PUT",
            body
        )
    },

    // mark entries for source ids as read, relative to date, determined by "before" bool

    // context menu component:
    // item - null, item date, either
    // group - group sources, null, true
    // nav - null, daysago, true

    // if null, state consulted for context sids

    markAllRead: (sids, date, before) => async (_, getState) => {
        const state = getState()
        const configs = state.service as MinifluxConfigs

        if (date) {
            const predicates: lf.Predicate[] = [
                db.items.source.in(sids),
                db.items.hasRead.eq(false),
                db.items.serviceRef.isNotNull(),
                before ? db.items.date.lte(date) : db.items.date.gte(date),
            ]
            const query = lf.op.and.apply(null, predicates)
            const rows = await db.itemsDB
                .select(db.items.serviceRef)
                .from(db.items)
                .where(query)
                .exec()
            const refs = rows.map(row => row["serviceRef"])
            const body = `{
                "entry_ids": [${refs}],
                "status": "read"
            }`
            await fetchAPI(configs, "entries", "PUT", body)
        } else {
            const sources = state.sources
            await Promise.all(
                sids.map(sid =>
                    fetchAPI(
                        configs,
                        `feeds/${sources[sid]?.serviceRef}/mark-all-as-read`,
                        "PUT"
                    )
                )
            )
        }
    },

    star: (item: RSSItem) => async (_, getState) => {
        if (!item.serviceRef) return

        await fetchAPI(
            getState().service as MinifluxConfigs,
            `entries/${item.serviceRef}/bookmark`,
            "PUT"
        )
    },

    unstar: (item: RSSItem) => async (_, getState) => {
        if (!item.serviceRef) return

        await fetchAPI(
            getState().service as MinifluxConfigs,
            `entries/${item.serviceRef}/bookmark`,
            "PUT"
        )
    },
}
