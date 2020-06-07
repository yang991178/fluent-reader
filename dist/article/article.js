function get(name) {
    if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
}
document.documentElement.style.fontSize = get("s") + "px"
let main = document.getElementById("main")
main.innerHTML = decodeURIComponent(window.atob(get("h")))
document.addEventListener("click", event => {
    event.preventDefault()
    if (event.target.href) post("request-navigation", event.target.href)
})