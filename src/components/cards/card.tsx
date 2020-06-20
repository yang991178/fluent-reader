import * as React from "react"
import { openExternal } from "../../scripts/utils"
import { RSSSource, SourceOpenTarget } from "../../scripts/models/source"
import { RSSItem } from "../../scripts/models/item"

export interface CardProps {
    feedId: string
    item: RSSItem
    source: RSSSource
    shortcuts: (item: RSSItem, key: string) => void
    markRead: (item: RSSItem) => void
    contextMenu: (feedId: string, item: RSSItem, e) => void
    showItem: (fid: string, item: RSSItem) => void
}

export class Card extends React.Component<CardProps> {
    openInBrowser = () => {
        this.props.markRead(this.props.item)
        openExternal(this.props.item.link)
    }

    onClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        switch (this.props.source.openTarget) {
            case SourceOpenTarget.Local:
            case SourceOpenTarget.Webpage: {
                this.props.markRead(this.props.item)
                this.props.showItem(this.props.feedId, this.props.item)
                break
            }
            case SourceOpenTarget.External: {
                this.openInBrowser()
                break
            }
        }
    }

    onMouseUp = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        switch (e.button) {
            case 1:
                this.openInBrowser()
                break
            case 2:
                this.props.contextMenu(this.props.feedId, this.props.item, e)
        }
    }

    onKeyDown = (e: React.KeyboardEvent) => {
        this.props.shortcuts(this.props.item, e.key)
    }
}