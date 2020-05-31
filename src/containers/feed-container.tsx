import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import CardsFeed from "../components/feeds/cards-feed"
import { markRead, markUnread } from "../scripts/models/item"
import { openItemMenu } from "../scripts/models/app"
import { FeedIdType, loadMore } from "../scripts/models/feed"

interface FeedContainerProps {
    feedId: FeedIdType
}

const getSources = (state: RootState) => state.sources
const getItems = (state: RootState) => state.items
const getFeed = (state: RootState) => state.feeds[state.page.feedId]

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
        markRead: item => dispatch(markRead(item)),
        contextMenu: (item, e) => dispatch(openItemMenu(item, e)),
        loadMore: feed => dispatch(loadMore(feed))
    }
}

const connector = connect(makeMapStateToProps, mapDispatchToProps)
export type FeedReduxProps = typeof connector
export const FeedContainer = connector(CardsFeed)