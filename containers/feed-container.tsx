import { connect } from "react-redux"
import { createSelector } from "reselect"
import { RootState } from "../scripts/reducer"
import { markRead, RSSItem, itemShortcuts } from "../scripts/models/item"
import { openItemMenu } from "../scripts/models/app"
import { loadMore, RSSFeed } from "../scripts/models/feed"
import { showItem } from "../scripts/models/page"
import { ViewType } from "../schema-types"
import { Feed } from "../components/feeds/feed"

interface FeedContainerProps {
    feedId: string
    viewType: ViewType
}

const getSources = (state: RootState) => state.sources
const getItems = (state: RootState) => state.items
const getFeed = (state: RootState, props: FeedContainerProps) =>
    state.feeds[props.feedId]
const getFilter = (state: RootState) => state.page.filter
const getView = (_, props: FeedContainerProps) => props.viewType
const getViewConfigs = (state: RootState) => state.page.viewConfigs
const getCurrentItem = (state: RootState) => state.page.itemId

const makeMapStateToProps = () => {
    return createSelector(
        [
            getSources,
            getItems,
            getFeed,
            getView,
            getFilter,
            getViewConfigs,
            getCurrentItem,
        ],
        (sources, items, feed, viewType, filter, viewConfigs, currentItem) => ({
            feed: feed,
            items: feed.iids.map(iid => items[iid]),
            sourceMap: sources,
            filter: filter,
            viewType: viewType,
            viewConfigs: viewConfigs,
            currentItem: currentItem,
        })
    )
}
const mapDispatchToProps = dispatch => {
    return {
        shortcuts: (item: RSSItem, e: KeyboardEvent) =>
            dispatch(itemShortcuts(item, e)),
        markRead: (item: RSSItem) => dispatch(markRead(item)),
        contextMenu: (feedId: string, item: RSSItem, e) =>
            dispatch(openItemMenu(item, feedId, e)),
        loadMore: (feed: RSSFeed) => dispatch(loadMore(feed)),
        showItem: (fid: string, item: RSSItem) => dispatch(showItem(fid, item)),
    }
}

const connector = connect(makeMapStateToProps, mapDispatchToProps)
export type FeedReduxProps = typeof connector
export const FeedContainer = connector(Feed)
