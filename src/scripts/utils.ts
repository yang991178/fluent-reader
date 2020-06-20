import { shell, remote } from "electron"
import { ThunkAction, ThunkDispatch } from "redux-thunk"
import { AnyAction } from "redux"
import { RootState } from "./reducer"

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

import Parser = require("@yang991178/rss-parser")
const rssParser = new Parser({
    customFields: {
        item: ["thumb", "image", ["content:encoded", "fullContent"]] as Parser.CustomFieldItem[]
    }
})

export async function parseRSS(url: string) {
    try {
        let result = await fetch(url, { credentials: "omit" })
        if (result.ok) {
            return await rssParser.parseString(await result.text())
        } else {
            throw new Error(result.statusText)
        }
    } catch {
        throw new Error("A network error has occured.")
    }
}

export const domParser = new DOMParser()

import Url = require("url")
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

export function openExternal(url: string) {
    if (url.startsWith("https://") || url.startsWith("http://"))
        shell.openExternal(url)
}

export const urlTest = (s: string) => 
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi.test(s)

export const getWindowBreakpoint = () => remote.getCurrentWindow().getSize()[0] >= 1441

export const cutText = (s: string, length: number) => {
    return (s.length <= length) ? s : s.slice(0, length) + "…"
}

export const googleSearch = (text: string) => openExternal("https://www.google.com/search?q=" + encodeURIComponent(text))

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

export function calculateItemSize(): Promise<number> {
    return new Promise((resolve, reject) => {
        let openRequest = window.indexedDB.open("NeDB")
        openRequest.onsuccess = () => {
            let db = openRequest.result
            let objectStore = db.transaction("nedbdata").objectStore("nedbdata")
            let getRequest = objectStore.get("items")
            getRequest.onsuccess = () => {
                let resultBuffer = Buffer.from(getRequest.result)
                resolve(resultBuffer.length)
            }
            getRequest.onerror = () => reject()
        }
        openRequest.onerror = () => reject()
    })
}