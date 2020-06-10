import * as React from "react"
import { clipboard } from "electron"
import { openExternal, cutText, googleSearch } from "../scripts/utils"
import { ContextualMenu, IContextualMenuItem, ContextualMenuItemType, DirectionalHint } from "office-ui-fabric-react/lib/ContextualMenu"
import { ContextMenuType } from "../scripts/models/app"
import { RSSItem } from "../scripts/models/item"
import { ContextReduxProps } from "../containers/context-menu-container"
import { ViewType } from "../scripts/models/page"
import { FeedFilter } from "../scripts/models/feed"

export type ContextMenuProps = ContextReduxProps & {
    type: ContextMenuType
    event?: MouseEvent | string
    position?: [number, number]
    item?: RSSItem
    feedId?: string
    text?: string
    viewType?: ViewType
    filter?: FeedFilter
    showItem: (feedId: string, item: RSSItem) => void
    markRead: (item: RSSItem) => void
    markUnread: (item: RSSItem) => void
    toggleStarred: (item: RSSItem) => void
    toggleHidden: (item: RSSItem) => void
    switchView: (viewType: ViewType) => void
    switchFilter: (filter: FeedFilter) => void
    toggleFilter: (filter: FeedFilter) => void
    close: () => void
}

export class ContextMenu extends React.Component<ContextMenuProps> {
    getItems = (): IContextualMenuItem[] => {
        switch (this.props.type) {
            case ContextMenuType.Item: return [
                {
                    key: "showItem",
                    text: "阅读",
                    iconProps: { iconName: "TextDocument" },
                    onClick: () => {
                        this.props.markRead(this.props.item)
                        this.props.showItem(this.props.feedId, this.props.item)
                    }
                },
                {
                    key: "openInBrowser",
                    text: "在浏览器中打开",
                    iconProps: { iconName: "NavigateExternalInline" },
                    onClick: () => {
                        this.props.markRead(this.props.item)
                        openExternal(this.props.item.link)
                    }
                },
                this.props.item.hasRead
                ? {
                    key: "markAsUnread",
                    text: "标为未读",
                    iconProps: { iconName: "RadioBtnOn", style: { fontSize: 14, textAlign: "center" } },
                    onClick: () => { this.props.markUnread(this.props.item) }
                }
                : {
                    key: "markAsRead",
                    text: "标为已读",
                    iconProps: { iconName: "StatusCircleRing" },
                    onClick: () => { this.props.markRead(this.props.item) }
                },
                {
                    key: "toggleStarred",
                    text:　this.props.item.starred ? "取消星标" : "标为星标",
                    iconProps: { iconName: this.props.item.starred ? "FavoriteStar" : "FavoriteStarFill" },
                    onClick: () => { this.props.toggleStarred(this.props.item) }
                },
                {
                    key: "toggleHidden",
                    text:　this.props.item.hidden ? "取消隐藏" : "隐藏文章",
                    onClick: () => { this.props.toggleHidden(this.props.item) }
                },
                {
                    key: "divider_1",
                    itemType: ContextualMenuItemType.Divider,
                },
                {
                    key: "copyTitle",
                    text: "复制标题",
                    onClick: () => { clipboard.writeText(this.props.item.title) }
                },
                {
                    key: "copyURL",
                    text: "复制链接",
                    onClick: () => { clipboard.writeText(this.props.item.link) }
                }
            ]
            case ContextMenuType.Text: return [
                {
                    key: "copyText",
                    text: "复制",
                    iconProps: { iconName: "Copy" },
                    onClick: () => { clipboard.writeText(this.props.text) }
                },
                {
                    key: "searchText",
                    text: `使用Google搜索“${cutText(this.props.text, 15)}”`,
                    iconProps: { iconName: "Search" },
                    onClick: () => { googleSearch(this.props.text) }
                }
            ]
            case ContextMenuType.View: return [
                {
                    key: "section_1",
                    itemType: ContextualMenuItemType.Section,
                    sectionProps: {
                        title: "视图",
                        bottomDivider: true,
                        items: [
                            {
                                key: "cardView",
                                text: "卡片视图",
                                iconProps: { iconName: "GridViewMedium" },
                                canCheck: true,
                                checked: this.props.viewType === ViewType.Cards,
                                onClick: () => this.props.switchView(ViewType.Cards)
                            },
                            {
                                key: "listView",
                                text: "列表视图",
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
                        title: "筛选",
                        bottomDivider: true,
                        items: [
                            {
                                key: "allArticles",
                                text: "全部文章",
                                iconProps: { iconName: "ClearFilter" },
                                canCheck: true,
                                checked: (this.props.filter & ~FeedFilter.ShowHidden) == FeedFilter.Default,
                                onClick: () => this.props.switchFilter(FeedFilter.Default)
                            },
                            {
                                key: "unreadOnly",
                                text: "仅未读文章",
                                iconProps: { iconName: "RadioBtnOn", style: { fontSize: 14, textAlign: "center" } },
                                canCheck: true,
                                checked: (this.props.filter & ~FeedFilter.ShowHidden) == FeedFilter.UnreadOnly,
                                onClick: () => this.props.switchFilter(FeedFilter.UnreadOnly)
                            },
                            {
                                key: "starredOnly",
                                text: "仅星标文章",
                                iconProps: { iconName: "FavoriteStarFill" },
                                canCheck: true,
                                checked: (this.props.filter & ~FeedFilter.ShowHidden) == FeedFilter.StarredOnly,
                                onClick: () => this.props.switchFilter(FeedFilter.StarredOnly)
                            }
                        ]
                    }
                },
                {
                    key: "showHidden",
                    text: "显示隐藏文章",
                    canCheck: true,
                    checked: Boolean(this.props.filter & FeedFilter.ShowHidden),
                    onClick: () => this.props.toggleFilter(FeedFilter.ShowHidden)
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