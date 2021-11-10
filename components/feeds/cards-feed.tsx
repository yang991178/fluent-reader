import * as React from "react"
import intl from "react-intl-universal"
import { FeedProps } from "./feed"
import DefaultCard from "../cards/default-card"
import { PrimaryButton, FocusZone } from "office-ui-fabric-react"
import { RSSItem } from "../../scripts/models/item"
import { List, AnimationClassNames } from "@fluentui/react"

class CardsFeed extends React.Component<FeedProps> {
    observer: ResizeObserver
    state = { width: window.innerWidth, height: window.innerHeight }

    updateWindowSize = (entries: ResizeObserverEntry[]) => {
        if (entries) {
            this.setState({
                width: entries[0].contentRect.width - 40,
                height: window.innerHeight,
            })
        }
    }

    componentDidMount() {
        this.setState({
            width: document.querySelector(".main").clientWidth - 40,
        })
        this.observer = new ResizeObserver(this.updateWindowSize)
        this.observer.observe(document.querySelector(".main"))
    }
    componentWillUnmount() {
        this.observer.disconnect()
    }

    getItemCountForPage = () => {
        let elemPerRow = Math.floor(this.state.width / 280)
        let rows = Math.ceil(this.state.height / 304)
        return elemPerRow * rows
    }
    getPageHeight = () => {
        return this.state.height + (304 - (this.state.height % 304))
    }

    flexFixItems = () => {
        let elemPerRow = Math.floor(this.state.width / 280)
        let elemLastRow = this.props.items.length % elemPerRow
        let items = [...this.props.items]
        for (let i = 0; i < elemPerRow - elemLastRow; i += 1) items.push(null)
        return items
    }
    onRenderItem = (item: RSSItem, index: number) =>
        item ? (
            <DefaultCard
                feedId={this.props.feed._id}
                key={item._id}
                item={item}
                source={this.props.sourceMap[item.source]}
                filter={this.props.filter}
                shortcuts={this.props.shortcuts}
                markRead={this.props.markRead}
                contextMenu={this.props.contextMenu}
                showItem={this.props.showItem}
            />
        ) : (
            <div className="flex-fix" key={"f-" + index}></div>
        )

    canFocusChild = (el: HTMLElement) => {
        if (el.id === "load-more") {
            const container = document.getElementById("refocus")
            const result =
                container.scrollTop >
                container.scrollHeight - 2 * container.offsetHeight
            if (!result) container.scrollTop += 100
            return result
        } else {
            return true
        }
    }

    render() {
        return (
            this.props.feed.loaded && (
                <FocusZone
                    as="div"
                    id="refocus"
                    className="cards-feed-container"
                    shouldReceiveFocus={this.canFocusChild}
                    data-is-scrollable>
                    <List
                        className={AnimationClassNames.slideUpIn10}
                        items={this.flexFixItems()}
                        onRenderCell={this.onRenderItem}
                        getItemCountForPage={this.getItemCountForPage}
                        getPageHeight={this.getPageHeight}
                        ignoreScrollingState
                        usePageCache
                    />
                    {this.props.feed.loaded && !this.props.feed.allLoaded ? (
                        <div className="load-more-wrapper">
                            <PrimaryButton
                                id="load-more"
                                text={intl.get("loadMore")}
                                disabled={this.props.feed.loading}
                                onClick={() =>
                                    this.props.loadMore(this.props.feed)
                                }
                            />
                        </div>
                    ) : null}
                    {this.props.items.length === 0 && (
                        <div className="empty">{intl.get("article.empty")}</div>
                    )}
                </FocusZone>
            )
        )
    }
}

export default CardsFeed
