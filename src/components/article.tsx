import * as React from "react"
import intl = require("react-intl-universal")
import { renderToString } from "react-dom/server"
import { RSSItem } from "../scripts/models/item"
import { openExternal } from "../scripts/utils"
import { Stack, CommandBarButton, IContextualMenuProps } from "@fluentui/react"
import { RSSSource, SourceOpenTarget } from "../scripts/models/source"

const FONT_SIZE_STORE_KEY = "fontSize"
const FONT_SIZE_OPTIONS = [12, 13, 14, 15, 16, 17, 18, 19, 20]

type ArticleProps = {
    item: RSSItem
    source: RSSSource
    locale: string
    dismiss: () => void
    toggleHasRead: (item: RSSItem) => void
    toggleStarred: (item: RSSItem) => void
    toggleHidden: (item: RSSItem) => void
    textMenu: (text: string, position: [number, number]) => void
}

type ArticleState = {
    fontSize: number
    loadWebpage: boolean
}

class Article extends React.Component<ArticleProps, ArticleState> {
    webview: HTMLWebViewElement
    
    constructor(props) {
        super(props)
        this.state = {
            fontSize: this.getFontSize(),
            loadWebpage: this.props.source.openTarget === SourceOpenTarget.Webpage
        }
    }

    getFontSize = () => {
        let size = window.localStorage.getItem(FONT_SIZE_STORE_KEY)
        return size ? parseInt(size) : 16
    }
    setFontSize = (size: number) => {
        window.localStorage.setItem(FONT_SIZE_STORE_KEY, String(size))
        this.setState({fontSize: size})
    }

    fontMenuProps = (): IContextualMenuProps => ({
        items: FONT_SIZE_OPTIONS.map(size => ({
            key: String(size),
            text: String(size),
            canCheck: true,
            checked: size === this.state.fontSize,
            onClick: () => this.setFontSize(size)
        }))
    })

    moreMenuProps = (): IContextualMenuProps => ({
        items: [
            {
                key: "openInBrowser",
                text: intl.get("openExternal"),
                iconProps: {iconName: "NavigateExternalInline"},
                onClick: this.openInBrowser
            },
            {
                key: "toggleHidden",
                text:　this.props.item.hidden ? intl.get("article.unhide") : intl.get("article.hide"),
                onClick: () => { this.props.toggleHidden(this.props.item) }
            }
        ]
    })

    ipcHandler = event => {
        switch (event.channel) {
            case "request-navigation": {
                openExternal(event.args[0])
                break
            }
            case "context-menu": {
                let articlePos = document.getElementById("article").getBoundingClientRect()
                let [x, y] = event.args[0]
                this.props.textMenu(event.args[1], [x + articlePos.x, y + articlePos.y])
                break
            }
        }
    }
    popUpHandler = event => {
        openExternal(event.url)
    }
    navigationHandler = event => {
        openExternal(event.url)
        this.props.dismiss()
    }

    componentDidMount = () => {
        let webview = document.getElementById("article")
        if (webview != this.webview) {
            if (this.webview) this.componentWillUnmount()
            webview.addEventListener("ipc-message", this.ipcHandler)
            webview.addEventListener("new-window", this.popUpHandler)
            webview.addEventListener("will-navigate", this.navigationHandler)
            this.webview = webview
        }
    }
    componentDidUpdate = (prevProps: ArticleProps) => {
        if (prevProps.item._id != this.props.item._id) {
            this.setState({loadWebpage: this.props.source.openTarget === SourceOpenTarget.Webpage})
        }
        this.componentDidMount()
    }

    componentWillUnmount = () => {
        this.webview.removeEventListener("ipc-message", this.ipcHandler)
        this.webview.removeEventListener("new-window", this.popUpHandler)
        this.webview.removeEventListener("will-navigate", this.navigationHandler)
    }

    openInBrowser = () => {
        openExternal(this.props.item.link)
    }

    toggleWebpage = () => {
        if (this.state.loadWebpage) {
            this.setState({loadWebpage: false})
        } else if (this.props.item.link.startsWith("https://") || this.props.item.link.startsWith("http://")) {
            this.setState({loadWebpage: true})
        }
    }

    articleView = () => "article/article.html?h=" + window.btoa(encodeURIComponent(renderToString(<>
        <p className="title">{this.props.item.title}</p>
        <p className="date">{this.props.item.date.toLocaleString(this.props.locale, {hour12: !this.props.locale.startsWith("zh")})}</p>
        <article dangerouslySetInnerHTML={{__html: this.props.item.content}}></article>
    </>))) + `&s=${this.state.fontSize}&u=${this.props.item.link}&d=${Number(document.body.classList.contains("dark"))}`
    
    render = () => (
        <div className="article">
            <Stack horizontal style={{height: 36}}>
                <span style={{width: 96}}></span>
                <Stack className="actions" grow horizontal tokens={{childrenGap: 12}}>
                    <Stack.Item grow>
                        <span className="source-name">
                            {this.props.source.iconurl && <img className="favicon" src={this.props.source.iconurl} />}
                            {this.props.source.name}
                        </span>
                    </Stack.Item>
                    <CommandBarButton
                        title={this.props.item.hasRead ? intl.get("article.markUnread") : intl.get("article.markRead")}
                        iconProps={this.props.item.hasRead 
                            ? {iconName: "StatusCircleRing"}
                            : {iconName: "RadioBtnOn", style: {fontSize: 14, textAlign: "center"}}}
                        onClick={() => this.props.toggleHasRead(this.props.item)} />
                    <CommandBarButton
                        title={this.props.item.starred ? intl.get("article.unstar") : intl.get("article.star")}
                        iconProps={{iconName: this.props.item.starred ? "FavoriteStarFill" : "FavoriteStar"}}
                        onClick={() => this.props.toggleStarred(this.props.item)} />
                    <CommandBarButton
                        title={intl.get("article.fontSize")}
                        disabled={this.state.loadWebpage}
                        iconProps={{iconName: "FontSize"}}
                        menuIconProps={{style: {display: "none"}}}
                        menuProps={this.fontMenuProps()} />
                    <CommandBarButton
                        title={intl.get("article.loadWebpage")}
                        className={this.state.loadWebpage ? "active" : ""}
                        iconProps={{iconName: "Globe"}} 
                        onClick={this.toggleWebpage} />
                    <CommandBarButton
                        title={intl.get("more")}
                        iconProps={{iconName: "More"}}
                        menuIconProps={{style: {display: "none"}}}
                        menuProps={this.moreMenuProps()} />
                </Stack>
                <Stack horizontal horizontalAlign="end" style={{width: 112}}>
                    <CommandBarButton
                        title={intl.get("close")}
                        iconProps={{iconName: "BackToWindow"}}
                        onClick={this.props.dismiss} />
                </Stack>  
            </Stack>
            <webview 
                id="article"
                key={this.props.item._id + (this.state.loadWebpage ? "_" : "")}
                src={this.state.loadWebpage ? this.props.item.link : this.articleView()}
                preload={this.state.loadWebpage ? null : "article/preload.js"}
                partition="sandbox" />
        </div>
    )
}

export default Article