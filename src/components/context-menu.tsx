import * as React from "react"
import { clipboard } from "electron"
import { openExternal } from "../scripts/utils"
import { ContextualMenu, IContextualMenuItem, ContextualMenuItemType } from "office-ui-fabric-react/lib/ContextualMenu"
import { ContextMenuType } from "../scripts/models/app"
import { RSSItem } from "../scripts/models/item"
import { ContextReduxProps } from "../containers/context-menu-container"

export type ContextMenuProps = ContextReduxProps & {
    type: ContextMenuType
    event?: MouseEvent
    item?: RSSItem
    markRead: Function
    markUnread: Function
    close: Function
}

export class ContextMenu extends React.Component<ContextMenuProps> {
    getItems = (): IContextualMenuItem[] => {
        switch (this.props.type) {
            case ContextMenuType.Item: return [
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
                    iconProps: { iconName: "StatusCircleInner", style: { fontSize: 12, textAlign: "center" } },
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
            default: return []
        }
    }

    render() {
        return this.props.type == ContextMenuType.Hidden ? null : (
            <ContextualMenu 
                items={this.getItems()} 
                target={this.props.event}
                onDismiss={() => this.props.close()} />
        )
    }
}