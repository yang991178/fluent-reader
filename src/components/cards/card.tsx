import * as React from "react"
import { openExternal } from "../../scripts/utils"
import { RSSSource } from "../../scripts/models/source"
import { RSSItem } from "../../scripts/models/item"

export interface CardProps {
    item: RSSItem
    source: RSSSource
    markRead: Function
    contextMenu: Function
}

export class Card extends React.Component<CardProps> {
    openInBrowser = () => {
        this.props.markRead(this.props.item)
        openExternal(this.props.item.link)
    }

    onClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        this.openInBrowser()
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