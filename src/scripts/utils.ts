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
const customFields = {
    item: ["thumb", "image", ["content:encoded", "fullContent"]] as Parser.CustomFieldItem[]
}

const PAC_STORE_KEY = "PAC"
const PAC_STATUS_KEY = "PAC_ON"
export function getProxyStatus() {
    return Boolean(localStorage.getItem(PAC_STATUS_KEY))
}
export function toggleProxyStatus() {
    localStorage.setItem(PAC_STATUS_KEY, getProxyStatus() ? "" : "on")
    setProxy()
}
export function getProxy() {
    return localStorage.getItem(PAC_STORE_KEY) || ""
}
export function setProxy(address = null) {
    if (!address) {
        address = getProxy()
    } else {
        localStorage.setItem(PAC_STORE_KEY, address)
    }
    remote.getCurrentWebContents().session.setProxy({
        pacScript: getProxyStatus() ? address : ""
    })
}

import ElectronProxyAgent = require("@yang991178/electron-proxy-agent")
let agent = new ElectronProxyAgent(remote.getCurrentWebContents().session)
export const rssParser = new Parser({
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
            if (err) reject(err)
            else if (!icon) resolve(icon)
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

export const getWindowBreakpoint = () => remote.getCurrentWindow().getSize()[0] >= 1441