import intl from "react-intl-universal"
import * as db from "../../db"
import lf from "lovefield"
import { ServiceHooks } from "../service"
import { ServiceConfigs, SyncService } from "../../../schema-types"
import { createSourceGroup } from "../group"
import { RSSSource } from "../source"
import { RSSItem } from "../item"
import { domParser, htmlDecode } from "../../utils"
import { SourceRule } from "../rule"

const ALL_TAG = "user/-/state/com.google/reading-list"
const READ_TAG = "user/-/state/com.google/read"
const STAR_TAG = "user/-/state/com.google/starred"

export interface GReaderConfigs extends ServiceConfigs {
    type: SyncService.GReader | SyncService.Inoreader
    endpoint: string
    username: string
    password: string
    fetchLimit: number
    lastFetched?: number
    lastId?: string
    auth?: string
    useInt64: boolean // The Old Reader uses ids longer than 64 bits
    inoreaderId?: string
    inoreaderKey?: string
    removeInoreaderAd?: boolean
}

async function fetchAPI(
    configs: GReaderConfigs,
    params: string,
    method = "GET",
    body: BodyInit = null
) {
    const headers = new Headers()
    if (configs.auth !== null) headers.set("Authorization", configs.auth)
    if (configs.type == SyncService.Inoreader) {
        if (configs.inoreaderId) {
            headers.set("AppId", configs.inoreaderId)
            headers.set("AppKey", configs.inoreaderKey)
        } else {
            headers.set("AppId", "999999298")
            headers.set("AppKey", "KPbKYXTfgrKbwmroOeYC7mcW21ZRwF5Y")
        }
    }
    return await fetch(configs.endpoint + params, {
        method: method,
        headers: headers,
        body: body,
    })
}

async function fetchAll(
    configs: GReaderConfigs,
    params: string
): Promise<Set<string>> {
    let results = new Array()
    let fetched: any[]
    let continuation: string
    do {
        let p = params
        if (continuation) p += `&c=${continuation}`
        const response = await fetchAPI(configs, p)
        const parsed = await response.json()
        fetched = parsed.itemRefs
        if (fetched) {
            for (let i of fetched) {
                results.push(i.id)
            }
        }
        continuation = parsed.continuation
    } while (continuation && fetched && fetched.length >= 1000)
    return new Set(results)
}

async function editTag(
    configs: GReaderConfigs,
    ref: string,
    tag: string,
    add = true
) {
    const body = new URLSearchParams(`i=${ref}&${add ? "a" : "r"}=${tag}`)
    return await fetchAPI(configs, "/reader/api/0/edit-tag", "POST", body)
}

function compactId(longId: string, useInt64: boolean) {
    let parts = longId.split("/")
    const last = parts[parts.length - 1]
    if (!useInt64) return last
    let i = BigInt("0x" + last)
    return BigInt.asIntN(64, i).toString()
}

const APIError = () => new Error(intl.get("service.failure"))

export const gReaderServiceHooks: ServiceHooks = {
    authenticate: async (configs: GReaderConfigs) => {
        if (configs.auth !== null) {
            try {
                const result = await fetchAPI(
                    configs,
                    "/reader/api/0/user-info"
                )
                return result.status === 200
            } catch {
                return false
            }
        }
    },

    reauthenticate: async (
        configs: GReaderConfigs
    ): Promise<GReaderConfigs> => {
        const body = new URLSearchParams()
        body.append("Email", configs.username)
        body.append("Passwd", configs.password)
        const result = await fetchAPI(
            configs,
            "/accounts/ClientLogin",
            "POST",
            body
        )
        if (result.status === 200) {
            const text = await result.text()
            const matches = text.match(/Auth=(\S+)/)
            if (matches.length > 1)
                configs.auth = "GoogleLogin auth=" + matches[1]
            return configs
        } else {
            throw APIError()
        }
    },

    updateSources: () => async (dispatch, getState) => {
        const configs = getState().service as GReaderConfigs
        const response = await fetchAPI(
            configs,
            "/reader/api/0/subscription/list?output=json"
        )
        if (response.status !== 200) throw APIError()
        const subscriptions: any[] = (await response.json()).subscriptions
        let groupsMap: Map<string, string>
        if (configs.importGroups) {
            groupsMap = new Map()
            const groupSet = new Set<string>()
            for (let s of subscriptions) {
                if (s.categories && s.categories.length > 0) {
                    const group: string = s.categories[0].label
                    if (!groupSet.has(group)) {
                        groupSet.add(group)
                        dispatch(createSourceGroup(group))
                    }
                    groupsMap.set(s.id, group)
                }
            }
        }
        const sources = new Array<RSSSource>()
        subscriptions.forEach(s => {
            const source = new RSSSource(s.url || s.htmlUrl, s.title)
            source.serviceRef = s.id
            // Omit duplicate sources in The Old Reader
            if (
                configs.useInt64 ||
                s.url != "http://blog.theoldreader.com/rss"
            ) {
                sources.push(source)
            }
        })
        return [sources, groupsMap]
    },

    syncItems: () => async (_, getState) => {
        const configs = getState().service as GReaderConfigs
        if (configs.type == SyncService.Inoreader) {
            return await Promise.all([
                fetchAll(
                    configs,
                    `/reader/api/0/stream/items/ids?output=json&xt=${READ_TAG}&n=1000`
                ),
                fetchAll(
                    configs,
                    `/reader/api/0/stream/items/ids?output=json&it=${STAR_TAG}&n=1000`
                ),
            ])
        } else {
            return await Promise.all([
                fetchAll(
                    configs,
                    `/reader/api/0/stream/items/ids?output=json&s=${ALL_TAG}&xt=${READ_TAG}&n=1000`
                ),
                fetchAll(
                    configs,
                    `/reader/api/0/stream/items/ids?output=json&s=${STAR_TAG}&n=1000`
                ),
            ])
        }
    },

    fetchItems: () => async (_, getState) => {
        const state = getState()
        const configs = state.service as GReaderConfigs
        const items = new Array()
        let fetchedItems: any[]
        let continuation: string
        do {
            try {
                const limit = Math.min(configs.fetchLimit - items.length, 1000)
                let params = `/reader/api/0/stream/contents?output=json&n=${limit}`
                if (configs.lastFetched) params += `&ot=${configs.lastFetched}`
                if (continuation) params += `&c=${continuation}`
                const response = await fetchAPI(configs, params)
                let fetched = await response.json()
                fetchedItems = fetched.items
                for (let i of fetchedItems) {
                    i.id = compactId(i.id, configs.useInt64)
                    if (
                        i.id === configs.lastId ||
                        items.length >= configs.fetchLimit
                    ) {
                        break
                    } else {
                        items.push(i)
                    }
                }
                continuation = fetched.continuation
            } catch {
                break
            }
        } while (continuation && items.length < configs.fetchLimit)
        if (items.length > 0) {
            configs.lastId = items[0].id
            const fidMap = new Map<string, RSSSource>()
            for (let source of Object.values(state.sources)) {
                if (source.serviceRef) {
                    fidMap.set(source.serviceRef, source)
                }
            }
            const parsedItems = new Array<RSSItem>()
            items.map(i => {
                const source = fidMap.get(i.origin.streamId)
                if (source === undefined) return
                const dom = domParser.parseFromString(
                    i.summary.content,
                    "text/html"
                )
                if (
                    configs.type == SyncService.Inoreader &&
                    configs.removeInoreaderAd !== false
                ) {
                    if (
                        dom.documentElement.textContent
                            .trim()
                            .startsWith("Ads from Inoreader")
                    ) {
                        dom.body.firstChild.remove()
                    }
                }
                const item = {
                    source: source.sid,
                    title: i.title,
                    link: i.canonical[0].href,
                    date: new Date(i.published * 1000),
                    fetchedDate: new Date(parseInt(i.crawlTimeMsec)),
                    content: dom.body.innerHTML,
                    snippet: dom.documentElement.textContent.trim(),
                    creator: i.author,
                    hasRead: false,
                    starred: false,
                    hidden: false,
                    notify: false,
                    serviceRef: i.id,
                } as RSSItem
                const baseEl = dom.createElement("base")
                baseEl.setAttribute(
                    "href",
                    item.link.split("/").slice(0, 3).join("/")
                )
                dom.head.append(baseEl)
                let img = dom.querySelector("img")
                if (img && img.src) item.thumb = img.src
                if (configs.type == SyncService.Inoreader)
                    item.title = htmlDecode(item.title)
                for (let c of i.categories) {
                    if (!item.hasRead && c.endsWith("/state/com.google/read"))
                        item.hasRead = true
                    else if (
                        !item.starred &&
                        c.endsWith("/state/com.google/starred")
                    )
                        item.starred = true
                }
                // Apply rules and sync back to the service
                if (source.rules) {
                    const hasRead = item.hasRead
                    const starred = item.starred
                    SourceRule.applyAll(source.rules, item)
                    if (item.hasRead !== hasRead)
                        editTag(
                            configs,
                            item.serviceRef,
                            READ_TAG,
                            item.hasRead
                        )
                    if (item.starred !== starred)
                        editTag(
                            configs,
                            item.serviceRef,
                            STAR_TAG,
                            item.starred
                        )
                }
                parsedItems.push(item)
            })
            if (parsedItems.length > 0) {
                configs.lastFetched = Math.round(
                    parsedItems[0].fetchedDate.getTime() / 1000
                )
            }
            return [parsedItems, configs]
        } else {
            return [[], configs]
        }
    },

    markAllRead: (sids, date, before) => async (_, getState) => {
        const state = getState()
        const configs = state.service as GReaderConfigs
        if (date) {
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
            const refs = rows.map(row => row["serviceRef"]).join("&i=")
            if (refs) {
                editTag(getState().service as GReaderConfigs, refs, READ_TAG)
            }
        } else {
            const sources = sids.map(sid => state.sources[sid])
            for (let source of sources) {
                if (source.serviceRef) {
                    const body = new URLSearchParams()
                    body.set("s", source.serviceRef)
                    fetchAPI(
                        configs,
                        "/reader/api/0/mark-all-as-read",
                        "POST",
                        body
                    )
                }
            }
        }
    },

    markRead: (item: RSSItem) => async (_, getState) => {
        await editTag(
            getState().service as GReaderConfigs,
            item.serviceRef,
            READ_TAG
        )
    },

    markUnread: (item: RSSItem) => async (_, getState) => {
        await editTag(
            getState().service as GReaderConfigs,
            item.serviceRef,
            READ_TAG,
            false
        )
    },

    star: (item: RSSItem) => async (_, getState) => {
        await editTag(
            getState().service as GReaderConfigs,
            item.serviceRef,
            STAR_TAG
        )
    },

    unstar: (item: RSSItem) => async (_, getState) => {
        await editTag(
            getState().service as GReaderConfigs,
            item.serviceRef,
            STAR_TAG,
            false
        )
    },
}
