import * as React from "react"
import intl from "react-intl-universal"
import QRCode from "qrcode.react"
import { cutText, googleSearch } from "../scripts/utils"
import { ContextualMenu, IContextualMenuItem, ContextualMenuItemType, DirectionalHint } from "office-ui-fabric-react/lib/ContextualMenu"
import { ContextMenuType } from "../scripts/models/app"
import { RSSItem } from "../scripts/models/item"
import { ContextReduxProps } from "../containers/context-menu-container"
import { ViewType } from "../schema-types"
import { FilterType } from "../scripts/models/feed"

export type ContextMenuProps = ContextReduxProps & {
    type: ContextMenuType
    event?: MouseEvent | string
    position?: [number, number]
    item?: RSSItem
    feedId?: string
    text?: string
    viewType?: ViewType
    filter?: FilterType
    sids?: number[]
    showItem: (feedId: string, item: RSSItem) => void
    markRead: (item: RSSItem) => void
    markUnread: (item: RSSItem) => void
    toggleStarred: (item: RSSItem) => void
    toggleHidden: (item: RSSItem) => void
    switchView: (viewType: ViewType) => void
    switchFilter: (filter: FilterType) => void
    toggleFilter: (filter: FilterType) => void
    markAllRead: (sids: number[], date?: Date, before?: boolean) =>  void
    settings: () => void
    close: () => void
}

export const shareSubmenu = (item: RSSItem): IContextualMenuItem[] => [
    { key: "qr", url: item.link, onRender: renderShareQR }
]

const renderShareQR = (item: IContextualMenuItem) => (
    <div className="qr-container">
        <QRCode
            value={item.url}
            size={150}
            renderAs="svg" />
    </div>
)

export class ContextMenu extends React.Component<ContextMenuProps> {
    getItems = (): IContextualMenuItem[] => {
        switch (this.props.type) {
            case ContextMenuType.Item: return [
                {
                    key: "showItem",
                    text: intl.get("context.read"),
                    iconProps: { iconName: "TextDocument" },
                    onClick: () => {
                        this.props.markRead(this.props.item)
                        this.props.showItem(this.props.feedId, this.props.item)
                    }
                },
                {
                    key: "openInBrowser",
                    text: intl.get("openExternal"),
                    iconProps: { iconName: "NavigateExternalInline" },
                    onClick: () => {
                        this.props.markRead(this.props.item)
                        window.utils.openExternal(this.props.item.link)
                    }
                },
                {
                    key: "markAsRead",
                    text: this.props.item.hasRead ? intl.get("article.markUnread") : intl.get("article.markRead"),
                    iconProps: this.props.item.hasRead 
                        ? { iconName: "RadioBtnOn", style: { fontSize: 14, textAlign: "center" } }
                        : { iconName: "StatusCircleRing" },
                    onClick: () => { 
                        if (this.props.item.hasRead) this.props.markUnread(this.props.item) 
                        else this.props.markRead(this.props.item)
                    },
                    split: true,
                    subMenuProps: {
                        items: [
                            { 
                                key: "markBelow", 
                                text: intl.get("article.markBelow"),
                                iconProps: { iconName: "Down", style: { fontSize: 14 } },
                                onClick: () => this.props.markAllRead(null, this.props.item.date)
                            },
                            { 
                                key: "markAbove", 
                                text: intl.get("article.markAbove"),
                                iconProps: { iconName: "Up", style: { fontSize: 14 } },
                                onClick: () => this.props.markAllRead(null, this.props.item.date, false)
                            }
                        ]
                    }
                },
                {
                    key: "toggleStarred",
                    text:　this.props.item.starred ? intl.get("article.unstar") : intl.get("article.star"),
                    iconProps: { iconName: this.props.item.starred ? "FavoriteStar" : "FavoriteStarFill" },
                    onClick: () => { this.props.toggleStarred(this.props.item) }
                },
                {
                    key: "toggleHidden",
                    text:　this.props.item.hidden ? intl.get("article.unhide") : intl.get("article.hide"),
                    iconProps: { iconName: this.props.item.hidden ? "View" : "Hide3" },
                    onClick: () => { this.props.toggleHidden(this.props.item) }
                },
                {
                    key: "divider_1",
                    itemType: ContextualMenuItemType.Divider,
                },
                {
                    key: "share",
                    text: intl.get("context.share"),
                    iconProps: { iconName: "Share" },
                    subMenuProps: {
                        items: shareSubmenu(this.props.item)
                    }
                },
                {
                    key: "copyTitle",
                    text: intl.get("context.copyTitle"),
                    onClick: () => { window.utils.writeClipboard(this.props.item.title) }
                },
                {
                    key: "copyURL",
                    text: intl.get("context.copyURL"),
                    onClick: () => { window.utils.writeClipboard(this.props.item.link) }
                }
            ]
            case ContextMenuType.Text: return [
                {
                    key: "copyText",
                    text: intl.get("context.copy"),
                    iconProps: { iconName: "Copy" },
                    onClick: () => { window.utils.writeClipboard(this.props.text) }
                },
                {
                    key: "searchText",
                    text: intl.get("context.search", { text: cutText(this.props.text, 15) }),
                    iconProps: { iconName: "Search" },
                    onClick: () => { googleSearch(this.props.text) }
                }
            ]
            case ContextMenuType.View: return [
                {
                    key: "section_1",
                    itemType: ContextualMenuItemType.Section,
                    sectionProps: {
                        title: intl.get("context.view"),
                        bottomDivider: true,
                        items: [
                            {
                                key: "cardView",
                                text: intl.get("context.cardView"),
                                iconProps: { iconName: "GridViewMedium" },
                                canCheck: true,
                                checked: this.props.viewType === ViewType.Cards,
                                onClick: () => this.props.switchView(ViewType.Cards)
                            },
                            {
                                key: "listView",
                                text: intl.get("context.listView"),
                                iconProps: { iconName: "BacklogList" },
                                canCheck: true,
                                checked: this.props.viewType === ViewType.List,
                                onClick: () => this.props.switchView(ViewType.List)
                            },
                        ]
                    }
                },
                {
                    key: "section_2",
                    itemType: ContextualMenuItemType.Section,
                    sectionProps: {
                        title: intl.get("context.filter"),
                        bottomDivider: true,
                        items: [
                            {
                                key: "allArticles",
                                text: intl.get("allArticles"),
                                iconProps: { iconName: "ClearFilter" },
                                canCheck: true,
                                checked: (this.props.filter & ~FilterType.Toggles) == FilterType.Default,
                                onClick: () => this.props.switchFilter(FilterType.Default)
                            },
                            {
                                key: "unreadOnly",
                                text: intl.get("context.unreadOnly"),
                                iconProps: { iconName: "RadioBtnOn", style: { fontSize: 14, textAlign: "center" } },
                                canCheck: true,
                                checked: (this.props.filter & ~FilterType.Toggles) == FilterType.UnreadOnly,
                                onClick: () => this.props.switchFilter(FilterType.UnreadOnly)
                            },
                            {
                                key: "starredOnly",
                                text: intl.get("context.starredOnly"),
                                iconProps: { iconName: "FavoriteStarFill" },
                                canCheck: true,
                                checked: (this.props.filter & ~FilterType.Toggles) == FilterType.StarredOnly,
                                onClick: () => this.props.switchFilter(FilterType.StarredOnly)
                            }
                        ]
                    }
                },
                {
                    key: "fullSearch",
                    text: intl.get("context.fullSearch"),
                    canCheck: true,
                    checked: Boolean(this.props.filter & FilterType.FullSearch),
                    onClick: () => this.props.toggleFilter(FilterType.FullSearch)
                },
                {
                    key: "showHidden",
                    text: intl.get("context.showHidden"),
                    canCheck: true,
                    checked: Boolean(this.props.filter & FilterType.ShowHidden),
                    onClick: () => this.props.toggleFilter(FilterType.ShowHidden)
                }
            ]
            case ContextMenuType.Group: return [
                {
                    key: "markAllRead",
                    text: intl.get("nav.markAllRead"),
                    iconProps: { iconName: "CheckMark" },
                    onClick: () => this.props.markAllRead(this.props.sids)
                },
                {
                    key: "manage",
                    text: intl.get("context.manageSources"),
                    iconProps: { iconName: "Settings" },
                    onClick: this.props.settings
                }
            ]
            default: return []
        }
    }

    render() {
        return this.props.type == ContextMenuType.Hidden ? null : (
            <ContextualMenu 
                directionalHint={DirectionalHint.bottomLeftEdge}
                items={this.getItems()} 
                target={this.props.event || this.props.position && {left: this.props.position[0], top: this.props.position[1]}}
                onDismiss={this.props.close} />
        )
    }
}