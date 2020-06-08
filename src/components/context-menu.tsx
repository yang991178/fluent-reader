import * as React from "react"
import { clipboard } from "electron"
import { openExternal, cutText, googleSearch } from "../scripts/utils"
import { ContextualMenu, IContextualMenuItem, ContextualMenuItemType, DirectionalHint } from "office-ui-fabric-react/lib/ContextualMenu"
import { ContextMenuType } from "../scripts/models/app"
import { RSSItem } from "../scripts/models/item"
import { ContextReduxProps } from "../containers/context-menu-container"
import { FeedIdType } from "../scripts/models/feed"
import { ViewType } from "../scripts/models/page"

export type ContextMenuProps = ContextReduxProps & {
    type: ContextMenuType
    event?: MouseEvent | string
    position?: [number, number]
    item?: RSSItem
    feedId?: FeedIdType
    text?: string
    viewType: ViewType
    showItem: (feedId: FeedIdType, item: RSSItem) => void
    markRead: (item: RSSItem) => void
    markUnread: (item: RSSItem) => void
    switchView: (viewType: ViewType) => void
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
                    key: "markBelowAsRead",
                    text: "将以下标为已读"
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