import Store = require("electron-store")
import { getWebViewOpenUrlStatus } from "./settings"
import { BrowserWindow, WebContents } from "electron"

const cookieStore = new Store()
const COOKIES_KEY = "cookiesKey"
export async function saveCookies(webContents: WebContents) {
    console.log('save cookie')
    const currentSession = webContents.session
    await currentSession.cookies.flushStore()
    let cookies = await currentSession.cookies.get({})
    let customCookies = cookies.map(cookie => ({
        ...cookie,
        url:(cookie.secure ? 'https://' : 'http://') + cookie.domain.replace(/^\./, '') + cookie.path
    }))
    console.log('save cookie: ' + JSON.stringify(customCookies))
    cookieStore.set(COOKIES_KEY, customCookies)
}
export async function loadCookies(webContents: WebContents) {
    const savedCookies = cookieStore.get(COOKIES_KEY)
    cookieStore.get
    console.log('load cookie: ' + JSON.stringify(savedCookies))
    if (savedCookies && savedCookies.length > 0) {
        const currentSession = webContents.session
        savedCookies.forEach(cookie => {
            currentSession.cookies.set(cookie)
        })
    }
}