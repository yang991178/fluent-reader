import intl from "react-intl-universal"
import { ThunkAction, ThunkDispatch } from "redux-thunk"
import { AnyAction } from "redux"
import { RootState } from "./reducer"
import Parser from "@yang991178/rss-parser"
import Url from "url"

export enum ActionStatus {
    Request, Success, Failure, Intermediate
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
            "thumb", "image", ["content:encoded", "fullContent"], 
            ['media:content', 'mediaContent', {keepArray: true}],
        ] as Parser.CustomFieldItem[]
    }
})

export async function parseRSS(url: string) {
    let result: Response
    try {
        result = await fetch(url, { credentials: "omit" })
    } catch {
        throw new Error(intl.get("log.networkError"))
    }
    if (result && result.ok) {
        try {
            return await rssParser.parseString(await result.text())
        } catch {
            throw new Error(intl.get("log.parseError"))
        }
    } else {
        throw new Error(result.statusText)
    }
}

export const domParser = new DOMParser()

export async function fetchFavicon(url: string) {
    try {
        let result = await fetch(url, { credentials: "omit" })
        if (result.ok) {
            let html = await result.text()
            let dom = domParser.parseFromString(html, "text/html")
            let links = dom.getElementsByTagName("link")
            for (let link of links) {
                let rel = link.getAttribute("rel")
                if ((rel === "icon" || rel === "shortcut icon") && link.hasAttribute("href")) {
                    let href = link.getAttribute("href")
                    let parsedUrl = Url.parse(url)
                    if (href.startsWith("//")) return parsedUrl.protocol + href
                    else if (href.startsWith("/")) return url + href
                    else return href
                }
            }
        }
        url = url + "/favicon.ico"
        result = await fetch(url, { credentials: "omit" })
        if (result.status == 200 && result.headers.has("Content-Type")
            && result.headers.get("Content-Type").startsWith("image")) {
            return url
        }
        return null
    } catch {
        return null
    }
}

export function htmlDecode(input: string) {
    var doc = domParser.parseFromString(input, "text/html")
    return doc.documentElement.textContent
}

export const urlTest = (s: string) => 
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi.test(s)

export const getWindowBreakpoint = () => window.outerWidth >= 1441

export const cutText = (s: string, length: number) => {
    return (s.length <= length) ? s : s.slice(0, length) + "…"
}

export const googleSearch = (text: string) => window.utils.openExternal("https://www.google.com/search?q=" + encodeURIComponent(text))

export function mergeSortedArrays<T>(a: T[], b: T[], cmp: ((x: T, y: T) => number)): T[] {
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
    var s = str.length;
    for (var i = str.length - 1; i >= 0; i--) {
        var code = str.charCodeAt(i);
        if (code > 0x7f && code <= 0x7ff) s++;
        else if (code > 0x7ff && code <= 0xffff) s += 2;
        if (code >= 0xDC00 && code <= 0xDFFF) i--; //trail surrogate
    }
    return s;
}

export function calculateItemSize(): Promise<number> {
    return new Promise((resolve, reject) => {
        let openRequest = window.indexedDB.open("NeDB")
        openRequest.onsuccess = () => {
            let db = openRequest.result
            let objectStore = db.transaction("nedbdata").objectStore("nedbdata")
            let getRequest = objectStore.get("items")
            getRequest.onsuccess = () => {
                resolve(byteLength(getRequest.result))
            }
            getRequest.onerror = () => reject()
        }
        openRequest.onerror = () => reject()
    })
}

export function validateRegex(regex: string): RegExp {
    try {
        return new RegExp(regex)
    } catch {
        return null
    }
}
