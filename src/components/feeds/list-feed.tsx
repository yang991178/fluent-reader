import * as React from "react"
import intl from "react-intl-universal"
import { FeedProps } from "./feed"
import {
    PrimaryButton,
    FocusZone,
    FocusZoneDirection,
    List,
} from "office-ui-fabric-react"
import { RSSItem } from "../../scripts/models/item"
import { AnimationClassNames } from "@fluentui/react"
import { ViewType } from "../../schema-types"
import ListCard from "../cards/list-card"
import MagazineCard from "../cards/magazine-card"
import CompactCard from "../cards/compact-card"
import { Card } from "../cards/card"

class ListFeed extends React.Component<FeedProps> {
    onRenderItem = (item: RSSItem) => {
        const props = {
            feedId: this.props.feed._id,
            key: item._id,
            item: item,
            source: this.props.sourceMap[item.source],
            filter: this.props.filter,
            viewConfigs: this.props.viewConfigs,
            shortcuts: this.props.shortcuts,
            markRead: this.props.markRead,
            contextMenu: this.props.contextMenu,
            showItem: this.props.showItem,
        } as Card.Props
        if (
            this.props.viewType === ViewType.List &&
            this.props.currentItem === item._id
        ) {
            props.selected = true
        }

        switch (this.props.viewType) {
            case ViewType.Magazine:
                return <MagazineCard {...props} />
            case ViewType.Compact:
                return <CompactCard {...props} />
            default:
                return <ListCard {...props} />
        }
    }

    getClassName = () => {
        switch (this.props.viewType) {
            case ViewType.Magazine:
                return "magazine-feed"
            case ViewType.Compact:
                return "compact-feed"
            default:
                return "list-feed"
        }
    }

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
                    direction={FocusZoneDirection.vertical}
                    className={this.getClassName()}
                    shouldReceiveFocus={this.canFocusChild}
                    data-is-scrollable>
                    <List
                        className={AnimationClassNames.slideUpIn10}
                        items={this.props.items}
                        onRenderCell={this.onRenderItem}
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

export default ListFeed
