import * as React from "react"
import intl from "react-intl-universal"
import QRCode from "qrcode.react"
import { cutText, webSearch, getSearchEngineName, platformCtrl } from "../scripts/utils"
import { ContextualMenu, IContextualMenuItem, ContextualMenuItemType, DirectionalHint } from "office-ui-fabric-react/lib/ContextualMenu"
import { ContextMenuType } from "../scripts/models/app"
import { RSSItem } from "../scripts/models/item"
import { ContextReduxProps } from "../containers/context-menu-container"
import { ViewType, ImageCallbackTypes, ViewConfigs } from "../schema-types"
import { FilterType } from "../scripts/models/feed"

export type ContextMenuProps = ContextReduxProps & {
    type: ContextMenuType
    event?: MouseEvent | string
    position?: [number, number]
    item?: RSSItem
    feedId?: string
    text?: string
    url?: string
    viewType?: ViewType
    viewConfigs?: ViewConfigs
    filter?: FilterType
    sids?: number[]
    showItem: (feedId: string, item: RSSItem) => void
    markRead: (item: RSSItem) => void
    markUnread: (item: RSSItem) => void
    toggleStarred: (item: RSSItem) => void
    toggleHidden: (item: RSSItem) => void
    switchView: (viewType: ViewType) => void
    setViewConfigs: (configs: ViewConfigs) => void
    switchFilter: (filter: FilterType) => void
    toggleFilter: (filter: FilterType) => void
    markAllRead: (sids: number[], date?: Date, before?: boolean) => void
    fetchItems: (sids: number[]) => void
    settings: (sids: number[]) => void
    close: () => void
}

export const shareSubmenu = (item: RSSItem): IContextualMenuItem[] => [
    { key: "qr", url: item.link, onRender: renderShareQR }
]

export const renderShareQR = (item: IContextualMenuItem) => (
    <div className="qr-container">
        <QRCode
            value={item.url}
            size={150}
            renderAs="svg" />
    </div>
)

function getSearchItem(text: string): IContextualMenuItem {
    const engine = window.settings.getSearchEngine()
    return {
        key: "searchText",
        text: intl.get("context.search", {
            text: cutText(text, 15),
            engine: getSearchEngineName(engine)
        }),
        iconProps: { iconName: "Search" },
        onClick: () => webSearch(text, engine)
    }
}

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
                    onClick: (e) => {
                        this.props.markRead(this.props.item)
                        window.utils.openExternal(this.props.item.link, platformCtrl(e))
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
                },
                ...(this.props.viewConfigs !== undefined ? [
                    {
                        key: "divider_2",
                        itemType: ContextualMenuItemType.Divider,
                    },
                    {
                        key: "view",
                        text: intl.get("context.view"),
                        subMenuProps: {
                            items: [
                                {
                                    key: "showCover",
                                    text: intl.get("context.showCover"),
                                    canCheck: true,
                                    checked: Boolean(this.props.viewConfigs & ViewConfigs.ShowCover),
                                    onClick: () => this.props.setViewConfigs(this.props.viewConfigs ^ ViewConfigs.ShowCover)
                                },
                                {
                                    key: "showSnippet",
                                    text: intl.get("context.showSnippet"),
                                    canCheck: true,
                                    checked: Boolean(this.props.viewConfigs & ViewConfigs.ShowSnippet),
                                    onClick: () => this.props.setViewConfigs(this.props.viewConfigs ^ ViewConfigs.ShowSnippet)
                                },
                                {
                                    key: "fadeRead",
                                    text: intl.get("context.fadeRead"),
                                    canCheck: true,
                                    checked: Boolean(this.props.viewConfigs & ViewConfigs.FadeRead),
                                    onClick: () => this.props.setViewConfigs(this.props.viewConfigs ^ ViewConfigs.FadeRead)
                                }
                            ]
                        }
                    },
                ] : [])
            ]
            case ContextMenuType.Text: {
                const items: IContextualMenuItem[] = this.props.text? [
                    {
                        key: "copyText",
                        text: intl.get("context.copy"),
                        iconProps: { iconName: "Copy" },
                        onClick: () => { window.utils.writeClipboard(this.props.text) }
                    },
                    getSearchItem(this.props.text)
                ] : []
                if (this.props.url) {
                    items.push({
                        key: "urlSection",
                        itemType: ContextualMenuItemType.Section,
                        sectionProps: {
                            topDivider: items.length > 0,
                            items: [
                                {
                                    key: "openInBrowser",
                                    text: intl.get("openExternal"),
                                    iconProps: { iconName: "NavigateExternalInline" },
                                    onClick: (e) => { window.utils.openExternal(this.props.url, platformCtrl(e)) }
                                },
                                {
                                    key: "copyURL",
                                    text: intl.get("context.copyURL"),
                                    iconProps: { iconName: "Link" },
                                    onClick: () => { window.utils.writeClipboard(this.props.url) }
                                }
                            ]
                        }
                    })
                }
                return items
            }
            case ContextMenuType.Image: return [
                {
                    key: "openInBrowser",
                    text: intl.get("openExternal"),
                    iconProps: { iconName: "NavigateExternalInline" },
                    onClick: (e) => {
                        if (platformCtrl(e)) {
                            window.utils.imageCallback(ImageCallbackTypes.OpenExternalBg)
                        } else {
                            window.utils.imageCallback(ImageCallbackTypes.OpenExternal)
                        }
                    }
                },
                {
                    key: "saveImageAs",
                    text: intl.get("context.saveImageAs"),
                    iconProps: { iconName: "SaveTemplate" },
                    onClick: () => { window.utils.imageCallback(ImageCallbackTypes.SaveAs) }
                },
                {
                    key: "copyImage",
                    text: intl.get("context.copyImage"),
                    iconProps: { iconName: "FileImage" },
                    onClick: () => { window.utils.imageCallback(ImageCallbackTypes.Copy) }
                },
                {
                    key: "copyImageURL",
                    text: intl.get("context.copyImageURL"),
                    iconProps: { iconName: "Link" },
                    onClick: () => { window.utils.imageCallback(ImageCallbackTypes.CopyLink) }
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
                            {
                                key: "magazineView",
                                text: intl.get("context.magazineView"),
                                iconProps: { iconName: "Articles" },
                                canCheck: true,
                                checked: this.props.viewType === ViewType.Magazine,
                                onClick: () => this.props.switchView(ViewType.Magazine)
                            },
                            {
                                key: "compactView",
                                text: intl.get("context.compactView"),
                                iconProps: { iconName: "BulletedList" },
                                canCheck: true,
                                checked: this.props.viewType === ViewType.Compact,
                                onClick: () => this.props.switchView(ViewType.Compact)
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
                    key: "section_3",
                    itemType: ContextualMenuItemType.Section,
                    sectionProps: {
                        title: intl.get("search"),
                        bottomDivider: true,
                        items: [
                            {
                                key: "caseSensitive",
                                text: intl.get("context.caseSensitive"),
                                iconProps: { style: { fontSize: 12, fontStyle: "normal" }, children: "Aa" },
                                canCheck: true,
                                checked: !(this.props.filter & FilterType.CaseInsensitive),
                                onClick: () => this.props.toggleFilter(FilterType.CaseInsensitive)
                            },
                            {
                                key: "fullSearch",
                                text: intl.get("context.fullSearch"),
                                iconProps: { iconName: "Breadcrumb" },
                                canCheck: true,
                                checked: Boolean(this.props.filter & FilterType.FullSearch),
                                onClick: () => this.props.toggleFilter(FilterType.FullSearch)
                            },
                        ]
                    }
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
                    key: "refresh",
                    text: intl.get("nav.refresh"),
                    iconProps: { iconName: "Sync" },
                    onClick: () => this.props.fetchItems(this.props.sids)
                },
                {
                    key: "manage",
                    text: intl.get("context.manageSources"),
                    iconProps: { iconName: "Settings" },
                    onClick: () => this.props.settings(this.props.sids)
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