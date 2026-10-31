import { session } from "electron"
import type {
    BeforeSendResponse,
    OnBeforeSendHeadersListenerDetails,
} from "electron"

const videoExtension = /\.(webm|mp4|m4v|ogv|mov)(?:[?#]|$)/i

// Practical subset of public suffixes, enough to derive a registrable domain
// without bundling a full public suffix list.
const multipleLabelSuffixes = new Set([
    "co.uk",
    "org.uk",
    "ac.uk",
    "com.cn",
    "net.cn",
    "org.cn",
    "com.au",
    "net.au",
    "co.jp",
    "ne.jp",
    "com.br",
    "com.tw",
    "com.hk",
    "co.kr",
    "co.in",
    "com.ru",
])

const registrableDomain = (host: string) => {
    let parts = host.split(".")
    if (parts.length <= 2) return host
    let lastTwo = parts.slice(-2).join(".")
    return multipleLabelSuffixes.has(lastTwo)
        ? parts.slice(-3).join(".")
        : lastTwo
}

// Several feeds host media on a domain that rejects requests without a
// Referer (reactor.cc answers 404), while media loaded from the file:// app
// page sends none. Only media requests are considered, an existing Referer is
// never replaced, and nothing but the registrable domain is sent.
const addMediaReferer = (
    details: OnBeforeSendHeadersListenerDetails,
    callback: (response: BeforeSendResponse) => void
) => {
    let { requestHeaders, url, resourceType } = details
    let isMedia = resourceType === "media" || videoExtension.test(url || "")
    if (isMedia && !requestHeaders.Referer && !requestHeaders.referer) {
        try {
            requestHeaders.Referer =
                "https://" + registrableDomain(new URL(url).hostname) + "/"
        } catch {
            // Not an http(s) URL: leave the request untouched.
        }
    }
    callback({ requestHeaders })
}

export function setMediaRefererListeners() {
    // The article view runs in its own "sandbox" partition.
    for (let ses of [
        session.defaultSession,
        session.fromPartition("sandbox"),
    ]) {
        ses.webRequest.onBeforeSendHeaders(
            { urls: ["<all_urls>"] },
            addMediaReferer
        )
    }
}
