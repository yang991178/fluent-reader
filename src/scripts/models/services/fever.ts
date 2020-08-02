import intl from "react-intl-universal"
import * as db from "../../db"
import { ServiceHooks, saveServiceConfigs, syncLocalItems } from "../service"
import { ServiceConfigs, SyncService } from "../../../schema-types"
import { createSourceGroup, addSourceToGroup } from "../group"
import { RSSSource, insertSource, addSourceSuccess, updateSource, deleteSource, updateUnreadCounts } from "../source"
import { fetchFavicon, htmlDecode, domParser } from "../../utils"
import { saveSettings, pushNotification } from "../app"
import { initFeeds, FilterType } from "../feed"
import { RSSItem, insertItems, fetchItemsSuccess } from "../item"
import { SourceRule } from "../rule"

export interface FeverConfigs extends ServiceConfigs {
    type: SyncService.Fever
    endpoint: string
    username: string
    apiKey: string
    fetchLimit: number
    lastId?: number
    importGroups?: boolean
}

async function fetchAPI(configs: FeverConfigs, params="", postparams="") {
    const response = await fetch(configs.endpoint + "?api" + params, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: `api_key=${configs.apiKey}${postparams}`
    })
    return await response.json()
}

async function markItem(configs: FeverConfigs, item: RSSItem, as: string) {
    if (item.serviceRef) {
        try {
            await fetchAPI(configs, "", `&mark=item&as=${as}&id=${item.serviceRef}`)
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
        const initState = getState()
        const configs = initState.service as FeverConfigs
        const response = await fetchAPI(configs, "&feeds")
        const feeds: any[] = response.feeds
        const feedGroups: any[] = response.feeds_groups
        if (feeds === undefined) throw APIError()
        let groupsMap: Map<number, string>
        if (configs.importGroups) {
            // Import groups on the first sync
            const groups: any[] = (await fetchAPI(configs, "&groups")).groups
            if (groups === undefined || feedGroups === undefined) throw APIError()
            groupsMap = new Map()
            for (let group of groups) {
                dispatch(createSourceGroup(group.title))
                groupsMap.set(group.id, group.title)
            }
        }
        const existing = new Map<number, RSSSource>()
        for (let source of Object.values(initState.sources)) {
            if (source.serviceRef) {
                existing.set(source.serviceRef as number, source)
            }
        }
        const forceSettings = () => {
            if (!(getState().app.settings.saving)) dispatch(saveSettings())
        }
        let promises = feeds.map(f => new Promise<RSSSource>((resolve, reject) => {
            if (existing.has(f.id)) {
                const doc = existing.get(f.id)
                existing.delete(f.id)
                resolve(doc)
            } else {
                db.sdb.findOne({ url: f.url }, (err, doc) => {
                    if (err) {
                        reject(err)
                    } else if (doc === null) {
                        // Create a new source
                        forceSettings()
                        let source = new RSSSource(f.url, f.title)
                        source.serviceRef = f.id
                        const domain = source.url.split("/").slice(0, 3).join("/")
                        fetchFavicon(domain).then(favicon => {
                            if (favicon) source.iconurl = favicon
                            dispatch(insertSource(source))
                                .then((inserted) => {
                                    inserted.unreadCount = 0
                                    resolve(inserted)
                                    dispatch(addSourceSuccess(inserted, true))
                                })
                                .catch((err) => {
                                    reject(err)
                                })
                        })
                    } else if (doc.serviceRef !== f.id) {
                        // Mark an existing source as remote and remove all items
                        forceSettings()
                        doc.serviceRef = f.id
                        doc.unreadCount = 0
                        dispatch(updateSource(doc)).finally(() => {
                            db.idb.remove({ source: doc.sid }, { multi: true }, (err) => {
                                if (err) reject(err)
                                else resolve(doc)
                            })
                        })
                    } else {
                        resolve(doc)
                    }
                })
            }
        }))
        for (let [_, source] of existing) {
            // Delete sources removed from the service side
            forceSettings()
            promises.push(dispatch(deleteSource(source, true)).then(() => null))
        }
        let sources = (await Promise.all(promises)).filter(s => s)
        if (groupsMap) {
            // Add sources to imported groups
            forceSettings()
            let sourcesMap = new Map<number, number>()
            for (let source of sources) sourcesMap.set(source.serviceRef as number, source.sid)
            for (let group of feedGroups) {
                for (let fid of group.feed_ids.split(",").map(s => parseInt(s))) {
                    if (sourcesMap.has(fid)) {
                        const gid = dispatch(createSourceGroup(groupsMap.get(group.group_id)))
                        dispatch(addSourceToGroup(gid, sourcesMap.get(fid)))
                    }
                }
            }
            delete configs.importGroups
            dispatch(saveServiceConfigs(configs))
        }
    },

    fetchItems: (background) => async (dispatch, getState) => {
        const state = getState()
        const configs = state.service as FeverConfigs
        const items = new Array()
        configs.lastId = configs.lastId || 0
        let min = 2147483647
        let response
        do {
            response = await fetchAPI(configs, `&items&max_id=${min}`)
            if (response.items === undefined) throw APIError()
            items.push(...response.items.filter(i => i.id > configs.lastId))
            min = response.items.reduce((m, n) => Math.min(m, n.id), min)
        } while (min > configs.lastId && response.items.length >= 50 && items.length < configs.fetchLimit)
        configs.lastId = items.reduce((m, n) => Math.max(m, n.id), configs.lastId)
        if (items.length > 0) {
            const fidMap = new Map<number, RSSSource>()
            for (let source of Object.values(state.sources)) {
                if (source.serviceRef) {
                    fidMap.set(source.serviceRef as number, source)
                }
            }
            const parsedItems = items.map(i => {
                const source = fidMap.get(i.feed_id)
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
                    serviceRef: i.id
                } as RSSItem
                if (i.is_saved) item.starred = true
                // Try to get the thumbnail of the item
                let dom = domParser.parseFromString(item.content, "text/html")
                let baseEl = dom.createElement('base')
                baseEl.setAttribute('href', item.link.split("/").slice(0, 3).join("/"))
                dom.head.append(baseEl)
                let img = dom.querySelector("img")
                if (img && img.src) { 
                    item.thumb = img.src
                } else {
                    let a = dom.querySelector("body>ul>li:first-child>a") as HTMLAnchorElement
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
            const inserted = await insertItems(parsedItems)
            dispatch(fetchItemsSuccess(inserted.reverse(), getState().items))
            if (background) {
                for (let item of inserted) {
                    if (item.notify) dispatch(pushNotification(item))
                }
                if (inserted.length > 0) window.utils.requestAttention()
            }
            dispatch(saveServiceConfigs(configs))
        }
    },

    syncItems: () => async (dispatch, getState) => {
        const state = getState()
        const configs = state.service as FeverConfigs
        const unreadResponse = await fetchAPI(configs, "&unread_item_ids")
        const starredResponse = await fetchAPI(configs, "&saved_item_ids")
        if (typeof unreadResponse.unread_item_ids !== "string" || typeof starredResponse.saved_item_ids !== "string") {
            throw APIError()
        }
        const unreadFids: number[] = unreadResponse.unread_item_ids.split(",").map(s => parseInt(s))
        const starredFids: number[] = starredResponse.saved_item_ids.split(",").map(s => parseInt(s))
        const promises = new Array<Promise<number>>()
        promises.push(new Promise((resolve) => {
            db.idb.update({ 
                serviceRef: { $exists: true, $in: unreadFids }, 
                hasRead: true 
            }, { $set: { hasRead: false } }, { multi: true }, (_, num) => resolve(num))
        }))
        promises.push(new Promise((resolve) => {
            db.idb.update({ 
                serviceRef: { $exists: true, $nin: unreadFids }, 
                hasRead: false 
            }, { $set: { hasRead: true } }, { multi: true }, (_, num) => resolve(num))
        }))
        promises.push(new Promise((resolve) => {
            db.idb.update({ 
                serviceRef: { $exists: true, $in: starredFids }, 
                starred: { $exists: false } 
            }, { $set: { starred: true } }, { multi: true }, (_, num) => resolve(num))
        }))
        promises.push(new Promise((resolve) => {
            db.idb.update({ 
                serviceRef: { $exists: true, $nin: starredFids }, 
                starred: true 
            }, { $unset: { starred: true } }, { multi: true }, (_, num) => resolve(num))
        }))
        const affected = (await Promise.all(promises)).reduce((a, b) => a + b, 0)
        if (affected > 0) {
            dispatch(syncLocalItems(unreadFids, starredFids))
            if (!(state.page.filter.type & FilterType.ShowRead) || !(state.page.filter.type & FilterType.ShowNotStarred)) {
                dispatch(initFeeds(true))
            }
            await dispatch(updateUnreadCounts())
        }
    },

    markAllRead: (sids, date, before) => async (_, getState) => {
        const state = getState()
        const configs = state.service as FeverConfigs
        if (date && !before) {
            const iids = state.feeds[state.page.feedId].iids
            const items = iids.map(iid => state.items[iid]).filter(i => !i.hasRead && i.date.getTime() >= date.getTime())
            for (let item of items) {
                if (item.serviceRef) {
                    markItem(configs, item, "read")
                }
            }
        } else {
            const sources = sids.map(sid => state.sources[sid])
            const timestamp = Math.floor((date ? date.getTime() : Date.now()) / 1000) + 1
            for (let source of sources) {
                if (source.serviceRef) {
                    fetchAPI(configs, "", `&mark=feed&as=read&id=${source.serviceRef}&before=${timestamp}`)
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