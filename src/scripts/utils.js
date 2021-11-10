"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTouchBarWithTexts = exports.platformCtrl = exports.validateRegex = exports.calculateItemSize = exports.byteToMB = exports.mergeSortedArrays = exports.webSearch = exports.getSearchEngineName = exports.cutText = exports.getWindowBreakpoint = exports.urlTest = exports.htmlDecode = exports.validateFavicon = exports.fetchFavicon = exports.domParser = exports.parseRSS = exports.decodeFetchResponse = exports.ActionStatus = void 0;
const react_intl_universal_1 = __importDefault(require("react-intl-universal"));
const rss_parser_1 = __importDefault(require("@yang991178/rss-parser"));
const url_1 = __importDefault(require("url"));
var ActionStatus;
(function (ActionStatus) {
    ActionStatus[ActionStatus["Request"] = 0] = "Request";
    ActionStatus[ActionStatus["Success"] = 1] = "Success";
    ActionStatus[ActionStatus["Failure"] = 2] = "Failure";
    ActionStatus[ActionStatus["Intermediate"] = 3] = "Intermediate";
})(ActionStatus = exports.ActionStatus || (exports.ActionStatus = {}));
const rssParser = new rss_parser_1.default({
    customFields: {
        item: [
            "thumb",
            "image",
            ["content:encoded", "fullContent"],
            ["media:content", "mediaContent", { keepArray: true }],
        ],
    },
});
const CHARSET_RE = /charset=([^()<>@,;:\"/[\]?.=\s]*)/i;
const XML_ENCODING_RE = /^<\?xml.+encoding="(.+?)".*?\?>/i;
async function decodeFetchResponse(response, isHTML = false) {
    var _a, _b, _c;
    const buffer = await response.arrayBuffer();
    let ctype = response.headers.has("content-type") &&
        response.headers.get("content-type");
    let charset = ctype && CHARSET_RE.test(ctype) ? CHARSET_RE.exec(ctype)[1] : undefined;
    let content = new TextDecoder(charset).decode(buffer);
    if (charset === undefined) {
        if (isHTML) {
            const dom = exports.domParser.parseFromString(content, "text/html");
            charset = (_b = (_a = dom
                .querySelector("meta[charset]")) === null || _a === void 0 ? void 0 : _a.getAttribute("charset")) === null || _b === void 0 ? void 0 : _b.toLowerCase();
            if (!charset) {
                ctype = (_c = dom
                    .querySelector("meta[http-equiv='Content-Type']")) === null || _c === void 0 ? void 0 : _c.getAttribute("content");
                charset =
                    ctype &&
                        CHARSET_RE.test(ctype) &&
                        CHARSET_RE.exec(ctype)[1].toLowerCase();
            }
        }
        else {
            charset =
                XML_ENCODING_RE.test(content) &&
                    XML_ENCODING_RE.exec(content)[1].toLowerCase();
        }
        if (charset && charset !== "utf-8" && charset !== "utf8") {
            content = new TextDecoder(charset).decode(buffer);
        }
    }
    return content;
}
exports.decodeFetchResponse = decodeFetchResponse;
async function parseRSS(url) {
    let result;
    try {
        result = await fetch(url, { credentials: "omit" });
    }
    catch {
        throw new Error(react_intl_universal_1.default.get("log.networkError"));
    }
    if (result && result.ok) {
        try {
            return await rssParser.parseString(await decodeFetchResponse(result));
        }
        catch {
            throw new Error(react_intl_universal_1.default.get("log.parseError"));
        }
    }
    else {
        throw new Error(result.status + " " + result.statusText);
    }
}
exports.parseRSS = parseRSS;
exports.domParser = new DOMParser();
async function fetchFavicon(url) {
    try {
        url = url.split("/").slice(0, 3).join("/");
        let result = await fetch(url, { credentials: "omit" });
        if (result.ok) {
            let html = await result.text();
            let dom = exports.domParser.parseFromString(html, "text/html");
            let links = dom.getElementsByTagName("link");
            for (let link of links) {
                let rel = link.getAttribute("rel");
                if ((rel === "icon" || rel === "shortcut icon") &&
                    link.hasAttribute("href")) {
                    let href = link.getAttribute("href");
                    let parsedUrl = url_1.default.parse(url);
                    if (href.startsWith("//"))
                        return parsedUrl.protocol + href;
                    else if (href.startsWith("/"))
                        return url + href;
                    else
                        return href;
                }
            }
        }
        url = url + "/favicon.ico";
        if (await validateFavicon(url)) {
            return url;
        }
        else {
            return null;
        }
    }
    catch {
        return null;
    }
}
exports.fetchFavicon = fetchFavicon;
async function validateFavicon(url) {
    let flag = false;
    try {
        const result = await fetch(url, { credentials: "omit" });
        if (result.status == 200 &&
            result.headers.has("Content-Type") &&
            result.headers.get("Content-Type").startsWith("image")) {
            flag = true;
        }
    }
    finally {
        return flag;
    }
}
exports.validateFavicon = validateFavicon;
function htmlDecode(input) {
    var doc = exports.domParser.parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}
exports.htmlDecode = htmlDecode;
const urlTest = (s) => /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,63}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi.test(s);
exports.urlTest = urlTest;
const getWindowBreakpoint = () => window.outerWidth >= 1440;
exports.getWindowBreakpoint = getWindowBreakpoint;
const cutText = (s, length) => {
    return s.length <= length ? s : s.slice(0, length) + "…";
};
exports.cutText = cutText;
function getSearchEngineName(engine) {
    switch (engine) {
        case 0 /* Google */:
            return react_intl_universal_1.default.get("searchEngine.google");
        case 1 /* Bing */:
            return react_intl_universal_1.default.get("searchEngine.bing");
        case 2 /* Baidu */:
            return react_intl_universal_1.default.get("searchEngine.baidu");
        case 3 /* DuckDuckGo */:
            return react_intl_universal_1.default.get("searchEngine.duckduckgo");
    }
}
exports.getSearchEngineName = getSearchEngineName;
function webSearch(text, engine = 0 /* Google */) {
    switch (engine) {
        case 0 /* Google */:
            return window.utils.openExternal("https://www.google.com/search?q=" + encodeURIComponent(text));
        case 1 /* Bing */:
            return window.utils.openExternal("https://www.bing.com/search?q=" + encodeURIComponent(text));
        case 2 /* Baidu */:
            return window.utils.openExternal("https://www.baidu.com/s?wd=" + encodeURIComponent(text));
        case 3 /* DuckDuckGo */:
            return window.utils.openExternal("https://duckduckgo.com/?q=" + encodeURIComponent(text));
    }
}
exports.webSearch = webSearch;
function mergeSortedArrays(a, b, cmp) {
    let merged = new Array();
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
        if (cmp(a[i], b[j]) <= 0) {
            merged.push(a[i++]);
        }
        else {
            merged.push(b[j++]);
        }
    }
    while (i < a.length)
        merged.push(a[i++]);
    while (j < b.length)
        merged.push(b[j++]);
    return merged;
}
exports.mergeSortedArrays = mergeSortedArrays;
function byteToMB(B) {
    let MB = Math.round(B / 1048576);
    return MB + "MB";
}
exports.byteToMB = byteToMB;
function byteLength(str) {
    var s = str.length;
    for (var i = str.length - 1; i >= 0; i--) {
        var code = str.charCodeAt(i);
        if (code > 0x7f && code <= 0x7ff)
            s++;
        else if (code > 0x7ff && code <= 0xffff)
            s += 2;
        if (code >= 0xdc00 && code <= 0xdfff)
            i--; //trail surrogate
    }
    return s;
}
function calculateItemSize() {
    return new Promise((resolve, reject) => {
        let result = 0;
        let openRequest = window.indexedDB.open("itemsDB");
        openRequest.onsuccess = () => {
            let db = openRequest.result;
            let objectStore = db.transaction("items").objectStore("items");
            let cursorRequest = objectStore.openCursor();
            cursorRequest.onsuccess = () => {
                let cursor = cursorRequest.result;
                if (cursor) {
                    result += byteLength(JSON.stringify(cursor.value));
                    cursor.continue();
                }
                else {
                    resolve(result);
                }
            };
            cursorRequest.onerror = () => reject();
        };
        openRequest.onerror = () => reject();
    });
}
exports.calculateItemSize = calculateItemSize;
function validateRegex(regex, flags = "") {
    try {
        return new RegExp(regex, flags);
    }
    catch {
        return null;
    }
}
exports.validateRegex = validateRegex;
function platformCtrl(e) {
    return window.utils.platform === "darwin" ? e.metaKey : e.ctrlKey;
}
exports.platformCtrl = platformCtrl;
function initTouchBarWithTexts() {
    window.utils.initTouchBar({
        menu: react_intl_universal_1.default.get("nav.menu"),
        search: react_intl_universal_1.default.get("search"),
        refresh: react_intl_universal_1.default.get("nav.refresh"),
        markAll: react_intl_universal_1.default.get("nav.markAllRead"),
        notifications: react_intl_universal_1.default.get("nav.notifications"),
    });
}
exports.initTouchBarWithTexts = initTouchBarWithTexts;
