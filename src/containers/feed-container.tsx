import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import CardsFeed from "../components/feeds/cards-feed"
import { markRead, RSSItem } from "../scripts/models/item"
import { openItemMenu } from "../scripts/models/app"
import { FeedIdType, loadMore, RSSFeed } from "../scripts/models/feed"
import { showItem } from "../scripts/models/page"

interface FeedContainerProps {
    feedId: FeedIdType
}

const getSources = (state: RootState) => state.sources
const getItems = (state: RootState) => state.items
const getFeed = (state: RootState, props: FeedContainerProps) => state.feeds[props.feedId]

const makeMapStateToProps = () => {
    return createSelector(
        [getSources, getItems, getFeed],
        (sources, items, feed) => ({
            feed: feed,
            items: feed.iids.map(iid => items[iid]),
            sourceMap: sources
        })
    )
}
const mapDispatchToProps = dispatch => {
    return {
        markRead: (item: RSSItem) => dispatch(markRead(item)),
        contextMenu: (item: RSSItem, e) => dispatch(openItemMenu(item, e)),
        loadMore: (feed: RSSFeed) => dispatch(loadMore(feed)),
        showItem: (fid: FeedIdType, item: RSSItem) => dispatch(showItem(fid, item))
    }
}

const connector = connect(makeMapStateToProps, mapDispatchToProps)
export type FeedReduxProps = typeof connector
export const FeedContainer = connector(CardsFeed)