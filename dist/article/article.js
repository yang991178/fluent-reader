function get(name) {
    if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
}
document.documentElement.style.fontSize = get("s") + "px"
let html = decodeURIComponent(window.atob(get("h")))
let domParser = new DOMParser()
let dom = domParser.parseFromString(html, "text/html")
let baseEl = dom.createElement('base')
baseEl.setAttribute('href', get("u").split("/").slice(0, 3).join("/"))
dom.head.append(baseEl)
for (let i of dom.querySelectorAll("img")) {
    i.src = i.src
}
for (let s of dom.querySelectorAll("script")) {
    s.parentNode.removeChild(s)
}
let main = document.getElementById("main")
main.innerHTML = dom.body.innerHTML

let contextOn = false
const dismissListener = () => {
    if (contextOn) {
        contextOn = false
        window.renderer.dismissContextMenu()
    }
}
document.addEventListener("mousedown", dismissListener)
document.addEventListener("scroll", dismissListener)
document.addEventListener("contextmenu", event => {
    let text = document.getSelection().toString()
    if (text) {
        contextOn = true
        window.renderer.contextMenu([event.clientX, event.clientY], text)
    }
})