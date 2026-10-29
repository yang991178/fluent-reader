import * as React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import intl from "react-intl-universal"
import { FeedProps } from "./feed"
import DefaultCard from "../cards/default-card"
import { RSSItem } from "../../scripts/models/item"
import { FocusZone, List, AnimationClassNames } from "@fluentui/react"
import { useFeedTabStop } from "../utils/hooks/useFeedTabStop"
import { FeedEnd } from "./feed-end"

const CardsFeed: React.FC<FeedProps> = props => {
    const { elementRef, onPagesUpdated } = useFeedTabStop()
    const [width, setWidth] = useState(window.innerWidth)
    const [height, setHeight] = useState(window.innerHeight)
    const observerRef = useRef<ResizeObserver>(null)

    useEffect(() => {
        setWidth(document.querySelector(".main").clientWidth - 40)
        observerRef.current = new ResizeObserver(
            (entries: ResizeObserverEntry[]) => {
                if (entries) {
                    setWidth(entries[0].contentRect.width - 40)
                    setHeight(window.innerHeight)
                }
            }
        )
        observerRef.current.observe(document.querySelector(".main"))
        return () => {
            observerRef.current.disconnect()
        }
    }, [])

    const getItemCountForPage = useCallback(() => {
        let elemPerRow = Math.floor(width / 280)
        let rows = Math.ceil(height / 304)
        return elemPerRow * rows
    }, [width, height])

    const getPageHeight = useCallback(() => {
        return height + (304 - (height % 304))
    }, [height])

    const flexFixItems = () => {
        let elemPerRow = Math.floor(width / 280)
        let elemLastRow = props.items.length % elemPerRow
        let items = [...props.items]
        for (let i = 0; i < elemPerRow - elemLastRow; i += 1) items.push(null)
        return items
    }

    const onRenderItem = (item: RSSItem, index: number) =>
        item ? (
            <DefaultCard
                feedId={props.feed._id}
                key={item._id}
                item={item}
                source={props.sourceMap[item.source]}
                filter={props.filter}
                shortcuts={props.shortcuts}
                markRead={props.markRead}
                contextMenu={props.contextMenu}
                showItem={props.showItem}
            />
        ) : (
            <div className="flex-fix" key={"f-" + index}></div>
        )

    return (
        props.feed.loaded && (
            <FocusZone
                elementRef={elementRef}
                as="div"
                id="refocus"
                className="cards-feed-container"
                data-is-scrollable>
                <List
                    className={AnimationClassNames.slideUpIn10}
                    items={flexFixItems()}
                    onRenderCell={onRenderItem}
                    onPagesUpdated={onPagesUpdated}
                    getItemCountForPage={getItemCountForPage}
                    getPageHeight={getPageHeight}
                    ignoreScrollingState
                    usePageCache
                />
                <FeedEnd feed={props.feed} loadMore={props.loadMore} />
                {props.items.length === 0 && (
                    <div className="empty">{intl.get("article.empty")}</div>
                )}
            </FocusZone>
        )
    )
}

export default CardsFeed
