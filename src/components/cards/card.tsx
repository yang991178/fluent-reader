import * as React from "react"
import { RSSSource, SourceOpenTarget } from "../../scripts/models/source"
import { RSSItem } from "../../scripts/models/item"

export namespace Card {
    export type Props = {
        feedId: string
        item: RSSItem
        source: RSSSource
        shortcuts: (item: RSSItem, key: string) => void
        markRead: (item: RSSItem) => void
        contextMenu: (feedId: string, item: RSSItem, e) => void
        showItem: (fid: string, item: RSSItem) => void
    }

    export const openInBrowser = (props: Props) => {
        props.markRead(props.item)
        window.utils.openExternal(props.item.link)
    }

    export const onClick = (props: Props, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        switch (props.source.openTarget) {
            case SourceOpenTarget.Local:
            case SourceOpenTarget.Webpage: {
                props.markRead(props.item)
                props.showItem(props.feedId, props.item)
                break
            }
            case SourceOpenTarget.External: {
                openInBrowser(props)
                break
            }
        }
    }

    export const onMouseUp = (props: Props, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        switch (e.button) {
            case 1:
                openInBrowser(props)
                break
            case 2:
                props.contextMenu(props.feedId, props.item, e)
        }
    }

    export const onKeyDown = (props: Props, e: React.KeyboardEvent) => {
        props.shortcuts(props.item, e.key)
    }
}