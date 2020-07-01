import * as React from "react"
import intl from "react-intl-universal"
import { FeedProps } from "./feed"
import { DefaultButton, FocusZone, FocusZoneDirection, List } from 'office-ui-fabric-react';
import ListCard from "../cards/list-card";
import { RSSItem } from "../../scripts/models/item";
import { AnimationClassNames } from "@fluentui/react";

class ListFeed extends React.Component<FeedProps> {
    onRenderItem = (item: RSSItem) => (
        <ListCard 
            feedId={this.props.feed._id}
            key={item._id}
            item={item} 
            source={this.props.sourceMap[item.source]} 
            shortcuts={this.props.shortcuts}
            markRead={this.props.markRead}
            contextMenu={this.props.contextMenu}
            showItem={this.props.showItem} />
    )

    render() {
        return this.props.feed.loaded && (
            <FocusZone as="div" id="refocus" direction={FocusZoneDirection.vertical} className="list-feed" data-is-scrollable>
                <List 
                    className={AnimationClassNames.slideUpIn10}
                    items={this.props.items} 
                    onRenderCell={this.onRenderItem} 
                    usePageCache />
                {
                    (this.props.feed.loaded && !this.props.feed.allLoaded)
                    ? <div className="load-more-wrapper"><DefaultButton 
                        text={intl.get("loadMore")} 
                        disabled={this.props.feed.loading}
                        onClick={() => this.props.loadMore(this.props.feed)} /></div>
                    : null
                }
                { this.props.items.length === 0 && (
                    <div className="empty">{intl.get("article.empty")}</div>
                )}
            </FocusZone>
        )
    }
}

export default ListFeed