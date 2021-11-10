import * as React from "react"
import { RSSItem } from "../../scripts/models/item"
import { FeedReduxProps } from "../../containers/feed-container"
import { RSSFeed, FeedFilter } from "../../scripts/models/feed"
import { ViewType, ViewConfigs } from "../../schema-types"
import CardsFeed from "./cards-feed"
import ListFeed from "./list-feed"

export type FeedProps = FeedReduxProps & {
    feed: RSSFeed
    viewType: ViewType
    viewConfigs?: ViewConfigs
    items: RSSItem[]
    currentItem: number
    sourceMap: Object
    filter: FeedFilter
    shortcuts: (item: RSSItem, e: KeyboardEvent) => void
    markRead: (item: RSSItem) => void
    contextMenu: (feedId: string, item: RSSItem, e) => void
    loadMore: (feed: RSSFeed) => void
    showItem: (fid: string, item: RSSItem) => void
}

export class Feed extends React.Component<FeedProps> {
    render() {
        switch (this.props.viewType) {
            case ViewType.Cards:
                return <CardsFeed {...this.props} />
            case ViewType.Magazine:
            case ViewType.Compact:
            case ViewType.List:
                return <ListFeed {...this.props} />
        }
    }
}
