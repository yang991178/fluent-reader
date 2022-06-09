import * as React from "react"
import intl from "react-intl-universal"
import { renderToString } from "react-dom/server"
import { RSSItem } from "../scripts/models/item"
import {
    Stack,
    CommandBarButton,
    IContextualMenuProps,
    FocusZone,
    ContextualMenuItemType,
    Spinner,
    Icon,
    Link,
} from "@fluentui/react"
import {
    RSSSource,
    SourceOpenTarget,
    SourceTextDirection,
} from "../scripts/models/source"
import { shareSubmenu } from "./context-menu"
import { platformCtrl, decodeFetchResponse } from "../scripts/utils"

const FONT_SIZE_OPTIONS = [12, 13, 14, 15, 16, 17, 18, 19, 20]

type ArticleProps = {
    item: RSSItem
    source: RSSSource
    locale: string
    shortcuts: (item: RSSItem, e: KeyboardEvent) => void
    dismiss: () => void
    offsetItem: (offset: number) => void
    toggleHasRead: (item: RSSItem) => void
    toggleStarred: (item: RSSItem) => void
    toggleHidden: (item: RSSItem) => void
    textMenu: (position: [number, number], text: string, url: string) => void
    imageMenu: (position: [number, number]) => void
    dismissContextMenu: () => void
    updateSourceTextDirection: (
        source: RSSSource,
        direction: SourceTextDirection
    ) => void
}

type ArticleState = {
    fontFamily: string
    fontSize: number
    loadWebpage: boolean
    loadFull: boolean
    fullContent: string
    loaded: boolean
    error: boolean
    errorDescription: string
}

class Article extends React.Component<ArticleProps, ArticleState> {
    webview: Electron.WebviewTag

    constructor(props: ArticleProps) {
        super(props)
        this.state = {
            fontFamily: window.settings.getFont(),
            fontSize: window.settings.getFontSize(),
            loadWebpage: props.source.openTarget === SourceOpenTarget.Webpage,
            loadFull: props.source.openTarget === SourceOpenTarget.FullContent,
            fullContent: "",
            loaded: false,
            error: false,
            errorDescription: "",
        }
        window.utils.addWebviewContextListener(this.contextMenuHandler)
        window.utils.addWebviewKeydownListener(this.keyDownHandler)
        window.utils.addWebviewErrorListener(this.webviewError)
        if (props.source.openTarget === SourceOpenTarget.FullContent)
            this.loadFull()
    }

    setFontSize = (size: number) => {
        window.settings.setFontSize(size)
        this.setState({ fontSize: size })
    }
    setFont = (font: string) => {
        window.settings.setFont(font)
        this.setState({ fontFamily: font })
    }

    fontSizeMenuProps = (): IContextualMenuProps => ({
        items: FONT_SIZE_OPTIONS.map(size => ({
            key: String(size),
            text: String(size),
            canCheck: true,
            checked: size === this.state.fontSize,
            onClick: () => this.setFontSize(size),
        })),
    })

    fontFamilyMenuProps = (): IContextualMenuProps => ({
        items: window.fontList.map((font, idx) => ({
            key: String(idx),
            text: font === "" ? intl.get("default") : font,
            canCheck: true,
            checked: this.state.fontFamily === font,
            onClick: () => this.setFont(font),
        })),
    })

    updateTextDirection = (direction: SourceTextDirection) => {
        this.props.updateSourceTextDirection(this.props.source, direction)
    }

    directionMenuProps = (): IContextualMenuProps => ({
        items: [
            {
                key: "LTR",
                text: intl.get("article.LTR"),
                iconProps: { iconName: "Forward" },
                canCheck: true,
                checked: this.props.source.textDir === SourceTextDirection.LTR,
                onClick: () =>
                    this.updateTextDirection(SourceTextDirection.LTR),
            },
            {
                key: "RTL",
                text: intl.get("article.RTL"),
                iconProps: { iconName: "Back" },
                canCheck: true,
                checked: this.props.source.textDir === SourceTextDirection.RTL,
                onClick: () =>
                    this.updateTextDirection(SourceTextDirection.RTL),
            },
            {
                key: "Vertical",
                text: intl.get("article.Vertical"),
                iconProps: { iconName: "Down" },
                canCheck: true,
                checked:
                    this.props.source.textDir === SourceTextDirection.Vertical,
                onClick: () =>
                    this.updateTextDirection(SourceTextDirection.Vertical),
            },
        ],
    })

    moreMenuProps = (): IContextualMenuProps => ({
        items: [
            {
                key: "openInBrowser",
                text: intl.get("openExternal"),
                iconProps: { iconName: "NavigateExternalInline" },
                onClick: e => {
                    window.utils.openExternal(
                        this.props.item.link,
                        platformCtrl(e)
                    )
                },
            },
            {
                key: "copyURL",
                text: intl.get("context.copyURL"),
                iconProps: { iconName: "Link" },
                onClick: () => {
                    window.utils.writeClipboard(this.props.item.link)
                },
            },
            {
                key: "toggleHidden",
                text: this.props.item.hidden
                    ? intl.get("article.unhide")
                    : intl.get("article.hide"),
                iconProps: {
                    iconName: this.props.item.hidden ? "View" : "Hide3",
                },
                onClick: () => {
                    this.props.toggleHidden(this.props.item)
                },
            },
            {
                key: "fontMenu",
                text: intl.get("article.font"),
                iconProps: { iconName: "Font" },
                disabled: this.state.loadWebpage,
                subMenuProps: this.fontFamilyMenuProps(),
            },
            {
                key: "fontSizeMenu",
                text: intl.get("article.fontSize"),
                iconProps: { iconName: "FontSize" },
                disabled: this.state.loadWebpage,
                subMenuProps: this.fontSizeMenuProps(),
            },
            {
                key: "directionMenu",
                text: intl.get("article.textDir"),
                iconProps: { iconName: "ChangeEntitlements" },
                disabled: this.state.loadWebpage,
                subMenuProps: this.directionMenuProps(),
            },
            {
                key: "divider_1",
                itemType: ContextualMenuItemType.Divider,
            },
            ...shareSubmenu(this.props.item),
        ],
    })

    contextMenuHandler = (pos: [number, number], text: string, url: string) => {
        if (pos) {
            if (text || url) this.props.textMenu(pos, text, url)
            else this.props.imageMenu(pos)
        } else {
            this.props.dismissContextMenu()
        }
    }

    keyDownHandler = (input: Electron.Input) => {
        if (input.type === "keyDown") {
            switch (input.key) {
                case "Escape":
                    this.props.dismiss()
                    break
                case "ArrowLeft":
                case "ArrowRight":
                    this.props.offsetItem(input.key === "ArrowLeft" ? -1 : 1)
                    break
                case "l":
                case "L":
                    this.toggleWebpage()
                    break
                case "w":
                case "W":
                    this.toggleFull()
                    break
                case "H":
                case "h":
                    if (!input.meta) this.props.toggleHidden(this.props.item)
                    break
                default:
                    const keyboardEvent = new KeyboardEvent("keydown", {
                        code: input.code,
                        key: input.key,
                        shiftKey: input.shift,
                        altKey: input.alt,
                        ctrlKey: input.control,
                        metaKey: input.meta,
                        repeat: input.isAutoRepeat,
                        bubbles: true,
                    })
                    this.props.shortcuts(this.props.item, keyboardEvent)
                    document.dispatchEvent(keyboardEvent)
                    break
            }
        }
    }

    webviewLoaded = () => {
        this.setState({ loaded: true })
    }
    webviewError = (reason: string) => {
        this.setState({ error: true, errorDescription: reason })
    }
    webviewReload = () => {
        if (this.webview) {
            this.setState({ loaded: false, error: false })
            this.webview.reload()
        } else if (this.state.loadFull) {
            this.loadFull()
        }
    }

    componentDidMount = () => {
        let webview = document.getElementById("article") as Electron.WebviewTag
        if (webview != this.webview) {
            this.webview = webview
            if (webview) {
                webview.focus()
                this.setState({ loaded: false, error: false })
                webview.addEventListener("did-stop-loading", this.webviewLoaded)
                let card = document.querySelector(
                    `#refocus div[data-iid="${this.props.item._id}"]`
                ) as HTMLElement
                // @ts-ignore
                if (card) card.scrollIntoViewIfNeeded()
            }
        }
    }
    componentDidUpdate = (prevProps: ArticleProps) => {
        if (prevProps.item._id != this.props.item._id) {
            this.setState({
                loadWebpage:
                    this.props.source.openTarget === SourceOpenTarget.Webpage,
                loadFull:
                    this.props.source.openTarget ===
                    SourceOpenTarget.FullContent,
            })
            if (this.props.source.openTarget === SourceOpenTarget.FullContent)
                this.loadFull()
        }
        this.componentDidMount()
    }

    componentWillUnmount = () => {
        let refocus = document.querySelector(
            `#refocus div[data-iid="${this.props.item._id}"]`
        ) as HTMLElement
        if (refocus) refocus.focus()
    }

    toggleWebpage = () => {
        if (this.state.loadWebpage) {
            this.setState({ loadWebpage: false })
        } else if (
            this.props.item.link.startsWith("https://") ||
            this.props.item.link.startsWith("http://")
        ) {
            this.setState({ loadWebpage: true, loadFull: false })
        }
    }

    toggleFull = () => {
        if (this.state.loadFull) {
            this.setState({ loadFull: false })
        } else if (
            this.props.item.link.startsWith("https://") ||
            this.props.item.link.startsWith("http://")
        ) {
            this.setState({ loadFull: true, loadWebpage: false })
            this.loadFull()
        }
    }
    loadFull = async () => {
        this.setState({ fullContent: "", loaded: false, error: false })
        const link = this.props.item.link
        try {
            const result = await fetch(link)
            if (!result || !result.ok) throw new Error()
            const html = await decodeFetchResponse(result, true)
            if (link === this.props.item.link) {
                this.setState({ fullContent: html })
            }
        } catch {
            if (link === this.props.item.link) {
                this.setState({
                    loaded: true,
                    error: true,
                    errorDescription: "MERCURY_PARSER_FAILURE",
                })
            }
        }
    }

    articleView = () => {
        const a = encodeURIComponent(
            this.state.loadFull
                ? this.state.fullContent
                : this.props.item.content
        )
        const h = encodeURIComponent(
            renderToString(
                <>
                    <p className="title">{this.props.item.title}</p>
                    <p className="date">
                        {this.props.item.date.toLocaleString(
                            this.props.locale,
                            { hour12: !this.props.locale.startsWith("zh") }
                        )}
                    </p>
                    <article></article>
                </>
            )
        )
        return `article/article.html?a=${a}&h=${h}&f=${encodeURIComponent(
            this.state.fontFamily
        )}&s=${this.state.fontSize}&d=${this.props.source.textDir}&u=${
            this.props.item.link
        }&m=${this.state.loadFull ? 1 : 0}`
    }

    render = () => (
        <FocusZone className="article">
            <Stack horizontal style={{ height: 36 }}>
                <span style={{ width: 96 }}></span>
                <Stack
                    className="actions"
                    grow
                    horizontal
                    tokens={{ childrenGap: 12 }}>
                    <Stack.Item grow>
                        <span className="source-name">
                            {this.state.loaded ? (
                                this.props.source.iconurl && (
                                    <img
                                        className="favicon"
                                        src={this.props.source.iconurl}
                                    />
                                )
                            ) : (
                                <Spinner size={1} />
                            )}
                            {this.props.source.name}
                            {this.props.item.creator && (
                                <span className="creator">
                                    {this.props.item.creator}
                                </span>
                            )}
                        </span>
                    </Stack.Item>
                    <CommandBarButton
                        title={
                            this.props.item.hasRead
                                ? intl.get("article.markUnread")
                                : intl.get("article.markRead")
                        }
                        iconProps={
                            this.props.item.hasRead
                                ? { iconName: "StatusCircleRing" }
                                : {
                                      iconName: "RadioBtnOn",
                                      style: {
                                          fontSize: 14,
                                          textAlign: "center",
                                      },
                                  }
                        }
                        onClick={() =>
                            this.props.toggleHasRead(this.props.item)
                        }
                    />
                    <CommandBarButton
                        title={
                            this.props.item.starred
                                ? intl.get("article.unstar")
                                : intl.get("article.star")
                        }
                        iconProps={{
                            iconName: this.props.item.starred
                                ? "FavoriteStarFill"
                                : "FavoriteStar",
                        }}
                        onClick={() =>
                            this.props.toggleStarred(this.props.item)
                        }
                    />
                    <CommandBarButton
                        title={intl.get("article.loadFull")}
                        className={this.state.loadFull ? "active" : ""}
                        iconProps={{ iconName: "RawSource" }}
                        onClick={this.toggleFull}
                    />
                    <CommandBarButton
                        title={intl.get("article.loadWebpage")}
                        className={this.state.loadWebpage ? "active" : ""}
                        iconProps={{ iconName: "Globe" }}
                        onClick={this.toggleWebpage}
                    />
                    <CommandBarButton
                        title={intl.get("more")}
                        iconProps={{ iconName: "More" }}
                        menuIconProps={{ style: { display: "none" } }}
                        menuProps={this.moreMenuProps()}
                    />
                </Stack>
                <Stack horizontal horizontalAlign="end" style={{ width: 112 }}>
                    <CommandBarButton
                        title={intl.get("close")}
                        iconProps={{ iconName: "BackToWindow" }}
                        onClick={this.props.dismiss}
                    />
                </Stack>
            </Stack>
            {(!this.state.loadFull || this.state.fullContent) && (
                <webview
                    id="article"
                    className={this.state.error ? "error" : ""}
                    key={
                        this.props.item._id +
                        (this.state.loadWebpage ? "_" : "") +
                        (this.state.loadFull ? "__" : "")
                    }
                    src={
                        this.state.loadWebpage
                            ? this.props.item.link
                            : this.articleView()
                    }
                    allowpopups={"true" as unknown as boolean}
                    webpreferences="contextIsolation,disableDialogs,autoplayPolicy=document-user-activation-required"
                    partition={this.state.loadWebpage ? "sandbox" : undefined}
                />
            )}
            {this.state.error && (
                <Stack
                    className="error-prompt"
                    verticalAlign="center"
                    horizontalAlign="center"
                    tokens={{ childrenGap: 12 }}>
                    <Icon iconName="HeartBroken" style={{ fontSize: 32 }} />
                    <Stack
                        horizontal
                        horizontalAlign="center"
                        tokens={{ childrenGap: 7 }}>
                        <small>{intl.get("article.error")}</small>
                        <small>
                            <Link onClick={this.webviewReload}>
                                {intl.get("article.reload")}
                            </Link>
                        </small>
                    </Stack>
                    <span style={{ fontSize: 11 }}>
                        {this.state.errorDescription}
                    </span>
                </Stack>
            )}
        </FocusZone>
    )
}

export default Article
