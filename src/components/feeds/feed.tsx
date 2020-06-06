import * as React from "react"
import { RSSItem } from "../../scripts/models/item"
import { FeedReduxProps } from "../../containers/feed-container"
import { RSSFeed, FeedIdType } from "../../scripts/models/feed"

type FeedProps = FeedReduxProps & {
    feed: RSSFeed
    items: RSSItem[]
    sourceMap: Object
    markRead: (item: RSSItem) => void
    contextMenu: (item: RSSItem, e) => void
    loadMore: (feed: RSSFeed) => void
    showItem: (fid: FeedIdType, index: number) => void
}

export class Feed extends React.Component<FeedProps> { }