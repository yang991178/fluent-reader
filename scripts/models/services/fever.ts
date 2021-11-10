import intl from "react-intl-universal"
import { ServiceHooks } from "../service"
import { ServiceConfigs, SyncService } from "../../../schema-types"
import { createSourceGroup } from "../group"
import { RSSSource } from "../source"
import { htmlDecode, domParser } from "../../utils"
import { RSSItem } from "../item"
import { SourceRule } from "../rule"

export interface FeverConfigs extends ServiceConfigs {
    type: SyncService.Fever
    endpoint: string
    username: string
    apiKey: string
    fetchLimit: number
    lastId?: number
    useInt32?: boolean
}

async function fetchAPI(configs: FeverConfigs, params = "", postparams = "") {
    const response = await fetch(configs.endpoint + "?api" + params, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: `api_key=${configs.apiKey}${postparams}`,
    })
    return await response.json()
}

async function markItem(configs: FeverConfigs, item: RSSItem, as: string) {
    if (item.serviceRef) {
        try {
            await fetchAPI(
                configs,
                "",
                `&mark=item&as=${as}&id=${item.serviceRef}`
            )
        } catch (err) {
            console.log(err)
        }
    }
}

const APIError = () => new Error(intl.get("service.failure"))

export const feverServiceHooks: ServiceHooks = {
    authenticate: async (configs: FeverConfigs) => {
        try {
            return Boolean((await fetchAPI(configs)).auth)
        } catch {
            return false
        }
    },

    updateSources: () => async (dispatch, getState) => {
        const configs = getState().service as FeverConfigs
        const response = await fetchAPI(configs, "&feeds")
        const feeds: any[] = response.feeds
        const feedGroups: any[] = response.feeds_groups
        if (feeds === undefined) throw APIError()
        let groupsMap: Map<string, string>
        if (configs.importGroups) {
            // Import groups on the first sync
            const groups: any[] = (await fetchAPI(configs, "&groups")).groups
            if (groups === undefined || feedGroups === undefined)
                throw APIError()
            const groupsIdMap = new Map<number, string>()
            for (let group of groups) {
                const title = group.title.trim()
                dispatch(createSourceGroup(title))
                groupsIdMap.set(group.id, title)
            }
            groupsMap = new Map()
            for (let group of feedGroups) {
                for (let fid of group.feed_ids.split(",")) {
                    groupsMap.set(fid, groupsIdMap.get(group.group_id))
                }
            }
        }
        const sources = feeds.map(f => {
            const source = new RSSSource(f.url, f.title)
            source.serviceRef = String(f.id)
            return source
        })
        return [sources, groupsMap]
    },

    fetchItems: () => async (_, getState) => {
        const state = getState()
        const configs = state.service as FeverConfigs
        const items = new Array()
        configs.lastId = configs.lastId || 0
        let min = configs.useInt32 ? 2147483647 : Number.MAX_SAFE_INTEGER
        let response
        do {
            response = await fetchAPI(configs, `&items&max_id=${min}`)
            if (response.items === undefined) throw APIError()
            items.push(...response.items.filter(i => i.id > configs.lastId))
            if (
                response.items.length === 0 &&
                min === Number.MAX_SAFE_INTEGER
            ) {
                configs.useInt32 = true
                min = 2147483647
                response = undefined
            } else {
                min = response.items.reduce((m, n) => Math.min(m, n.id), min)
            }
        } while (
            min > configs.lastId &&
            (response === undefined || response.items.length >= 50) &&
            items.length < configs.fetchLimit
        )
        configs.lastId = items.reduce(
            (m, n) => Math.max(m, n.id),
            configs.lastId
        )
        if (items.length > 0) {
            const fidMap = new Map<string, RSSSource>()
            for (let source of Object.values(state.sources)) {
                if (source.serviceRef) {
                    fidMap.set(source.serviceRef, source)
                }
            }
            const parsedItems = items.map(i => {
                const source = fidMap.get(String(i.feed_id))
                const item = {
                    source: source.sid,
                    title: i.title,
                    link: i.url,
                    date: new Date(i.created_on_time * 1000),
                    fetchedDate: new Date(),
                    content: i.html,
                    snippet: htmlDecode(i.html).trim(),
                    creator: i.author,
                    hasRead: Boolean(i.is_read),
                    starred: Boolean(i.is_saved),
                    hidden: false,
                    notify: false,
                    serviceRef: String(i.id),
                } as RSSItem
                // Try to get the thumbnail of the item
                let dom = domParser.parseFromString(item.content, "text/html")
                let baseEl = dom.createElement("base")
                baseEl.setAttribute(
                    "href",
                    item.link.split("/").slice(0, 3).join("/")
                )
                dom.head.append(baseEl)
                let img = dom.querySelector("img")
                if (img && img.src) {
                    item.thumb = img.src
                } else if (configs.useInt32) {
                    // TTRSS Fever Plugin attachments
                    let a = dom.querySelector(
                        "body>ul>li:first-child>a"
                    ) as HTMLAnchorElement
                    if (a && /, image\/generic$/.test(a.innerText) && a.href)
                        item.thumb = a.href
                }
                // Apply rules and sync back to the service
                if (source.rules) SourceRule.applyAll(source.rules, item)
                if (Boolean(i.is_read) !== item.hasRead)
                    markItem(configs, item, item.hasRead ? "read" : "unread")
                if (Boolean(i.is_saved) !== Boolean(item.starred))
                    markItem(configs, item, item.starred ? "saved" : "unsaved")
                return item
            })
            return [parsedItems, configs]
        } else {
            return [[], configs]
        }
    },

    syncItems: () => async (_, getState) => {
        const configs = getState().service as FeverConfigs
        const [unreadResponse, starredResponse] = await Promise.all([
            fetchAPI(configs, "&unread_item_ids"),
            fetchAPI(configs, "&saved_item_ids"),
        ])
        if (
            typeof unreadResponse.unread_item_ids !== "string" ||
            typeof starredResponse.saved_item_ids !== "string"
        ) {
            throw APIError()
        }
        const unreadFids: string[] = unreadResponse.unread_item_ids.split(",")
        const starredFids: string[] = starredResponse.saved_item_ids.split(",")
        return [new Set(unreadFids), new Set(starredFids)]
    },

    markAllRead: (sids, date, before) => async (_, getState) => {
        const state = getState()
        const configs = state.service as FeverConfigs
        if (date && !before) {
            const iids = state.feeds[state.page.feedId].iids
            const items = iids
                .map(iid => state.items[iid])
                .filter(i => !i.hasRead && i.date.getTime() >= date.getTime())
            for (let item of items) {
                if (item.serviceRef) {
                    markItem(configs, item, "read")
                }
            }
        } else {
            const sources = sids.map(sid => state.sources[sid])
            const timestamp =
                Math.floor((date ? date.getTime() : Date.now()) / 1000) + 1
            for (let source of sources) {
                if (source.serviceRef) {
                    fetchAPI(
                        configs,
                        "",
                        `&mark=feed&as=read&id=${source.serviceRef}&before=${timestamp}`
                    )
                }
            }
        }
    },

    markRead: (item: RSSItem) => async (_, getState) => {
        await markItem(getState().service as FeverConfigs, item, "read")
    },

    markUnread: (item: RSSItem) => async (_, getState) => {
        await markItem(getState().service as FeverConfigs, item, "unread")
    },

    star: (item: RSSItem) => async (_, getState) => {
        await markItem(getState().service as FeverConfigs, item, "saved")
    },

    unstar: (item: RSSItem) => async (_, getState) => {
        await markItem(getState().service as FeverConfigs, item, "unsaved")
    },
}
