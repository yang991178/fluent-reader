import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { markRead, RSSItem } from "../scripts/models/item"
import { openItemMenu } from "../scripts/models/app"
import { FeedIdType, loadMore, RSSFeed } from "../scripts/models/feed"
import { showItem, ViewType } from "../scripts/models/page"
import { Feed } from "../components/feeds/feed"

interface FeedContainerProps {
    feedId: FeedIdType
    viewType: ViewType
}

const getSources = (state: RootState) => state.sources
const getItems = (state: RootState) => state.items
const getFeed = (state: RootState, props: FeedContainerProps) => state.feeds[props.feedId]
const getView = (_, props: FeedContainerProps) => props.viewType

const makeMapStateToProps = () => {
    return createSelector(
        [getSources, getItems, getFeed, getView],
        (sources, items, feed, viewType) => ({
            feed: feed,
            items: feed.iids.map(iid => items[iid]),
            sourceMap: sources,
            viewType: viewType
        })
    )
}
const mapDispatchToProps = dispatch => {
    return {
        markRead: (item: RSSItem) => dispatch(markRead(item)),
        contextMenu: (feedId: FeedIdType, item: RSSItem, e) => dispatch(openItemMenu(item, feedId, e)),
        loadMore: (feed: RSSFeed) => dispatch(loadMore(feed)),
        showItem: (fid: FeedIdType, item: RSSItem) => dispatch(showItem(fid, item))
    }
}

const connector = connect(makeMapStateToProps, mapDispatchToProps)
export type FeedReduxProps = typeof connector
export const FeedContainer = connector(Feed)