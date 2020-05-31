import * as React from "react"
import { RSSItem } from "../../scripts/models/item"
import { FeedReduxProps } from "../../containers/feed-container"
import { RSSFeed } from "../../scripts/models/feed"

type FeedProps = FeedReduxProps & {
    feed: RSSFeed
    items: RSSItem[]
    sourceMap: Object
    markRead: Function
    contextMenu: Function
    loadMore: Function
}

export class Feed extends React.Component<FeedProps> { }