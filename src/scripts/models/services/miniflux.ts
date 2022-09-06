import intl from "react-intl-universal"
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

const APIError = () => new Error(intl.get("service.failure"));

// base endpoint, authorization with dedicated token or http basic user/pass pair
async function fetchAPI(configs: MinifluxConfigs, endpoint: string = "", method: string = "GET", body: string = null): Promise<Response>
{
	try 
	{
		const headers = new Headers();
		headers.append("content-type", "application/x-www-form-urlencoded");

		configs.apiKeyAuth ? 
			headers.append("X-Auth-Token", configs.authKey) 
			:
			headers.append("Authorization", `Basic ${configs.authKey}`)

		const response = await fetch(configs.endpoint + "/v1/" + endpoint, {
			method: method,
			body: body,
			headers: headers
		});
		
		return response;
	}
	catch(error)
	{
		console.log(error);
		throw APIError();
	}
}

export const minifluxServiceHooks: ServiceHooks = {

	// poll service info endpoint to verify auth
	authenticate: async (configs: MinifluxConfigs) => {
		const response = await fetchAPI(configs, "me");
		
		if (await response.json().then(json => json.error_message))
			return false

		return true
	},

	// collect sources from service, along with associated groups/categories
	updateSources: () => async (dispatch, getState) => {
		const configs = getState().service as MinifluxConfigs

		// fetch and create groups in redux
		if (configs.importGroups)
		{
			const groups: Category[] = await fetchAPI(configs, "categories")
				.then(response => response.json())
			groups.forEach(group => dispatch(createSourceGroup(group.title)))
		}

		// fetch all feeds
		const feedResponse = await fetchAPI(configs, "feeds")
		const feeds = await feedResponse.json()

		if (feeds === undefined) throw APIError()

		// go through feeds, create typed source while also mapping by group
		let sources: RSSSource[] = new Array<RSSSource>();
		let groupsMap: Map<string, string> = new Map<string, string>()
		for (let feed of feeds)
		{
			let source = new RSSSource(feed.feed_url, feed.title);
			// associate service christened id to match in other request
			source.serviceRef = feed.id.toString();
			sources.push(source);
			groupsMap.set(feed.id.toString(), feed.category.title)
		}

		return [sources, groupsMap]
	},

	// fetch entries from after the last fetched id (if exists)
	// limit by quantity and maximum safe integer (id)
		// NOTE: miniflux endpoint /entries default order with "published at", and does not offer "created_at"
	 	// 		 but does offer id sort, directly correlated with "created". some feeds give strange published_at.
	
	fetchItems: () => async (_, getState) =>  {
		const state = getState()
		const configs = state.service as MinifluxConfigs
		let items: Entry[] = new Array()
		let entriesResponse: Entries 

		// parameters 
        let min = Number.MAX_SAFE_INTEGER
		configs.lastId ? configs.lastId : 0
		// intermediate
		const quantity = 100;
		let continueId: number

		do
		{
			try 
			{
				if (continueId)
				{
					entriesResponse = await fetchAPI(configs, `entries?
						order=id
						&direction=desc
						&after_entry_id=${configs.lastId}
						&before_entry_id=${continueId}
						&limit=${quantity}`).then(response => response.json());
				}
				else
				{
					entriesResponse = await fetchAPI(configs, `entries?
						order=id
						&direction=desc
						&after_entry_id=${configs.lastId}
						&limit=${quantity}`).then(response => response.json());
				}

				items = entriesResponse.entries.concat(items)
				continueId = items[items.length-1].id
			}
			catch 
			{
				break;
			}
		} 
		while (min > configs.lastId &&
			   		entriesResponse.entries &&
					entriesResponse.total == 100 &&
					items.length < configs.fetchLimit)

		// break/return nothing if no new items acquired
		if (items.length == 0) return [[], configs]
		configs.lastId = items[0].id;

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
				date: new Date(item.created_at),
				fetchedDate: new Date(),
				content: item.content,
				snippet: htmlDecode(item.content).trim(),
				creator: item.author,
				hasRead: Boolean(item.status == "read"),
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
			if (img && img.src)
				parsedItem.thumb = img.src


			if (source.rules)
			{
				SourceRule.applyAll(source.rules, parsedItem)
				if (Boolean(item.status == "read") !== parsedItem.hasRead)
					minifluxServiceHooks.markRead(parsedItem)
				if (Boolean(item.starred) !== Boolean(parsedItem.starred))
					minifluxServiceHooks.markUnread(parsedItem)
			}

			return parsedItem
		});

		return [parsedItems, configs]
	},

	// get remote read and star state of articles, for local sync
	syncItems: () => async(_, getState) => {
		const configs = getState().service as MinifluxConfigs

		const unread: Entries = await fetchAPI(configs, "entries?status=unread")
			.then(response => response.json());
		const starred: Entries = await fetchAPI(configs, "entries?starred=true")
			.then(response => response.json());

		return [new Set(unread.entries.map((entry: Entry) => String(entry.id))), new Set(starred.entries.map((entry: Entry) => String(entry.id)))];
	},

	markRead: (item: RSSItem) => async(_, getState) => {
		if (!item.serviceRef) return;

		const body =  `{
			"entry_ids": [${item.serviceRef}],
			"status": "read"
		}`

		const response = await fetchAPI(getState().service as MinifluxConfigs, "entries", "PUT", body)

		if (response.status !== 204) throw APIError();
	},

    markUnread: (item: RSSItem) => async (_, getState) => {
		if (!item.serviceRef) return;

		const body =  `{
			"entry_ids": [${item.serviceRef}],
			"status": "unread"
		}`
		await fetchAPI(getState().service as MinifluxConfigs, "entries", "PUT", body)
    },

	// mark entries for source ids as read, relative to date, determined by "before" bool

	// context menu component:
		// item - null, item date, either
		// group - group sources, null, true
		// nav - null, daysago, true 
	
	// if null, state consulted for context sids 
	
	markAllRead: (sids, date, before) => async(_, getState) => {

        const state = getState()
		let items = state.feeds[state.page.feedId].iids
			.map(iid => state.items[iid])
			.filter(item => item.serviceRef && !item.hasRead)

		if (date) items = items.filter(i => before ? i.date < date : i.date > date)

		const refs = items.map(item => item.serviceRef)

		const body =  `{
			"entry_ids": [${refs}],
			"status": "read"
		}`

		await fetchAPI(getState().service as MinifluxConfigs, "entries", "PUT", body)
	},

    star: (item: RSSItem) => async (_, getState) => {
		if (!item.serviceRef) return;

		await fetchAPI(getState().service as MinifluxConfigs, `entries/${item.serviceRef}/bookmark`, "PUT");
    },

    unstar: (item: RSSItem) => async (_, getState) => {
		if (!item.serviceRef) return;

		await fetchAPI(getState().service as MinifluxConfigs, `entries/${item.serviceRef}/bookmark`, "PUT");
    }

}

	





