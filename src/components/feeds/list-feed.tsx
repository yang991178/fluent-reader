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

const ListFeed: React.FC<FeedProps> = props => {
    const onRenderItem = (item: RSSItem) => {
        const cardProps = {
            feedId: props.feed._id,
            key: item._id,
            item: item,
            source: props.sourceMap[item.source],
            filter: props.filter,
            viewConfigs: props.viewConfigs,
            shortcuts: props.shortcuts,
            markRead: props.markRead,
            contextMenu: props.contextMenu,
            showItem: props.showItem,
        } as Card.Props
        if (
            props.viewType === ViewType.List &&
            props.currentItem === item._id
        ) {
            cardProps.selected = true
        }

        switch (props.viewType) {
            case ViewType.Magazine:
                return <MagazineCard {...cardProps} />
            case ViewType.Compact:
                return <CompactCard {...cardProps} />
            default:
                return <ListCard {...cardProps} />
        }
    }

    const getClassName = () => {
        switch (props.viewType) {
            case ViewType.Magazine:
                return "magazine-feed"
            case ViewType.Compact:
                return "compact-feed"
            default:
                return "list-feed"
        }
    }

    const canFocusChild = (el: HTMLElement) => {
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

    return (
        props.feed.loaded && (
            <FocusZone
                as="div"
                id="refocus"
                direction={FocusZoneDirection.vertical}
                className={getClassName()}
                shouldReceiveFocus={canFocusChild}
                data-is-scrollable>
                <List
                    className={AnimationClassNames.slideUpIn10}
                    items={props.items}
                    onRenderCell={onRenderItem}
                    ignoreScrollingState
                    usePageCache
                />
                {props.feed.loaded && !props.feed.allLoaded ? (
                    <div className="load-more-wrapper">
                        <PrimaryButton
                            id="load-more"
                            text={intl.get("loadMore")}
                            disabled={props.feed.loading}
                            onClick={() => props.loadMore(props.feed)}
                        />
                    </div>
                ) : null}
                {props.items.length === 0 && (
                    <div className="empty">{intl.get("article.empty")}</div>
                )}
            </FocusZone>
        )
    )
}

export default ListFeed
