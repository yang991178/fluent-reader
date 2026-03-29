import * as React from "react"
import { useCallback } from "react"
import { RSSItem, markRead, itemShortcuts } from "../../scripts/models/item"
import { openItemMenu } from "../../scripts/models/app"
import { RSSFeed, FeedFilter, loadMore } from "../../scripts/models/feed"
import { showItem } from "../../scripts/models/page"
import { useAppSelector, useAppDispatch } from "../../scripts/reducer"
import { ViewType, ViewConfigs } from "../../schema-types"
import CardsFeed from "./cards-feed"
import ListFeed from "./list-feed"

export type FeedProps = {
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

interface FeedOwnProps {
    feedId: string
    viewType: ViewType
}

export const Feed: React.FC<FeedOwnProps> = ({ feedId, viewType }) => {
    const dispatch = useAppDispatch()

    const feed = useAppSelector(s => s.feeds[feedId])
    const items = useAppSelector(s =>
        s.feeds[feedId] ? s.feeds[feedId].iids.map(iid => s.items[iid]) : []
    )
    const sourceMap = useAppSelector(s => s.sources)
    const filter = useAppSelector(s => s.page.filter)
    const viewConfigs = useAppSelector(s => s.page.viewConfigs)
    const currentItem = useAppSelector(s => s.page.itemId)

    const handleShortcuts = useCallback(
        (item: RSSItem, e: KeyboardEvent) => dispatch(itemShortcuts(item, e)),
        []
    )
    const handleMarkRead = useCallback(
        (item: RSSItem) => dispatch(markRead(item)),
        []
    )
    const handleContextMenu = useCallback(
        (fid: string, item: RSSItem, e) => dispatch(openItemMenu(item, fid, e)),
        []
    )
    const handleLoadMore = useCallback((f: RSSFeed) => {
        dispatch(loadMore(f))
    }, [])
    const handleShowItem = useCallback(
        (fid: string, item: RSSItem) => dispatch(showItem(fid, item)),
        []
    )

    const feedProps: FeedProps = {
        feed,
        viewType,
        viewConfigs,
        items,
        currentItem,
        sourceMap,
        filter,
        shortcuts: handleShortcuts,
        markRead: handleMarkRead,
        contextMenu: handleContextMenu,
        loadMore: handleLoadMore,
        showItem: handleShowItem,
    }

    switch (viewType) {
        case ViewType.Cards:
            return <CardsFeed {...feedProps} />
        case ViewType.Magazine:
        case ViewType.Compact:
        case ViewType.List:
            return <ListFeed {...feedProps} />
    }
}
