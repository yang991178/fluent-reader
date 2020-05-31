import { shell } from "electron"
import { ThunkAction } from "redux-thunk"
import { AnyAction } from "redux"
import { RootState } from "./reducer"

export enum ActionStatus {
    Request, Success, Failure
}

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  AnyAction
>

import Parser = require("rss-parser")
const customFields = {
    item: ["thumb", "image", ["content:encoded", "fullContent"]] as Parser.CustomFieldItem[]
}
export const rssParser = new Parser({
    customFields: customFields
})
import { HttpsProxyAgent } from "https-proxy-agent"
import url = require("url")
let agent = new HttpsProxyAgent(url.parse("http://127.0.0.1:1080"))
export const rssProxyParser = new Parser({
    customFields: customFields,
    requestOptions: {
        agent: agent
    }
})

export const domParser = new DOMParser()

const favicon = require("favicon")
export function faviconPromise(url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        favicon(url, (err, icon: string) => {
            if (err || !icon) reject(err)
            else {
                let parts = icon.split("//")
                resolve(parts[0] + "//" + parts[parts.length - 1])
            }
        })
    })
}

export function htmlDecode(input: string) {
    var doc = domParser.parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}

export function openExternal(url: string) {
    if (url.startsWith("https://") || url.startsWith("http://"))
        shell.openExternal(url)
}

export const urlTest = (s: string) => 
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi.test(s)