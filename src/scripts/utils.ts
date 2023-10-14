import intl from "react-intl-universal"
import { ThunkAction, ThunkDispatch } from "redux-thunk"
import { AnyAction } from "redux"
import { RootState } from "./reducer"
import Parser from "rss-parser"
import Url from "url"
import { SearchEngines } from "../schema-types"

export enum ActionStatus {
    Request,
    Success,
    Failure,
    Intermediate,
}

export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    AnyAction
>

export type AppDispatch = ThunkDispatch<RootState, undefined, AnyAction>

const rssParser = new Parser({
    customFields: {
        item: [
            "thumb",
            "image",
            ["content:encoded", "fullContent"],
            ["media:content", "mediaContent", { keepArray: true }],
        ],
    },
})
type extractGeneric<Type> = Type extends Parser<infer _, infer U> ? U : never
export type MyParserItem = extractGeneric<typeof rssParser> & Parser.Item

const CHARSET_RE = /charset=([^()<>@,;:\"/[\]?.=\s]*)/i
const XML_ENCODING_RE = /^<\?xml.+encoding="(.+?)".*?\?>/i
export async function decodeFetchResponse(response: Response, isHTML = false) {
    const buffer = await response.arrayBuffer()
    let ctype =
        response.headers.has("content-type") &&
        response.headers.get("content-type")
    let charset =
        ctype && CHARSET_RE.test(ctype) ? CHARSET_RE.exec(ctype)[1] : undefined
    let content = new TextDecoder(charset).decode(buffer)
    if (charset === undefined) {
        if (isHTML) {
            const dom = domParser.parseFromString(content, "text/html")
            charset = dom
                .querySelector("meta[charset]")
                ?.getAttribute("charset")
                ?.toLowerCase()
            if (!charset) {
                ctype = dom
                    .querySelector("meta[http-equiv='Content-Type']")
                    ?.getAttribute("content")
                charset =
                    ctype &&
                    CHARSET_RE.test(ctype) &&
                    CHARSET_RE.exec(ctype)[1].toLowerCase()
            }
        } else {
            charset =
                XML_ENCODING_RE.test(content) &&
                XML_ENCODING_RE.exec(content)[1].toLowerCase()
        }
        if (charset && charset !== "utf-8" && charset !== "utf8") {
            content = new TextDecoder(charset).decode(buffer)
        }
    }
    return content
}

export async function parseRSS(url: string) {
    let result: Response
    try {
        result = await fetch(url, { credentials: "omit" })
    } catch {
        throw new Error(intl.get("log.networkError"))
    }
    if (result && result.ok) {
        try {
            return await rssParser.parseString(
                await decodeFetchResponse(result)
            )
        } catch {
            throw new Error(intl.get("log.parseError"))
        }
    } else {
        throw new Error(result.status + " " + result.statusText)
    }
}

export const domParser = new DOMParser()

export async function fetchFavicon(url: string) {
    try {
        url = url.split("/").slice(0, 3).join("/")
        let result = await fetch(url, { credentials: "omit" })
        if (result.ok) {
            let html = await result.text()
            let dom = domParser.parseFromString(html, "text/html")
            let links = dom.getElementsByTagName("link")
            for (let link of links) {
                let rel = link.getAttribute("rel")
                if (
                    (rel === "icon" || rel === "shortcut icon") &&
                    link.hasAttribute("href")
                ) {
                    let href = link.getAttribute("href")
                    let parsedUrl = Url.parse(url)
                    if (href.startsWith("//")) return parsedUrl.protocol + href
                    else if (href.startsWith("/")) return url + href
                    else return href
                }
            }
        }
        url = url + "/favicon.ico"
        if (await validateFavicon(url)) {
            return url
        } else {
            return null
        }
    } catch {
        return null
    }
}

export async function validateFavicon(url: string) {
    let flag = false
    try {
        const result = await fetch(url, { credentials: "omit" })
        if (
            result.status == 200 &&
            result.headers.has("Content-Type") &&
            result.headers.get("Content-Type").startsWith("image")
        ) {
            flag = true
        }
    } finally {
        return flag
    }
}

export function htmlDecode(input: string) {
    var doc = domParser.parseFromString(input, "text/html")
    return doc.documentElement.textContent
}

export const urlTest = (s: string) =>
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,63}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi.test(
        s
    )

export const getWindowBreakpoint = () => window.outerWidth >= 1440

export const cutText = (s: string, length: number) => {
    return s.length <= length ? s : s.slice(0, length) + "…"
}

export function getSearchEngineName(engine: SearchEngines) {
    switch (engine) {
        case SearchEngines.Google:
            return intl.get("searchEngine.google")
        case SearchEngines.Bing:
            return intl.get("searchEngine.bing")
        case SearchEngines.Baidu:
            return intl.get("searchEngine.baidu")
        case SearchEngines.DuckDuckGo:
            return intl.get("searchEngine.duckduckgo")
    }
}
export function webSearch(text: string, engine = SearchEngines.Google) {
    switch (engine) {
        case SearchEngines.Google:
            return window.utils.openExternal(
                "https://www.google.com/search?q=" + encodeURIComponent(text)
            )
        case SearchEngines.Bing:
            return window.utils.openExternal(
                "https://www.bing.com/search?q=" + encodeURIComponent(text)
            )
        case SearchEngines.Baidu:
            return window.utils.openExternal(
                "https://www.baidu.com/s?wd=" + encodeURIComponent(text)
            )
        case SearchEngines.DuckDuckGo:
            return window.utils.openExternal(
                "https://duckduckgo.com/?q=" + encodeURIComponent(text)
            )
    }
}

export function mergeSortedArrays<T>(
    a: T[],
    b: T[],
    cmp: (x: T, y: T) => number
): T[] {
    let merged = new Array<T>()
    let i = 0
    let j = 0
    while (i < a.length && j < b.length) {
        if (cmp(a[i], b[j]) <= 0) {
            merged.push(a[i++])
        } else {
            merged.push(b[j++])
        }
    }
    while (i < a.length) merged.push(a[i++])
    while (j < b.length) merged.push(b[j++])
    return merged
}

export function byteToMB(B: number) {
    let MB = Math.round(B / 1048576)
    return MB + "MB"
}

function byteLength(str: string) {
    var s = str.length
    for (var i = str.length - 1; i >= 0; i--) {
        var code = str.charCodeAt(i)
        if (code > 0x7f && code <= 0x7ff) s++
        else if (code > 0x7ff && code <= 0xffff) s += 2
        if (code >= 0xdc00 && code <= 0xdfff) i-- //trail surrogate
    }
    return s
}

export function calculateItemSize(): Promise<number> {
    return new Promise((resolve, reject) => {
        let result = 0
        let openRequest = window.indexedDB.open("itemsDB")
        openRequest.onsuccess = () => {
            let db = openRequest.result
            let objectStore = db.transaction("items").objectStore("items")
            let cursorRequest = objectStore.openCursor()
            cursorRequest.onsuccess = () => {
                let cursor = cursorRequest.result
                if (cursor) {
                    result += byteLength(JSON.stringify(cursor.value))
                    cursor.continue()
                } else {
                    resolve(result)
                }
            }
            cursorRequest.onerror = () => reject()
        }
        openRequest.onerror = () => reject()
    })
}

export function validateRegex(regex: string, flags = ""): RegExp {
    try {
        return new RegExp(regex, flags)
    } catch {
        return null
    }
}

export function platformCtrl(
    e: React.MouseEvent | React.KeyboardEvent | MouseEvent | KeyboardEvent
) {
    return window.utils.platform === "darwin" ? e.metaKey : e.ctrlKey
}

export function initTouchBarWithTexts() {
    window.utils.initTouchBar({
        menu: intl.get("nav.menu"),
        search: intl.get("search"),
        refresh: intl.get("nav.refresh"),
        markAll: intl.get("nav.markAllRead"),
        notifications: intl.get("nav.notifications"),
    })
}
