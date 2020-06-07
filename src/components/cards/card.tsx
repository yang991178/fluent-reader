import * as React from "react"
import { openExternal } from "../../scripts/utils"
import { RSSSource } from "../../scripts/models/source"
import { RSSItem } from "../../scripts/models/item"
import { FeedIdType } from "../../scripts/models/feed"

export interface CardProps {
    feedId: FeedIdType
    item: RSSItem
    source: RSSSource
    markRead: (item: RSSItem) => void
    contextMenu: (item: RSSItem, e) => void
    showItem: (fid: FeedIdType, item: RSSItem) => void
}

export class Card extends React.Component<CardProps> {
    openInBrowser = () => {
        this.props.markRead(this.props.item)
        openExternal(this.props.item.link)
    }

    onClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        this.props.markRead(this.props.item)
        this.props.showItem(this.props.feedId, this.props.item)
    }

    onMouseUp = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        switch (e.button) {
            case 1:
                this.openInBrowser()
                break
            case 2:
                this.props.contextMenu(this.props.item, e)
        }
    }
}