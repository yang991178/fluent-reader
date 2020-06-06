function get(name) {
    if (name = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search))
        return decodeURIComponent(name[1]);
}
let main = document.getElementById("main")
main.innerHTML = decodeURIComponent(window.atob(get("h")))
document.addEventListener("click", event => {
    event.preventDefault()
    if (event.target.href) ipcRenderer.sendToHost("request-navigation", event.target.href)
})