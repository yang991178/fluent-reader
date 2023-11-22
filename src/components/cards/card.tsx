import * as React from "react"
import { RSSSource, SourceOpenTarget } from "../../scripts/models/source"
import { RSSItem } from "../../scripts/models/item"
import { platformCtrl } from "../../scripts/utils"
import { FeedFilter } from "../../scripts/models/feed"
import { ViewConfigs } from "../../schema-types"

export namespace Card {
    export type Props = {
        feedId: string
        item: RSSItem
        source: RSSSource
        filter: FeedFilter
        selected?: boolean
        viewConfigs?: ViewConfigs
        shortcuts: (item: RSSItem, e: KeyboardEvent) => void
        markRead: (item: RSSItem) => void
        contextMenu: (feedId: string, item: RSSItem, e) => void
        showItem: (fid: string, item: RSSItem) => void
        showItemOnTarget: (fid: string, item: RSSItem, openTarget: SourceOpenTarget) => void
    }

    const openInBrowser = (props: Props, e: React.MouseEvent) => {
        props.markRead(props.item)
        window.utils.openExternal(props.item.link, platformCtrl(e))
    }

    export const bindEventsToProps = (props: Props) => {
        const timeouts: Array<NodeJS.Timeout> = [null]
        return ({
            onClick: (e: React.MouseEvent) => onClick(props, e, timeouts),
            onMouseUp: (e: React.MouseEvent) => onMouseUp(props, e),
            onKeyDown: (e: React.KeyboardEvent) => onKeyDown(props, e),
        })
    }

    const onClick = (props: Props, e: React.MouseEvent, timeouts: Array<NodeJS.Timeout>) => {
        e.preventDefault()
        e.stopPropagation()
        switch (props.source.openTarget) {
            case SourceOpenTarget.External: {
                openInBrowser(props, e)
                break
            }
            default: {
                if (!window.settings.getDoubleClickStatus()) {
                    props.markRead(props.item)
                    props.showItem(props.feedId, props.item)
                    break
                }
                if (timeouts[0] == null) {
                    timeouts[0] = setTimeout(() => {
                        clearTimeout(timeouts[0])
                        timeouts[0] = null
                        props.markRead(props.item)
                        props.showItem(props.feedId, props.item)
                    }, 200)
                } else {
                    clearTimeout(timeouts[0])
                    timeouts[0] = null
                    props.markRead(props.item)
                    props.showItemOnTarget(props.feedId, props.item, SourceOpenTarget.Webpage)
                }
                break
            }
        }
    }

    const onMouseUp = (props: Props, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        switch (e.button) {
            case 1:
                openInBrowser(props, e)
                break
            case 2:
                props.contextMenu(props.feedId, props.item, e)
        }
    }

    const onKeyDown = (props: Props, e: React.KeyboardEvent) => {
        props.shortcuts(props.item, e.nativeEvent)
    }
}
