function get(name) {
    if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
}
document.documentElement.style.fontSize = get("s") + "px"
let html = get("h")
let domParser = new DOMParser()
let dom = domParser.parseFromString(html, "text/html")
let baseEl = dom.createElement('base')
baseEl.setAttribute('href', get("u").split("/").slice(0, 3).join("/"))
dom.head.append(baseEl)
for (let e of dom.querySelectorAll("*[src]")) {
    e.src = e.src
}
for (let s of dom.querySelectorAll("script")) {
    s.parentNode.removeChild(s)
}
let main = document.getElementById("main")
main.innerHTML = dom.body.innerHTML
