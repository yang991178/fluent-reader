import * as React from "react"
import { renderToString } from "react-dom/server"
import { RSSItem } from "../scripts/models/item"
import { openExternal } from "../scripts/utils"

type ArticleProps = {
    item: RSSItem
    dismiss: () => void
}

class Article extends React.Component<ArticleProps> {
    webview: HTMLWebViewElement

    constructor(props) {
        super(props)
    }

    ipcHandler = event => {
        if (event.channel === "request-navigation") {
            openExternal(event.args[0])
        }
    }

    componentDidMount = () => {
        this.webview = document.getElementById("article")
        this.webview.addEventListener("ipc-message", this.ipcHandler)
        this.webview.addEventListener("will-navigate", this.props.dismiss)
    }

    componentWillUnmount = () => {
        this.webview.removeEventListener("ipc-message", this.ipcHandler)
        this.webview.removeEventListener("will-navigate", this.props.dismiss)
    }

    articleView = () => "article/article.html?h=" + window.btoa(encodeURIComponent(renderToString(<>
        <p className="title">{this.props.item.title}</p>
        <article dangerouslySetInnerHTML={{__html: this.props.item.content}}></article>
    </>)))
    
    render = () => (
        <div className="article">
            <webview 
                id="article" 
                src={this.articleView()}
                preload="article/preload.js" />
        </div>
    )
}

export default Article